#!/usr/bin/env python3
"""
AI YouTube Auto Clipper Pipeline (Stream-Based)
===============================================
NEVER downloads the full video. Instead:
  - Audio-only download for Whisper transcription (~5-15MB)
  - Keyframes extracted directly from the YouTube stream URL via ffmpeg
  - AI analyzes transcript + keyframes to find best 30-60s moment
  - Clip portion downloaded directly from stream (only ~30-60s of video)

Usage: python3 clipper-pipeline.py <youtube_url> [config_json]

Config JSON keys:
  moment_type   - "funny" | "dramatic" | "inspiring" | "surprising" |
                  "action" | "emotional" | "viral"  (default: "viral")
  font_size     - subtitle font size (default: 52)
  font          - subtitle font name (default: "Impact")
  text_colour   - hex colour (default: "#FFFFFF")
  stroke_colour - hex colour (default: "#000000")
  position      - "bottom-centre" | "centre" | "top-centre" (default: "bottom-centre")
"""

import json
import os
import re
import shutil
import subprocess
import sys
from datetime import timedelta

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
_home = os.path.expanduser("~")
_ffmpeg = os.path.join(_home, "bin", "ffmpeg")
FFMPEG = _ffmpeg if os.path.exists(_ffmpeg) else "ffmpeg"

VALID_MOMENT_TYPES = {
    "funny",
    "dramatic",
    "inspiring",
    "surprising",
    "action",
    "emotional",
    "viral",
}

ASS_ALIGN_MAP = {"bottom-centre": 2, "centre": 5, "top-centre": 8}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def log(step, status, **kwargs):
    """Emit a structured progress log line as JSON."""
    print(
        json.dumps({"type": "progress", "step": step, "status": status, **kwargs}),
        flush=True,
    )


def error(msg):
    """Emit a fatal error and exit."""
    print(json.dumps({"type": "error", "message": str(msg)}), flush=True)
    sys.exit(1)


def format_time(seconds):
    """Convert seconds (int or float) to H:MM:SS string."""
    return str(timedelta(seconds=int(float(seconds))))


def hex_to_ass(hex_str):
    """Convert '#RRGGBB' → ASS '&H00BBGGRR'."""
    h = hex_str.lstrip("#")
    if len(h) != 6:
        return "&H00FFFFFF"
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H00{b}{g}{r}"


def run_ffmpeg(args, timeout=120):
    """Run ffmpeg with capture; raise RuntimeError on failure."""
    try:
        result = subprocess.run(
            [FFMPEG] + args,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"ffmpeg timed out after {timeout}s")
    if result.returncode != 0:
        stderr_tail = result.stderr.strip().split("\n")[-5:] if result.stderr else []
        raise RuntimeError(
            f"ffmpeg exited {result.returncode}: {'; '.join(stderr_tail)}"
        )
    return result


def get_video_resolution(video_path):
    """Get actual video resolution via ffprobe. Falls back to 1920x1080."""
    _ffprobe = FFMPEG.replace("ffmpeg", "ffprobe") if "ffmpeg" in FFMPEG else "ffprobe"
    cmd = [_ffprobe, "-i", video_path]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        for line in result.stderr.split("\n"):
            if "Stream" in line and "Video" in line:
                match = re.search(r"(\d{2,4})x(\d{2,4})", line)
                if match:
                    return int(match.group(1)), int(match.group(2))
    except Exception:
        pass
    return 1920, 1080  # fallback


def ts_ass(sec):
    """Convert float seconds → ASS timestamp 'H:MM:SS.cc'."""
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h}:{m:02d}:{s:05.2f}"


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------


def step_info(yt):
    """Step 1 — fetch metadata only (no download)."""
    log("info", "running", message="Getting video info...")
    title = yt.title
    duration = yt.length  # seconds (int)
    thumbnail = yt.thumbnail_url
    log(
        "info",
        "complete",
        message=title,
        title=title,
        duration=duration,
        duration_fmt=format_time(duration),
        thumbnail=thumbnail,
    )
    return title, duration


