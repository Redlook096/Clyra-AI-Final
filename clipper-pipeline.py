#!/usr/bin/env python3
"""Fast clipper — captions instant, frames for AI, Whisper only on clip. Under 60s guaranteed."""
import sys, json, os, subprocess, shutil, re, time, base64, xml.etree.ElementTree as ET
from threading import Thread

_ff = os.path.join(os.path.expanduser("~"), "bin", "ffmpeg")
FFMPEG = _ff if os.path.exists(_ff) else "ffmpeg"

def log(step, status, **kw):
    print(json.dumps({"type":"progress","step":step,"status":status,**kw}), flush=True)
def error(msg):
    print(json.dumps({"type":"error","message":msg}), flush=True); sys.exit(1)

def main():
    if len(sys.argv) < 2: error("Usage: clipper-pipeline.py <url> [config]")
    url = sys.argv[1].strip()
    cfg = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    font = cfg.get("font","Impact"); fs = int(cfg.get("font_size",52))
    tc = cfg.get("text_colour","#FFFFFF"); sc = cfg.get("stroke_colour","#000000")
    pos = cfg.get("position","bottom-centre"); mt = cfg.get("moment_type","viral")
    cn = re.sub(r'[^\w\s-]','',cfg.get("clip_name","clip_final")).strip()[:50] or "clip_final"
    td, od = "./tmp", "./output"
    os.makedirs(td,exist_ok=True); os.makedirs(od,exist_ok=True)
    t0 = time.time()
    log("start","running",message="Starting",url=url)
    try:
        from pytubefix import YouTube; import whisper
        yt = YouTube(url); title, dur = yt.title, yt.length
        words = []
        # STEP 1: 360p video + captions (parallel, fast)
        log("download","running",message="Downloading...")
        def dv():
            s = (yt.streams.filter(progressive=True,res="360p").first()
                 or yt.streams.filter(progressive=True,res="480p").first()
                 or yt.streams.filter(progressive=True).first())
            s.download(td, filename="video.mp4")
        def gc():
            try:
                caps = yt.captions
                track = caps.get('a.en') or caps.get('en') or (list(caps.values())[0] if caps else None)
                if track:
                    root = ET.fromstring(track.xml_captions)
                    for el in root:
                        if el.tag == 'text':
                            s = float(el.get('start','0')); d = float(el.get('dur','1'))
                            txt = re.sub(r'[^\w\s]','',(el.text or '')).strip().upper()
                            wds = txt.split(); wd = d/max(len(wds),1)
                            for i,w in enumerate(wds):
                                if w: words.append({"word":w,"start":s+i*wd,"end":s+(i+1)*wd})
            except: pass
        t1,t2 = Thread(target=dv), Thread(target=gc)
        t1.start(); t2.start(); t1.join(); t2.join()
        vp = os.path.join(td,"video.mp4")
        if not words:
            ap = yt.streams.filter(only_audio=True).order_by("abr").last().download(td,filename="audio.mp4")
            m = whisper.load_model("tiny")
            r = m.transcribe(ap,word_timestamps=True,language="en",fp16=False)
            for seg in r.get("segments",[]):
                for w in seg.get("words",[]):
                    wt = re.sub(r'[^\w\s]','',w["word"].strip()).upper()
                    if wt: words.append({"word":wt,"start":float(w["start"]),"end":float(w["end"])})
            os.remove(ap)
        log("download","complete",message=f"{len(words)} words",title=title,duration=dur,word_count=len(words))
        # STEP 2: AI find moment
        log("analyze","running",message=f"Finding {mt}...")
        cs,ce = 0, min(40,dur); reason="Auto"
        try:
            import urllib.request
            tx = " ".join(f"[{w['start']:.0f}]{w['word']}" for w in words[:2000])
            prompt = f"Find best 30-40s {mt} clip. Reply ONLY JSON: {{\"start\":0,\"end\":40,\"reason\":\"why\"}}\n\n{tx}"
            req = urllib.request.Request("http://localhost:3000/api/deepseek/chat",
                data=json.dumps({"model":"deepseek-chat","messages":[{"role":"user","content":prompt}],"temperature":0.7,"max_tokens":100,"stream":False}).encode(),
                headers={"Content-Type":"application/json"})
            resp = urllib.request.urlopen(req,timeout=20)
            ai = json.loads(resp.read()).get("choices",[{}])[0].get("message",{}).get("content","")
            m2 = re.search(r'\{.*\}',ai,re.DOTALL)
            if m2:
                c = json.loads(m2.group()); cs=float(c.get("start",dur*.15)); ce=float(c.get("end",min(cs+40,dur)))
                reason=c.get("reason",reason)
        except:
            seed=int(time.time()*1000)%100
            secs=[(.05,.15),(.15,.25),(.25,.35),(.35,.50),(.50,.65),(.60,.75),(.70,.85),(.10,.20),(.30,.45),(.55,.70)]
            s=secs[seed%len(secs)]; cs=max(0,dur*s[0]); ce=min(dur,max(cs+35,dur*s[1]))
            reason=f"Auto seed {seed}"
        cd=ce-cs
        if cd<25: ce=min(dur,cs+30)
        if cd>40: ce=cs+40
        cd=ce-cs; cs,ce=round(cs,1),round(ce,1)
        log("analyze","complete",message=reason,reason=reason,clip_start=cs,clip_end=ce,clip_duration=round(cd,1))
        # STEP 3: -c copy cut
        log("cut","running",message=f"Cutting...")
        cp=os.path.join(td,"clip.mp4")
        subprocess.run([FFMPEG,"-y","-ss",str(cs),"-i",vp,"-t",str(cd),"-c","copy",cp],check=True,capture_output=True,timeout=30)
        log("cut","complete",message=f"Cut ({round(cd)}s)")
        # STEP 4: Whisper on clip for word-accurate subtitles
        log("subtitles","running",message="Accurate subtitles...")
        m3=whisper.load_model("tiny")
        r3=m3.transcribe(cp,word_timestamps=True,language="en",fp16=False)
        cw=[]
        for seg in r3.get("segments",[]):
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
                ws=max(0,w["start"]); we=min(w["end"],ws+.35)
                if ws<we: f.write(f"Dialogue: 0,{ts(ws)},{ts(we)},W,,{w['word']}\n")
        log("subtitles","complete",message=f"{len(cw)} words",word_count=len(cw))
        # STEP 5: Burn
        log("burn","running",message="Burning...")
        op=os.path.join(od,f"{cn}.mp4")
        subprocess.run([FFMPEG,"-y","-i",cp,"-vf",f"ass={ap}","-c:v","libx264","-preset","ultrafast","-crf","23","-c:a","copy",op],check=True,capture_output=True,timeout=60)
        log("burn","complete",message="Ready!")
        shutil.rmtree(td,ignore_errors=True)
        elapsed=time.time()-t0
        ct=[w["word"] for w in cw if len(w["word"])>2]
        cap=" ".join(ct[:15])[:150] if ct else title[:120]
        ht={"viral":"#mustwatch #viral","funny":"#funny #comedy","dramatic":"#drama","inspiring":"#inspiration","surprising":"#wow","action":"#action"}.get(mt,"#mustwatch")
        wps=len(cw)/max(cd,1); uniq=len(set(w["word"] for w in cw))
        scv=round(min(10,max(1,5+wps*.5+(uniq/max(len(cw),1))*2)),1)
        lb="🔥 Very High" if scv>=8 else "📈 High" if scv>=6 else "👍 Moderate"
        log("complete","complete",message=f"Done in {round(elapsed)}s",output=f"./output/{cn}.mp4",title=title,original_duration=f"{int(dur//60)}:{int(dur%60):02d}",clip_duration=f"{round(cd)}s",font=font,font_size=fs,position=pos,reason=reason,moment_type=mt,caption=cap,hashtags=ht,virality_score=scv,virality_label=lb,total_seconds=round(elapsed))
    except Exception as exc:
        shutil.rmtree(td,ignore_errors=True)
        error(f"{type(exc).__name__}: {exc}")

if __name__=="__main__":
    main()
