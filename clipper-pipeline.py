#!/usr/bin/env python3
"""Fast AI Auto-Clipper. Audio→Whisper tiny→AI→copy cut→subs→burn. Target <60s."""
import sys, json, os, subprocess, shutil, re, time

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
    mt = cfg.get("moment_type","viral")
    cn = re.sub(r'[^\w\s-]','',cfg.get("clip_name","clip_final")).strip()[:50] or "clip_final"
    td, od = "./tmp", "./output"
    os.makedirs(td,exist_ok=True); os.makedirs(od,exist_ok=True)
    t0 = time.time()
    log("start","running",message="Starting",url=url)
    try:
        from pytubefix import YouTube; import whisper
        yt = YouTube(url); title, dur = yt.title, yt.length
        
        # STEP 1: Audio only + video in background
        log("download","running",message="Downloading audio...")
        audio = yt.streams.filter(only_audio=True).order_by("abr").last()
        if not audio: audio = yt.streams.filter(only_audio=True).first()
        ap = audio.download(td, filename="audio.mp4")
        vid = (yt.streams.get_by_resolution("720p") 
               or yt.streams.filter(progressive=True,res="480p").first()
               or yt.streams.filter(progressive=True).first())
        vp = vid.download(td, filename="video.mp4")
        log("download","complete",message="Ready",title=title,duration=dur)
        
        # STEP 2: Whisper tiny
        log("transcribe","running",message="Transcribing...")
        m = whisper.load_model("tiny")
        r = m.transcribe(ap, word_timestamps=True, language="en", fp16=False)
        words = []
        for seg in r.get("segments",[]):
            for w in seg.get("words",[]):
                wt = re.sub(r'[^\w\s]','',w["word"].strip()).upper()
                if wt: words.append({"word":wt,"start":float(w["start"]),"end":float(w["end"])})
        os.remove(ap)
        ft = " ".join(f"[{x['start']:.1f}]{x['word']}" for x in words)
        log("transcribe","complete",message=f"{len(words)} words",word_count=len(words))
        
        # STEP 3: AI find moment
        log("analyze","running",message=f"Finding {mt}...")
        cs,ce = dur*.15, min(dur*.15+40,dur); reason="Auto"
        try:
            import urllib.request
            prompt = f"Find best 30-45s {mt} clip. Reply ONLY JSON: {{\"start\":0,\"end\":45,\"reason\":\"why\"}}\n\n{ft[:3000]}"
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
        if cd>45: ce=cs+45
        cd=ce-cs; cs,ce=round(cs,1),round(ce,1)
        log("analyze","complete",message=reason,reason=reason,clip_start=cs,clip_end=ce,clip_duration=round(cd,1))
        
        # STEP 4: -c copy cut
        log("cut","running",message=f"Cutting...")
        cp=os.path.join(td,"clip.mp4")
        subprocess.run([FFMPEG,"-y","-ss",str(cs),"-i",vp,"-t",str(cd),"-c","copy",cp],check=True,capture_output=True,timeout=30)
        log("cut","complete",message=f"Cut ({round(cd)}s)")
        
        # STEP 5: ASS subtitles
        log("subtitles","running",message="Building subtitles...")
        def hb(h): h=h.lstrip("#"); return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}"
        am={"bottom":2,"bottom-centre":2,"centre":5,"center":5,"top":8,"top-centre":8}
        al=am.get(pos,2); mv=80 if al==2 else 0
        def ts(s): return f"0:{int(s//60):02d}:{s%60:05.2f}"
        cw=[w for w in words if cs<=w["start"]<=ce]
        ap2=os.path.join(td,"subs.ass")
        with open(ap2,"w") as f:
            f.write(f"[Script Info]\nPlayResX:1280\nPlayResY:720\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,Bold,Alignment,MarginV,Outline,Shadow\nStyle: W,{font},{fs},{hb(tc)},{hb('#000000')},1,{al},{mv},3,0\n[Events]\nFormat: Layer,Start,End,Style,Text\n")
            for w in cw:
                ws=max(0,w["start"]-cs); we=min(w["end"]-cs,ws+.4)
                if ws<we: f.write(f"Dialogue: 0,{ts(ws)},{ts(we)},W,,{w['word']}\n")
        log("subtitles","complete",message=f"{len(cw)} words",word_count=len(cw))
        
        # STEP 6: Burn
        log("burn","running",message="Burning...")
        op=os.path.join(od,f"{cn}.mp4")
        subprocess.run([FFMPEG,"-y","-i",cp,"-vf",f"ass={ap2}","-c:v","libx264","-preset","ultrafast","-crf","23","-c:a","copy",op],check=True,capture_output=True,timeout=60)
        log("burn","complete",message="Ready!")
        shutil.rmtree(td,ignore_errors=True)
        elapsed=time.time()-t0
        ct=[w["word"] for w in cw if len(w["word"])>2]
        cap=" ".join(ct[:15])[:150] if ct else title[:120]
        ht={"viral":"#mustwatch #viral","funny":"#funny","dramatic":"#drama","inspiring":"#inspiration","surprising":"#wow","action":"#action"}.get(mt,"#mustwatch")
        wps=len(cw)/max(cd,1); uniq=len(set(w["word"] for w in cw))
        scv=round(min(10,max(1,5+wps*.5+(uniq/max(len(cw),1))*2)),1)
        lb="Very High" if scv>=8 else "High" if scv>=6 else "Moderate"
        log("complete","complete",message=f"Done in {round(elapsed)}s",output=f"./output/{cn}.mp4",title=title,original_duration=f"{int(dur//60)}:{int(dur%60):02d}",clip_duration=f"{round(cd)}s",font=font,font_size=fs,position=pos,reason=reason,moment_type=mt,caption=cap,hashtags=ht,virality_score=scv,virality_label=lb,total_seconds=round(elapsed))
    except Exception as exc:
        shutil.rmtree(td,ignore_errors=True)
        error(f"{type(exc).__name__}: {exc}")

if __name__=="__main__":
    main()
