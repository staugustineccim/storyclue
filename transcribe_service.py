#!/usr/bin/env python3
"""
Local Faster-Whisper transcription service.
Polls Supabase for sermons waiting for transcription, downloads YouTube videos,
transcribes them locally, and posts the transcript back to the API.
"""

import os
import sys
import json
import time
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
VERCEL_URL = os.getenv("VERCEL_URL", "http://localhost:3000")
API_URL = f"https://{VERCEL_URL}" if "localhost" not in VERCEL_URL else VERCEL_URL

# Temporary directory for video downloads
TEMP_DIR = Path(tempfile.gettempdir()) / "storyclue_transcribe"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

def log(msg):
    """Log message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")

def get_waiting_sermons():
    """Query Supabase for sermons waiting for captions."""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/church_sermons?status=eq.waiting_for_captions&select=*,church_accounts(*)",
        headers=headers,
    )

    if res.status_code != 200:
        log(f"ERROR: Supabase query failed: {res.status_code}")
        return []

    return res.json()

def download_youtube_video(video_id):
    """Download YouTube video using yt-dlp, return path to audio file."""
    output_path = TEMP_DIR / f"{video_id}.%(ext)s"

    cmd = [
        "yt-dlp",
        "-f", "bestaudio/best",
        "-x",  # Extract audio
        "--audio-format", "mp3",
        "--audio-quality", "192",
        "-o", str(output_path),
        f"https://www.youtube.com/watch?v={video_id}"
    ]

    try:
        log(f"Downloading video {video_id}...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            log(f"ERROR: yt-dlp download failed: {result.stderr}")
            return None

        # Find the downloaded file
        audio_file = TEMP_DIR / f"{video_id}.mp3"
        if audio_file.exists():
            log(f"Downloaded: {audio_file}")
            return str(audio_file)
        else:
            log(f"ERROR: Audio file not found after download")
            return None

    except subprocess.TimeoutExpired:
        log(f"ERROR: Download timeout for video {video_id}")
        return None
    except Exception as e:
        log(f"ERROR: Download failed: {str(e)}")
        return None

def transcribe_audio(audio_path):
    """Transcribe audio file using Faster-Whisper."""
    try:
        from faster_whisper import WhisperModel

        log(f"Loading Whisper model...")
        # Use 'base' model for good balance of speed and accuracy
        model = WhisperModel("base", device="cpu", compute_type="default")

        log(f"Transcribing {audio_path}...")
        segments, info = model.transcribe(audio_path, language="en")

        # Combine all segments into full transcript
        transcript = " ".join([segment.text for segment in segments])

        log(f"Transcription complete ({len(transcript)} chars)")
        return transcript

    except Exception as e:
        log(f"ERROR: Transcription failed: {str(e)}")
        return None

def post_transcript_to_api(sermon_id, transcript):
    """Post transcript back to the API via webhook."""
    try:
        payload = {
            "sermon_id": sermon_id,
            "transcript": transcript,
            "transcription_service": "local-whisper",
        }

        # Use the transcription webhook endpoint
        res = requests.post(
            f"{API_URL}/api/webhook/transcription",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if res.status_code not in [200, 201]:
            log(f"ERROR: API post failed: {res.status_code}")
            return False

        log(f"Transcript posted to API")
        return True

    except Exception as e:
        log(f"ERROR: API post failed: {str(e)}")
        return False

def update_sermon_status(sermon_id, status, error=None):
    """Update sermon status in Supabase."""
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    updates = {
        "status": status,
        "transcription_service": "local-whisper",
    }

    if error:
        updates["error_message"] = error

    res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/church_sermons?id=eq.{sermon_id}",
        json=updates,
        headers=headers,
    )

    if res.status_code != 204:
        log(f"ERROR: Failed to update sermon status: {res.status_code}")
        return False

    return True

def cleanup_temp_file(audio_path):
    """Delete temporary audio file."""
    try:
        if os.path.exists(audio_path):
            os.remove(audio_path)
            log(f"Cleaned up: {audio_path}")
    except Exception as e:
        log(f"Warning: Could not delete temp file: {str(e)}")

def process_sermon(sermon):
    """Process a single sermon: download, transcribe, upload."""
    sermon_id = sermon["id"]
    video_id = sermon["video_id"]
    title = sermon["sermon_title"]

    log(f"\n--- Processing: {title} ({video_id}) ---")

    # Download video
    audio_path = download_youtube_video(video_id)
    if not audio_path:
        update_sermon_status(sermon_id, "error", "Failed to download video")
        return False

    # Transcribe
    transcript = transcribe_audio(audio_path)
    cleanup_temp_file(audio_path)

    if not transcript:
        update_sermon_status(sermon_id, "error", "Transcription failed")
        return False

    # Post to API (API will generate puzzle and email pastor)
    if not post_transcript_to_api(sermon_id, transcript):
        update_sermon_status(sermon_id, "error", "Failed to post transcript to API")
        return False

    # Update status
    update_sermon_status(sermon_id, "transcribing")
    log(f"✓ Completed: {title}")
    return True

def main():
    """Main service loop."""
    log("Starting local Whisper transcription service")
    log(f"API URL: {API_URL}")
    log(f"Temp directory: {TEMP_DIR}")
    log("Waiting for sermons to transcribe...\n")

    # Check configuration
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        log("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)

    last_check = 0
    check_interval = 30  # Check for new sermons every 30 seconds

    try:
        while True:
            now = time.time()

            # Poll every N seconds
            if now - last_check >= check_interval:
                sermons = get_waiting_sermons()

                if sermons:
                    log(f"Found {len(sermons)} sermon(s) waiting for transcription")
                    for sermon in sermons:
                        process_sermon(sermon)

                last_check = now

            time.sleep(5)  # Check every 5 seconds for shutdown signals

    except KeyboardInterrupt:
        log("\nShutting down...")
        sys.exit(0)
    except Exception as e:
        log(f"FATAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
