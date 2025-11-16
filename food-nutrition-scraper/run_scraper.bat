@echo off
REM Food Nutrition Scraper - Run with visible browser window
REM Double-click this file to run the scraper

echo ================================================================================
echo FOOD NUTRITION SCRAPER
echo ================================================================================
echo.

REM Change to the script's directory
cd /d "%~dp0"

REM Run the scraper using the correct Python installation
"C:\Users\danie\AppData\Local\Programs\Python\Python311\python.exe" main_scraper.py

echo.
echo ================================================================================
echo Scraper finished!
echo ================================================================================
echo.
echo Press any key to close this window...
pause >nul
