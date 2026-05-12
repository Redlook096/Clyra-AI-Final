#!/usr/bin/env python3
"""AI YouTube Auto Clipper Pipeline"""
import sys, json, os, subprocess, shutil, tempfile
from datetime import timedelta

# Ensure ffmpeg is findable
FFMPEG = os.path.expanduser("~/bin/ffmpeg")
if not os.path.exists(FFMPEG):
    FFMPEG = "ffmpeg"

def log(step, status, **kwargs):
    print(json.dumps({"type": "progress", "step": step, "status": status, **kwargs}), flush=True)

def error(msg):
    print(json.dumps({"type": "error", "message": msg}), flush=True)
    sys.exit(1)

def format_time(s):
    return str(timedelta(seconds=int(s)))

def hex_to_ass(h):
    h = h.lstrip('#')
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}"

def main():
    if len(sys.argv) < 2:
        error("Usage: clipper-pipeline.py <youtube_url> [config_json]")

    url = sys.argv[1]
    cfg = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {
        "font_size": 52, "font": "Impact", "text_colour": "#FFFFFF",
        "stroke_colour": "#000000", "position": "bottom-centre"
    }

    tmp_dir = "./tmp"
    out_dir = "./output"
    os.makedirs(tmp_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    try:
        # Step 1: Download
        log("download", "running", message="Downloading video...")
        from pytubefix import YouTube
        yt = YouTube(url)
        log("download", "running", message=f"Downloading: {yt.title}", title=yt.title)

        stream = yt.streams.get_highest_resolution()
        if not stream:
            stream = yt.streams.filter(progressive=True).first()
        if not stream:
            error("No downloadable stream found")

        src_path = stream.download(output_path=tmp_dir, filename="source.mp4")
        duration = yt.length
        log("download", "complete", message="Downloaded", title=yt.title, duration=duration, duration_fmt=format_time(duration))

        # Step 2: Transcribe
        log("transcribe", "running", message="Transcribing with Whisper...")
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(src_path, word_timestamps=True)
        segments = result["segments"]
        all_words = []
        for seg in segments:
            if "words" in seg:
                for w in seg["words"]:
                    all_words.append({"word": w["word"], "start": w["start"], "end": w["end"]})
        log("transcribe", "complete", message=f"Transcribed {len(all_words)} words", word_count=len(all_words))

        # Step 3: Find best clip
        log("analyze", "running", message="AI analyzing for best viral moment...")

        # Build transcript text
        transcript_text = ""
        for seg in segments:
            start = seg.get("start", 0)
            text = seg.get("text", "")
            transcript_text += f"[{format_time(start)}] {text}\n"

        # Use AI to find best clip
        # Try using the DeepSeek API via the server proxy
        import urllib.request
        ai_prompt = f"""You are a viral video strategist. Find the single best 45-90 second clip from this transcript.
Respond ONLY with valid JSON: {{"clip_start": 42.3, "clip_end": 108.7, "reason": "One sentence why"}}

Transcript:
{transcript_text[:8000]}"""

        try:
            req = urllib.request.Request(
                "http://localhost:3000/api/deepseek/chat",
                data=json.dumps({
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": ai_prompt}],
                    "temperature": 0.7,
                    "max_tokens": 500,
                    "stream": False
                }).encode(),
                headers={"Content-Type": "application/json"}
            )
            resp = urllib.request.urlopen(req, timeout=30)
            ai_response = json.loads(resp.read())
            ai_text = ai_response.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Extract JSON from response
            import re
            json_match = re.search(r'\{[^}]+\}', ai_text)
            if json_match:
                clip_data = json.loads(json_match.group())
                clip_start = float(clip_data.get("clip_start", 30))
                clip_end = float(clip_data.get("clip_end", min(clip_start + 60, duration)))
                reason = clip_data.get("reason", "High engagement moment detected")
            else:
                # Fallback: use middle portion
                clip_start = max(0, duration * 0.15)
                clip_end = min(duration, clip_start + 60)
                reason = "Selected high-energy middle segment"
        except Exception as e:
            # Fallback
            clip_start = max(0, duration * 0.1)
            clip_end = min(duration, clip_start + 55)
            reason = f"Auto-selected segment (AI analysis unavailable: {str(e)[:50]})"

        clip_duration = clip_end - clip_start
        log("analyze", "complete", message=f"Best moment: {reason}", reason=reason,
            clip_start=clip_start, clip_end=clip_end, clip_duration=round(clip_duration, 1))

        # Step 4: Clip video
        log("clip", "running", message="Clipping video with ffmpeg...")
        clip_path = os.path.join(tmp_dir, "clip.mp4")
        cmd = [
            FFMPEG, "-y", "-ss", str(clip_start), "-i", src_path,
            "-t", str(clip_duration), "-c:v", "libx264", "-preset", "veryfast",
            "-crf", "18", "-c:a", "aac", "-b:a", "192k", clip_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        log("clip", "complete", message=f"Clipped ({round(clip_duration)}s)")

        # Step 5: Generate subtitles
        log("subtitles", "running", message="Generating word-accurate subtitles...")

        # Filter words within clip range
        clip_words = []
        for w in all_words:
            ws = w["start"]
            we = w["end"]
            if ws >= clip_start and we <= clip_end:
                clip_words.append({
                    "word": w["word"],
                    "start": ws - clip_start,
                    "end": we - clip_start
                })

        # Build ASS subtitle file
        align_map = {"bottom-centre": 2, "centre": 5, "top-centre": 8}
        align = align_map.get(cfg.get("position", "bottom-centre"), 2)
        margin_v = 60 if align == 2 else 0

        ass_path = os.path.join(tmp_dir, "subs.ass")
        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,Bold,Italic,Alignment,MarginV,Outline,Shadow
Style: Word,{cfg['font']},{cfg['font_size']},{hex_to_ass(cfg['text_colour'])},{hex_to_ass(cfg['stroke_colour'])},1,0,{align},{margin_v},3,0

[Events]
Format: Layer,Start,End,Style,Text
""")
            for w in clip_words:
                s = w["start"]
                e = min(w["end"] + 0.05, w["end"] + 0.1)
                ts = lambda sec: f"{int(sec//3600)}:{int((sec%3600)//60):02d}:{sec%60:05.2f}"
                text = w["word"].strip().upper()
                f.write(f"Dialogue: 0,{ts(s)},{ts(e)},Word,,{text}\n")

        log("subtitles", "complete", message=f"Subtitles ready ({len(clip_words)} words)")

        # Step 6: Burn subtitles
        log("burn", "running", message="Burning subtitles into video...")
        out_path = os.path.join(out_dir, "final_clip.mp4")
        cmd = [
            FFMPEG, "-y", "-i", clip_path, "-vf", f"ass={ass_path}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k", out_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        log("burn", "complete", message="Final clip ready!")

        # Clean up tmp
        shutil.rmtree(tmp_dir, ignore_errors=True)

        log("complete", "complete", message="All done!",
            output="./output/final_clip.mp4",
            title=yt.title,
            original_duration=format_time(duration),
            clip_duration=f"{round(clip_duration)}s",
            font=cfg['font'],
            font_size=cfg['font_size'],
            position=cfg['position'],
            reason=reason)

    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        error(str(e))

if __name__ == "__main__":
    main()
