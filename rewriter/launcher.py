#!/usr/bin/env python3
"""
Auto-launcher for Text Rewriter Application
Automatically starts the Flask server and opens the browser.
"""

import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path

def check_ollama():
    """Check if Ollama is running."""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False

def install_requirements():
    """Install required packages if needed."""
    requirements_file = Path(__file__).parent / "requirements.txt"

    if not requirements_file.exists():
        print("Error: requirements.txt not found!")
        return False

    print("Checking dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q", "-r", str(requirements_file)
        ])
        print("✓ Dependencies ready")
        return True
    except subprocess.CalledProcessError:
        print("Error: Failed to install dependencies")
        return False

def main():
    """Main launcher function."""
    os.chdir(Path(__file__).parent)

    print("\n" + "="*60)
    print("  Text Rewriter Application Launcher")
    print("="*60 + "\n")

    # Check and install dependencies
    if not install_requirements():
        input("\nPress Enter to exit...")
        sys.exit(1)

    # Check if Ollama is running
    print("Checking Ollama status...")
    if not check_ollama():
        print("\n⚠️  WARNING: Ollama doesn't appear to be running!")
        print("   Please start Ollama before using this application.")
        print("   The app will start anyway, but won't work without Ollama.\n")
        time.sleep(2)
    else:
        print("✓ Ollama is running\n")

    # Start the Flask app
    print("Starting web server...")

    # Open browser after a short delay
    def open_browser():
        time.sleep(1.5)
        print("Opening browser...")
        webbrowser.open("http://localhost:5000")

    import threading
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    # Import and run the Flask app
    try:
        from app import app
        app.run(host='0.0.0.0', port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        print("Goodbye!\n")
    except Exception as e:
        print(f"\n\nError: {e}")
        input("\nPress Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()