def step_audio(yt, tmp_dir):
    """Step 2 — download audio-only stream (small, ~5-15MB)."""
    log("audio", "running", message="Downloading audio track...")

    audio_stream = yt.streams.filter(only_audio=True).first()
    if not audio_stream:
        # Fallback: some streams use adaptive with audio codec
        audio_stream = yt.streams.filter(adaptive=True).filter(only_audio=True).first()
    if not audio_stream:
        error("No audio stream found — cannot proceed without audio")

    # Determine extension
    ext = audio_stream.subtype or "m4a"
    audio_path = os.path.join(tmp_dir, f"audio.{ext}")
    audio_stream.download(output_path=tmp_dir, filename=f"audio.{ext}")

    # Verify the file was created
    if not os.path.exists(audio_path):
        # pytubefix may have appended something; search
        for fname in os.listdir(tmp_dir):
            if fname.startswith("audio") and not fname.endswith(".jpg"):
                audio_path = os.path.join(tmp_dir, fname)
                break

    size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    log(
        "audio",
        "complete",
        message=f"Audio downloaded ({size_mb:.1f} MB)",
        audio_path=audio_path,
        size_mb=round(size_mb, 1),
    )
    return audio_path


def step_transcribe(audio_path):
    """Step 3 — Whisper transcription with word-level timestamps."""
    log("transcribe", "running", message="Transcribing with Whisper...")

    import whisper

    model = whisper.load_model("tiny")
    result = model.transcribe(audio_path, word_timestamps=True)
    segments = result.get("segments", [])

    all_words = []
    for seg in segments:
        if "words" in seg:
            for w in seg["words"]:
                all_words.append(
                    {
                        "word": w.get("word", ""),
                        "start": float(w.get("start", 0)),
                        "end": float(w.get("end", 0)),
                    }
                )

    if not all_words:
        log(
            "transcribe",
            "complete",
            message="No words detected — using raw segments",
            word_count=0,
        )
    else:
        log(
            "transcribe",
            "complete",
            message=f"Transcribed {len(all_words)} words",
            word_count=len(all_words),
        )

    return segments, all_words


def step_keyframes(yt, duration, tmp_dir):
    """Step 4 — extract 6 keyframes directly from stream URL via ffmpeg."""
    log("keyframes", "running", message="Extracting keyframes from stream...")

    # Get best video stream URL (no download)
    video_stream = (
        yt.streams.filter(adaptive=True, file_extension="mp4")
        .filter(only_video=True)
        .order_by("resolution")
        .desc()
        .first()
    )
    if not video_stream:
        video_stream = yt.streams.filter(progressive=True).first()
    if not video_stream:
        error("No video stream found for keyframe extraction")

    stream_url = video_stream.url

    # Also get audio stream URL for clip download
    audio_stream = yt.streams.filter(adaptive=True).filter(only_audio=True).first()
    if not audio_stream:
        audio_stream = yt.streams.filter(only_audio=True).first()
    audio_url = audio_stream.url if audio_stream else stream_url

    num_frames = 4
    frame_paths = []
    frame_data = []

    for i in range(num_frames):
        t = (duration / (num_frames + 1)) * (i + 1)
        frame_path = os.path.join(tmp_dir, f"frame_{i}.jpg")
        try:
            _ = run_ffmpeg(
                [
                    "-y",
                    "-ss",
                    str(t),
                    "-i",
                    stream_url,
                    "-vframes",
                    "1",
                    "-q:v",
                    "3",
                    frame_path,
                ],
                timeout=15,
            )
            frame_paths.append((t, frame_path))
            frame_data.append(
                f"Frame {i + 1} at {format_time(t)} - Visual snapshot captured"
            )
            log(
                "keyframes",
                "progress",
                frame=i + 1,
                total=num_frames,
                timestamp=round(t, 1),
            )
        except Exception as exc:
            log(
                "keyframes",
                "progress",
                frame=i + 1,
                total=num_frames,
                warning=f"Frame at {t:.1f}s failed: {str(exc)[:60]}",
            )

    log(
        "keyframes",
        "complete",
        message=f"{len(frame_paths)}/{num_frames} keyframes captured",
        frames_captured=len(frame_paths),
    )
    return frame_paths, stream_url, audio_url, frame_data


