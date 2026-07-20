@echo off
REM Local Faster-Whisper transcription service startup script

echo.
echo ========================================
echo   StoryClue Local Transcription Service
echo ========================================
echo.

REM Check if .env.local exists and has credentials
if not exist .env.local (
    echo ERROR: .env.local file not found
    echo.
    echo Create .env.local with these variables:
    echo   SUPABASE_URL=your_supabase_url
    echo   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    echo   VERCEL_URL=your_vercel_url (or localhost:3000)
    echo.
    pause
    exit /b 1
)

echo Checking for required dependencies...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Install Python 3.10+ and add to PATH.
    pause
    exit /b 1
)

python -m pip show faster-whisper >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: faster-whisper not installed. Run:
    echo   python -m pip install faster-whisper yt-dlp requests python-dotenv
    pause
    exit /b 1
)

echo ✓ Python and dependencies ready
echo.
echo Starting transcription service...
echo.
echo This service will:
echo   - Poll Supabase every 30 seconds for new sermons
echo   - Download YouTube videos with yt-dlp
echo   - Transcribe with Faster-Whisper (CPU mode)
echo   - Post transcripts to the API webhook
echo   - Automatically generate puzzles and email pastors
echo.
echo Press Ctrl+C to stop the service
echo.

python transcribe_service.py
pause
