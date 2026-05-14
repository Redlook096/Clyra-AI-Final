#!/usr/bin/env python3
"""Fast parallel AI clipper — captions for transcript + frames + Whisper on clip only. Under 60s."""
import sys, json, os, subprocess, shutil, re, time, base64, xml.etree.ElementTree as ET
from threading import Thread

_ff = os.path.join(os.path.expanduser("~"), "bin", "ffmpeg")
FFMPEG = _ff if os.path.exists(_ff) else "ffmpeg"

def log(step, status, **kw):
    print(json.dumps({"type":"progress","step":step,"status":status,**kw}), flush=True)

def error(msg):
    print(json.dumps({"type":"error","message":msg}), flush=True)
    sys.exit(1)

def fmt(s):
    m, sec = int(s//60), s%60
    return f"{m}:{sec:05.2f}"

def main():
    if len(sys.argv) < 2: error("Usage: clipper-pipeline.py <url> [config_json]")
    url = sys.argv[1].strip()
    cfg = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    font = cfg.get("font","Impact")
    fs = int(cfg.get("font_size",52))
    tc = cfg.get("text_colour","#FFFFFF")
    sc = cfg.get("stroke_colour","#000000")
    pos = cfg.get("position","bottom-centre")
    mt = cfg.get("moment_type","viral")
    cn = re.sub(r'[^\w\s-]','',cfg.get("clip_name","clip_final")).strip()[:50] or "clip_final"
    td, od = "./tmp", "./output"
    os.makedirs(td,exist_ok=True); os.makedirs(od,exist_ok=True)
    log("start","running",message="Clipper starting",url=url)
    try:
        from pytubefix import YouTube
        import whisper
        yt = YouTube(url)
        title, dur = yt.title, yt.length
        results = {}
        # ── STEP 1: Parallel download 360p video + get captions ──
        log("download","running",message="Downloading video + captions...")
        def dv():
            s = (yt.streams.filter(progressive=True,res="360p").first()
                 or yt.streams.filter(progressive=True,res="480p").first()
                 or yt.streams.filter(progressive=True).first())
            results["video"] = s.download(td, filename="video.mp4")
        def gc():
            try:
                caps = yt.captions
                track = caps.get('a.en') or caps.get('en') or list(caps.values())[0] if caps else None
                if track:
                    xml = track.xml_captions
                    root = ET.fromstring(xml)
                    words = []
                    for el in root:
                        if el.tag == 'text':
                            s = float(el.get('start','0'))
                            d = float(el.get('dur','1'))
                            txt = re.sub(r'[^\w\s]','',(el.text or '')).strip().upper()
                            wds = txt.split()
                            wd = d/max(len(wds),1)
                            for i,w in enumerate(wds):
                                if w: words.append({"word":w,"start":s+i*wd,"end":s+(i+1)*wd})
                    results["words"] = words
                    results["transcript"] = " ".join(f"[{w['start']:.1f}]{w['word']}" for w in words)
            except: pass
        t1,t2 = Thread(target=dv), Thread(target=gc)
        t1.start(); t2.start(); t1.join(); t2.join()
        # Fallback: if no captions, download audio + transcribe
        if not results.get("words"):
            log("transcribe","running",message="No captions, transcribing...")
            a = yt.streams.filter(only_audio=True).order_by("abr").last()
            ap = a.download(td,filename="audio.mp4")
            m = whisper.load_model("tiny")
            r = m.transcribe(ap,word_timestamps=True,language="en",fp16=False)
            words = []
            for seg in r.get("segments",[]):
                for w in seg.get("words",[]):
                    wt = re.sub(r'[^\w\s]','',w["word"].strip()).upper()
                    if wt: words.append({"word":wt,"start":float(w["start"]),"end":float(w["end"])})
            results["words"] = words
            results["transcript"] = " ".join(f"[{ww['start']:.1f}]{ww['word']}" for ww in words)
            os.remove(ap)
        wc = len(results.get("words",[]))
        log("download","complete",message=f"Ready ({wc} words)",title=title,duration=dur,duration_fmt=fmt(dur),word_count=wc)
        # ── STEP 2: Extract frames (fast, 10 tiny 320x180 JPEGs) ──
        log("frames","running",message="Extracting frames...")
        nf=10; iv=dur/nf; frames=[]
        for i in range(nf):
            ts=iv*i+iv/2; op=os.path.join(td,f"f{i:02d}.jpg")
            subprocess.run([FFMPEG,"-y","-ss",str(ts),"-i",results["video"],"-vframes","1","-s","320x180","-q:v","8",op],capture_output=True)
            if os.path.exists(op):
                with open(op,"rb") as f: frames.append({"ts":round(ts,1),"b64":base64.b64encode(f.read()).decode()})
        log("frames","complete",message=f"{len(frames)} frames",frames=len(frames))
        # ── STEP 3: AI analysis ──
        log("analyze","running",message=f"AI finding {mt} moment...")
        cs,ce = 0, min(45,dur); reason="Auto"
        try:
            import urllib.request
            content=[{"type":"text","text":f"Find best 30-45s {mt} clip. Use visual frames AND transcript. Reply ONLY JSON: {{\"start\":0,\"end\":45,\"reason\":\"why\"}}"}]
            for frm in frames[:8]:
                content.append({"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":frm["b64"]}})
                content.append({"type":"text","text":f"t={frm['ts']}s"})
            content.append({"type":"text","text":results.get("transcript","")[:2000]})
            req = urllib.request.Request("http://localhost:3000/api/deepseek/chat",
                data=json.dumps({"model":"deepseek-chat","messages":[{"role":"user","content":json.dumps(content)}],"temperature":0.7,"max_tokens":120,"stream":False}).encode(),
                headers={"Content-Type":"application/json"})
            resp = urllib.request.urlopen(req,timeout=25)
            ai = json.loads(resp.read()).get("choices",[{}])[0].get("message",{}).get("content","")
            m = re.search(r'\{.*\}',ai,re.DOTALL)
            if m:
                c = json.loads(m.group())
                cs=float(c.get("start",dur*.15)); ce=float(c.get("end",min(cs+45,dur)))
                reason=c.get("reason",reason)
        except:
            seed=int(time.time()*1000)%100
            secs=[(.05,.15),(.15,.25),(.25,.35),(.35,.50),(.50,.65),(.60,.75),(.70,.85),(.10,.20),(.30,.45),(.55,.70)]
            s=secs[seed%len(secs)]; cs=max(0,dur*s[0]); ce=min(dur,max(cs+35,dur*s[1]))
            reason=f"Auto (seed {seed})"
        cd=ce-cs
        if cd<30: ce=min(dur,cs+35)
        if cd>45: ce=cs+45
        cd=ce-cs; cs,ce=round(cs,1),round(ce,1)
        log("analyze","complete",message=reason,reason=reason,clip_start=cs,clip_end=ce,clip_duration=round(cd,1))
        # ── STEP 4: -c copy clip ──
        log("clip","running",message=f"Cutting {cs}s→{ce}s...")
        cp=os.path.join(td,"clip.mp4")
        subprocess.run([FFMPEG,"-y","-ss",str(cs),"-i",results["video"],"-t",str(cd),"-c","copy",cp],check=True,capture_output=True,timeout=30)
        log("clip","complete",message=f"Cut ({round(cd)}s)")
        # ── STEP 5: Whisper on clip for accurate word subtitles ──
        log("subtitles","running",message="Accurate subtitles...")
        m2=whisper.load_model("tiny")
        r2=m2.transcribe(cp,word_timestamps=True,language="en",fp16=False)
        cw=[]
        for seg in r2.get("segments",[]):
            for w in seg.get("words",[]):
                wt=re.sub(r'[^\w\s]','',w["word"].strip()).upper()
                if wt: cw.append({"word":wt,"start":float(w["start"]),"end":float(w["end"])})
        def hb(h): h=h.lstrip("#"); return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}"
        am={"bottom-centre":2,"bottom":2,"centre":5,"center":5,"top-centre":8,"top":8}
        al=am.get(pos,2); mv=80 if al==2 else 0
        def ts(s): return f"0:{int(s//60):02d}:{s%60:05.2f}"
        ap=os.path.join(td,"subs.ass")
        with open(ap,"w") as f:
            f.write(f"[Script Info]\nPlayResX:1280\nPlayResY:720\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,Bold,Alignment,MarginV,Outline,Shadow\nStyle: W,{font},{fs},{hb(tc)},{hb(sc)},1,{al},{mv},3,0\n[Events]\nFormat: Layer,Start,End,Style,Text\n")
            for w in cw:
                ws=max(0,w["start"]); we=min(w["end"],ws+.4)
                if ws<we: f.write(f"Dialogue: 0,{ts(ws)},{ts(we)},W,,{w['word']}\n")
        log("subtitles","complete",message=f"{len(cw)} word subtitles",word_count=len(cw))
        # ── STEP 6: Burn ──
        log("burn","running",message="Burning...")
        op=os.path.join(od,f"{cn}.mp4")
        subprocess.run([FFMPEG,"-y","-i",cp,"-vf",f"ass={ap}","-c:v","libx264","-preset","ultrafast","-crf","23","-c:a","copy",op],check=True,capture_output=True,timeout=60)
        log("burn","complete",message="Ready!")
        shutil.rmtree(td,ignore_errors=True)
        ct=[w["word"] for w in cw if len(w["word"])>2]
        cap=" ".join(ct[:15])[:150] if ct else title[:120]
        ht={"viral":"#mustwatch #viral","funny":"#funny #comedy","dramatic":"#drama","inspiring":"#inspiration","surprising":"#wow","action":"#action"}.get(mt,"#mustwatch")
        wps=len(cw)/max(cd,1); uniq=len(set(w["word"] for w in cw))
        scv=round(min(10,max(1,5+wps*.5+(uniq/max(len(cw),1))*2)),1)
        lb="🔥 Very High" if scv>=8 else "📈 High" if scv>=6 else "👍 Moderate"
        log("complete","complete",message="All done!",output=f"./output/{cn}.mp4",title=title,original_duration=fmt(dur),clip_duration=f"{round(cd)}s",clip_start=cs,clip_end=ce,font=font,font_size=fs,position=pos,reason=reason,moment_type=mt,caption=cap,hashtags=ht,virality_score=scv,virality_label=lb)
    except Exception as exc:
        shutil.rmtree(td,ignore_errors=True)
        error(f"{type(exc).__name__}: {exc}")

if __name__=="__main__":
    main()