def step_analyze(title, duration, segments, moment_type, frame_data=None):
    """Step 5 — AI analysis to find the best 30-60s clip."""
    log(
        "analyze", "running", message=f"AI analyzing for best '{moment_type}' moment..."
    )

    # Build compact transcript text
    transcript_lines = []
    for seg in segments:
        start = float(seg.get("start", 0))
        text = seg.get("text", "").strip()
        if text:
            transcript_lines.append(f"[{format_time(start)}] {text}")
    transcript_text = "\n".join(transcript_lines)

    # Truncate to ~8000 chars to avoid token limits
    if len(transcript_text) > 8000:
        transcript_text = transcript_text[:8000] + "\n[...transcript truncated...]"

    # Build frame context for visual analysis
    if frame_data:
        frame_context = "\n".join(frame_data)
    else:
        frame_context = "No visual keyframes available"

    ai_prompt = (
        f"You are a viral video strategist. Find the single best 30-60 second "
        f"clip that matches '{moment_type}' content.\n\n"
        f"AVAILABLE DATA:\n"
        f"- Video title: {title}\n"
        f"- Duration: {format_time(duration)}\n"
        f"- Full transcript with timestamps (word-level)\n\n"
        f"VISUAL KEYFRAMES ({len(frame_data) if frame_data else 0} frames extracted across the video):\n"
        f"{frame_context}\n\n"
        f"Use these to understand video context, scene changes, and visual energy alongside the transcript.\n\n"
        f"MOMENT TYPE: {moment_type}\n\n"
        f"Find a clip that:\n"
        f"- Is 30-60 seconds long (no shorter than 30, no longer than 60)\n"
        f"- Matches the '{moment_type}' style\n"
        f"- Has strong opening hook in first 3 seconds\n"
        f"- Ends at a natural break point (sentence end, scene change)\n"
        f"- Has high energy/viral potential\n\n"
        f"Respond ONLY with valid JSON: "
        f'{{"clip_start": 42.3, "clip_end": 102.3, '
        f'"reason": "One sentence why this is the best {moment_type} moment"}}\n\n'
        f"Transcript:\n{transcript_text}"
    )

    import urllib.request

    # Default fallback values
    clip_start = max(0.0, duration * 0.15)
    clip_end = min(float(duration), clip_start + 45.0)
    reason = f"Auto-selected {moment_type} segment"

    try:
        req = urllib.request.Request(
            "http://localhost:3000/api/deepseek/chat",
            data=json.dumps(
                {
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": ai_prompt}],
                    "temperature": 0.7,
                    "max_tokens": 500,
                    "stream": False,
                }
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        resp = urllib.request.urlopen(req, timeout=30)
        ai_response = json.loads(resp.read())
        ai_text = (
            ai_response.get("choices", [{}])[0].get("message", {}).get("content", "")
        )

        # Extract JSON object from response
        json_match = re.search(r"\{[^{}]*\}", ai_text)
        if json_match:
            clip_data = json.loads(json_match.group())
            cs = float(clip_data.get("clip_start", clip_start))
            ce = float(clip_data.get("clip_end", clip_end))
            # Sanity-check bounds
            if 0 <= cs < ce <= duration and (ce - cs) >= 10:
                clip_start = cs
                clip_end = ce
            reason = clip_data.get("reason", reason)
    except Exception as exc:
        log(
            "analyze",
            "progress",
            warning=f"AI call failed, using fallback: {str(exc)[:80]}",
        )

    # --- Enforce 30-60 second rule ---
    clip_duration = clip_end - clip_start

    if clip_duration < 30:
        # Extend to at least 30s (prefer extending end)
        extra = 30 - clip_duration
        if clip_end + extra <= duration:
            clip_end = clip_end + extra
        else:
            # Extend backward instead
            clip_start = max(0.0, clip_end - 30)
        clip_duration = clip_end - clip_start
        # If still < 30 (very short video), clip the whole thing
        if clip_duration < 30 and duration >= 30:
            clip_start = 0.0
            clip_end = min(float(duration), 30.0)
            clip_duration = clip_end - clip_start

    if clip_duration > 60:
        clip_end = clip_start + 60.0
        clip_duration = 60.0

    # Guard against out-of-range
    clip_start = max(0.0, clip_start)
    clip_end = min(float(duration), clip_end)
    clip_duration = clip_end - clip_start

    log(
        "analyze",
        "complete",
        message=reason,
        reason=reason,
        clip_start=round(clip_start, 1),
        clip_end=round(clip_end, 1),
        clip_duration=round(clip_duration, 1),
        moment_type=moment_type,
    )

    return clip_start, clip_end, reason


def step_download_clip(stream_url, audio_url, clip_start, clip_duration, tmp_dir):
    """Step 6 — download only the clip portion from both video and audio streams."""
    log(
        "clip",
        "running",
        message=f"Downloading {round(clip_duration)}s clip from stream...",
    )

    clip_path = os.path.join(tmp_dir, "clip.mp4")
    _ = run_ffmpeg(
        [
            "-y",
            "-ss",
            str(clip_start),
            "-i",
            stream_url,
            "-ss",
            str(clip_start),
            "-i",
            audio_url,
            "-t",
            str(clip_duration),
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "18",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-shortest",
            clip_path,
        ],
        timeout=180,
    )

    size_mb = os.path.getsize(clip_path) / (1024 * 1024)
    log(
        "clip",
        "complete",
        message=f"Clip ready ({round(clip_duration)}s, {size_mb:.1f} MB)",
        clip_path=clip_path,
    )
    return clip_path


def step_subtitles(all_words, clip_start, clip_end, cfg, tmp_dir):
    """Step 7 — build word-accurate ASS subtitle file with proper sizing."""
    log("subtitles", "running", message="Generating word-accurate subtitles...")

    font = cfg.get("font", "Impact")
    text_colour = cfg.get("text_colour", "#FFFFFF")
    stroke_colour = cfg.get("stroke_colour", "#000000")
    position = cfg.get("position", "bottom-centre")
    user_font_size = cfg.get("font_size", 52)

    align = ASS_ALIGN_MAP.get(position, 2)

    # Get actual video resolution from the downloaded clip
    clip_path = os.path.join(tmp_dir, "clip.mp4")
    video_w, video_h = get_video_resolution(clip_path)
    log("subtitles", "progress", message=f"Video resolution: {video_w}x{video_h}")

    # Use user's font size, but scale proportionally to video height
    # Baseline: 52px at 1080p. Scale: font_size = user_size * (video_h / 1080)
    font_size = max(24, int(user_font_size * video_h / 1080))

    # Scale margin proportionally (60px at 1080p as baseline)
    margin_v = int(60 * video_h / 1080) if align == 2 else 0

    # Filter words within clip range; shift times to be relative to clip start
    clip_words = []
    for w in all_words:
        ws = float(w["start"])
        we = float(w["end"])
        if ws >= clip_start and we <= clip_end:
            clip_words.append(
                {
                    "word": w["word"],
                    "start": ws - clip_start,
                    "end": we - clip_start,
                }
            )

    if not clip_words:
        log(
            "subtitles",
            "complete",
            message="No words in clip range — subtitle file will be empty",
            word_count=0,
        )
    else:
        log("subtitles", "progress", message=f"{len(clip_words)} words in clip range")

    ass_path = os.path.join(tmp_dir, "subs.ass")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(
            "[Script Info]\n"
            "ScriptType: v4.00+\n"
            f"PlayResX: {video_w}\n"
            f"PlayResY: {video_h}\n"
            "\n"
            "[V4+ Styles]\n"
            "Format: Name,Fontname,Fontsize,PrimaryColour,OutlineColour,"
            "Bold,Italic,Alignment,BorderStyle,MarginV,Outline,Shadow\n"
            + f"Style: Word,{font},{font_size},"
            f"{hex_to_ass(text_colour)},{hex_to_ass(stroke_colour)},"
            f"1,0,{align},1,{margin_v},4,0\n"
            "\n"
            "[Events]\n"
            "Format: Layer,Start,End,Style,Text\n"
        )
        for i, w in enumerate(clip_words):
            s = float(w["start"])
            e = float(w["end"])
            # Cap end time at next word's start to prevent overlap
            if i + 1 < len(clip_words):
                next_start = float(clip_words[i + 1]["start"])
                if e > next_start:
                    e = max(s + 0.05, next_start - 0.02)
            text = re.sub(r"[^\w\s]", "", w["word"].strip()).upper()
            if text:
                f.write(f"Dialogue: 0,{ts_ass(s)},{ts_ass(e)},Word,,{text}\n")

    log(
        "subtitles",
        "complete",
        message=f"{len(clip_words)} word subtitles ready",
        word_count=len(clip_words),
        font_size=font_size,
        video_resolution=f"{video_w}x{video_h}",
    )
    return ass_path


def step_burn(clip_path, ass_path, out_dir):
    """Step 8 — burn subtitles into the video."""
    log("burn", "running", message="Burning subtitles...")

    out_path = os.path.join(out_dir, "final_clip.mp4")
    _ = run_ffmpeg(
        [
            "-y",
            "-i",
            clip_path,
            "-vf",
            f"ass={ass_path}",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "18",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            out_path,
        ],
        timeout=120,
    )

    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    log(
        "burn",
        "complete",
        message=f"Final clip ready ({size_mb:.1f} MB)",
        output_path=out_path,
    )
    return out_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        error("Usage: clipper-pipeline.py <youtube_url> [config_json]")

    url = sys.argv[1].strip()
    if not url:
        error("Empty URL provided")

    # Parse config
    cfg = {}
    if len(sys.argv) > 2:
        try:
            cfg = json.loads(sys.argv[2])
        except json.JSONDecodeError as exc:
            error(f"Invalid config JSON: {exc}")

    moment_type = cfg.get("moment_type", "viral").lower().strip()
    if moment_type not in VALID_MOMENT_TYPES:
        log(
            "start",
            "warning",
            message=f"Unknown moment_type '{moment_type}', falling back to 'viral'",
            valid_types=sorted(VALID_MOMENT_TYPES),
        )
        moment_type = "viral"
    cfg["moment_type"] = moment_type

    # Ensure defaults for subtitle config
    cfg.setdefault("font_size", 52)
    cfg.setdefault("font", "Impact")
    cfg.setdefault("text_colour", "#FFFFFF")
    cfg.setdefault("stroke_colour", "#000000")
    cfg.setdefault("position", "bottom-centre")

    tmp_dir = "./tmp"
    out_dir = "./output"
    os.makedirs(tmp_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)

    log(
        "start",
        "running",
        message="Stream-based clipper pipeline starting",
        url=url,
        moment_type=moment_type,
    )

    try:
        from pytubefix import YouTube

        # --- Step 1: Info ---
        yt = YouTube(url)
        title, duration = step_info(yt)

        # --- Step 2: Audio only ---
        audio_path = step_audio(yt, tmp_dir)

        # --- Step 3: Transcribe ---
        segments, all_words = step_transcribe(audio_path)

        # --- Step 4: Keyframes ---
        _, stream_url, audio_url, frame_data = step_keyframes(yt, duration, tmp_dir)

        # --- Step 5: AI Analysis ---
        clip_start, clip_end, reason = step_analyze(
            title,
            duration,
            segments,
            moment_type,
            frame_data,
        )

        # --- Step 6: Download clip from stream ---
        clip_duration = clip_end - clip_start
        clip_path = step_download_clip(
            stream_url, audio_url, clip_start, clip_duration, tmp_dir
        )

        # --- Step 7: Subtitles ---
        ass_path = step_subtitles(all_words, clip_start, clip_end, cfg, tmp_dir)

        # --- Step 8: Burn ---
        _ = step_burn(clip_path, ass_path, out_dir)

        # --- Cleanup ---
        shutil.rmtree(tmp_dir, ignore_errors=True)
        log("cleanup", "complete", message="Temporary files removed")

        # --- Final summary ---
        log(
            "complete",
            "complete",
            message="All done!",
            output="./output/final_clip.mp4",
            title=title,
            original_duration=format_time(duration),
            clip_duration=f"{round(clip_duration)}s",
            clip_start=round(clip_start, 1),
            clip_end=round(clip_end, 1),
            font=cfg["font"],
            font_size=cfg["font_size"],
            position=cfg["position"],
            reason=reason,
            moment_type=moment_type,
        )

    except Exception as exc:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        error(f"{type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()
