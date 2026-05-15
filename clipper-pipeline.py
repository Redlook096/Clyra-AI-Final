#!/usr/bin/env python3
"""Premium clipper — captions instant, Whisper on clip, strict one-word subs. ~30-90s."""
import sys, json, os, subprocess, shutil, re, time, xml.etree.ElementTree as ET
from threading import Thread

FF = os.path.join(os.path.expanduser("~"), "bin", "ffmpeg")
FFMPEG = FF if os.path.exists(FF) else "ffmpeg"

def log(step, status, **kw):
    print(json.dumps({"type":"progress","step":step,"status":status,**kw}), flush=True)
def error(msg):
    print(json.dumps({"type":"error","message":msg}), flush=True); sys.exit(1)

def main():
    if len(sys.argv) < 2: error("Usage: clipper-pipeline.py <url> [config]")
    url = sys.argv[1].strip()
    cfg = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    font = cfg.get("font","Impact"); fs = int(cfg.get("font_size",52))
    tc = cfg.get("text_colour","#FFFFFF"); pos = cfg.get("position","bottom")
    mt = cfg.get("moment_type","viral"); cl = int(cfg.get("clip_duration",40))
    cn = re.sub(r'[^\w\s-]','',cfg.get("clip_name","clip_final")).strip()[:50] or "clip_final"
    td, od = "./tmp", "./output"
    os.makedirs(td,exist_ok=True); os.makedirs(od,exist_ok=True)
    t0 = time.time()
    log("start","running",message="Analyzing video...",url=url)
    try:
        from pytubefix import YouTube; import whisper
        yt = YouTube(url); title, dur = yt.title, yt.length
        words = []
        
        # STEP 1: Download + captions
        log("download","running",message=f"Downloading \"{title[:60]}...\"")
        def dv():
            s = (yt.streams.get_by_resolution("1080p") or yt.streams.get_by_resolution("720p")
                 or yt.streams.filter(progressive=True).order_by("resolution").desc().first())
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
        if not os.path.exists(vp): error("Download failed")
        if not words: error("No captions available")
        log("download","complete",message=f"\"{title}\" · {len(words)} words · {int(dur//60)}:{int(dur%60):02d}",title=title,duration=dur,word_count=len(words))
        
        # STEP 2: AI find moment
        log("analyze","running",message=f"Scanning {len(words)} words for best {mt} moment...")
        cs,ce = dur*.15, min(dur*.15+cl,dur); reason="Auto"
        try:
            import urllib.request
            tx = " ".join(f"[{w['start']:.0f}]{w['word']}" for w in words[:2500])
            prompt = f"Find best {cl}s {mt} clip. Reply ONLY JSON: {{\"start\":0,\"end\":{cl},\"reason\":\"why\"}}\n\n{tx}"
            req = urllib.request.Request("http://localhost:3000/api/deepseek/chat",
                data=json.dumps({"model":"deepseek-chat","messages":[{"role":"user","content":prompt}],"temperature":0.7,"max_tokens":120,"stream":False}).encode(),
                headers={"Content-Type":"application/json"})
            resp = urllib.request.urlopen(req,timeout=25)
            ai = json.loads(resp.read()).get("choices",[{}])[0].get("message",{}).get("content","")
            m2 = re.search(r'\{.*\}',ai,re.DOTALL)
            if m2:
                c = json.loads(m2.group()); cs=float(c.get("start",dur*.15)); ce=float(c.get("end",min(cs+cl,dur)))
                reason=c.get("reason",reason)
        except:
            seed=int(time.time()*1000)%100
            secs=[(.05,.15),(.15,.25),(.25,.35),(.35,.50),(.50,.65),(.60,.75),(.70,.85),(.10,.20),(.30,.45),(.55,.70)]
            s=secs[seed%len(secs)]; cs=max(0,dur*s[0]); ce=min(dur,max(cs+cl*.75,dur*s[1]))
            reason=f"Auto seed {seed}"
        cd=ce-cs
        if cd<cl*.6: ce=min(dur,cs+cl)
        if cd>cl: ce=cs+cl
        cd=ce-cs; cs,ce=round(cs,1),round(ce,1)
        log("analyze","complete",message=f"Best moment: {reason}",reason=reason,clip_start=cs,clip_end=ce,clip_duration=round(cd,1))
        
        # STEP 3: -c copy cut
        log("cut","running",message=f"Extracting {round(cd)}s clip...")
        cp=os.path.join(td,"clip.mp4")
        subprocess.run([FFMPEG,"-y","-ss",str(cs),"-i",vp,"-t",str(cd),"-c","copy",cp],check=True,capture_output=True,timeout=30)
        log("cut","complete",message=f"Clip extracted ({round(cd)}s)")
        
        # STEP 4: Whisper on clip
        log("subtitles","running",message="Generating word-accurate subtitles...")
        m3=whisper.load_model("tiny")
        r3=m3.transcribe(cp,word_timestamps=True,language="en",fp16=False)
        cw=[]
        for seg in r3.get("segments",[]):
            for w in seg.get("words",[]):
                wt=re.sub(r'[^\w\s]','',w["word"].strip()).upper()
                if wt: cw.append({"word":wt,"start":float(w["start"]),"end":float(w["end"])})
        # Caption fallback
        if len(cw)<20 and len(words)>20:
            cw2=[{"word":w["word"],"start":w["start"]-cs,"end":w["end"]-cs} for w in words if cs<=w["start"]<=ce]
            if len(cw2)>len(cw): cw=cw2
        
        # STEP 5: Strict one-word-at-a-time ASS (NO gaps, NO overlaps)
        def hb(h): h=h.lstrip("#"); return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}"
        am={"bottom":2,"bottom-centre":2,"centre":5,"center":5,"top":8,"top-centre":8}
        al=am.get(pos,5); mv=80 if al==2 else 0
        def t_ass(s): return f"0:{int(s//60):02d}:{s%60:05.2f}"
        ap=os.path.join(td,"subs.ass")
        with open(ap,"w") as f:
            f.write(f"[Script Info]\nPlayResX:1280\nPlayResY:720\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,Bold,Alignment,MarginV,Outline,Shadow\nStyle: W,{font},{fs},{hb(tc)},{hb('#000000')},1,{al},{mv},4,0\n[Events]\nFormat: Layer,Start,End,Style,Text\n")
            for i,w in enumerate(cw):
                ws = max(0, w["start"])
                we = cw[i+1]["start"] if i+1 < len(cw) else w["end"] + 0.4
                if we - ws < 0.1: we = ws + 0.1
                f.write(f"Dialogue: 0,{t_ass(ws)},{t_ass(we)},W,,{w['word']}\n")
        log("subtitles","complete",message=f"{len(cw)} word subtitles · no gaps · {font} {fs}px",word_count=len(cw))
        
        # STEP 6: Burn
        log("burn","running",message="Encoding final video...")
        op=os.path.join(od,f"{cn}.mp4")
        subprocess.run([FFMPEG,"-y","-i",cp,"-vf",f"ass={ap}","-c:v","libx264","-preset","medium","-crf","20","-c:a","copy",op],check=True,capture_output=True,timeout=90)
        log("burn","complete",message=f"Complete! {cn}.mp4")
        shutil.rmtree(td,ignore_errors=True)
        elapsed=time.time()-t0
        ct=[w["word"] for w in cw if len(w["word"])>2]
        cap=" ".join(ct[:15])[:150] if ct else title[:120]
        ht={"viral":"#mustwatch #viral","funny":"#funny","dramatic":"#drama","inspiring":"#inspiration","surprising":"#wow","action":"#action"}.get(mt,"#mustwatch")
        wps=len(cw)/max(cd,1); uniq=len(set(w["word"] for w in cw))
        scv=round(min(10,max(1,5+wps*.5+(uniq/max(len(cw),1))*2)),1)
        log("complete","complete",message=f"Done in {round(elapsed)}s",output=f"./output/{cn}.mp4",title=title,original_duration=f"{int(dur//60)}:{int(dur%60):02d}",clip_duration=f"{round(cd)}s",font=font,font_size=fs,position=pos,reason=reason,moment_type=mt,caption=cap,hashtags=ht,virality_score=scv,total_seconds=round(elapsed))
    except Exception as exc:
        shutil.rmtree(td,ignore_errors=True)
        error(f"{type(exc).__name__}: {exc}")

if __name__=="__main__":
    main()
