@echo off
REM Food Nutrition Scraper - Run in headless mode (no browser window, faster)
REM Double-click this file to run the scraper in headless mode

echo ================================================================================
echo FOOD NUTRITION SCRAPER (HEADLESS MODE)
echo ================================================================================
echo Running in headless mode - no browser window will appear
echo This is faster but you won't see the scraping progress visually
echo.

REM Change to the script's directory
cd /d "%~dp0"

REM Run the scraper in headless mode using the correct Python installation
"C:\Users\danie\AppData\Local\Programs\Python\Python311\python.exe" main_scraper.py --headless

echo.
echo ================================================================================
echo Scraper finished!
echo ================================================================================
echo.
echo Press any key to close this window...
pause >nul
