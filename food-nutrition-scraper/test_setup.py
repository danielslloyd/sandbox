#!/usr/bin/env python3
"""
Test script to verify setup is correct.
Checks dependencies and environment configuration.
"""

import sys
import os


def check_imports():
    """Check if all required packages are installed"""
    print("Checking Python packages...")

    required = {
        'selenium': 'Web scraping',
        'bs4': 'HTML parsing (BeautifulSoup)',
        'requests': 'HTTP requests',
        'anthropic': 'AI nutrition extraction',
    }

    missing = []
    for package, description in required.items():
        try:
            __import__(package)
            print(f"  ✓ {package} - {description}")
        except ImportError:
            print(f"  ✗ {package} - {description} - NOT FOUND")
            missing.append(package)

    return missing


def check_env():
    """Check environment variables"""
    print("\nChecking environment variables...")

    api_key = os.getenv('ANTHROPIC_API_KEY')
    if api_key and api_key != 'your_api_key_here':
        print(f"  ✓ ANTHROPIC_API_KEY is set")
        return True
    else:
        print(f"  ✗ ANTHROPIC_API_KEY is not set")
        print(f"     Set it with: export ANTHROPIC_API_KEY='your-key'")
        print(f"     Or create a .env file (see .env.example)")
        return False


def check_selenium():
    """Check if Selenium can start"""
    print("\nChecking Selenium/ChromeDriver...")

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options

        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        print("  Attempting to start Chrome WebDriver...")
        driver = webdriver.Chrome(options=options)
        driver.quit()
        print("  ✓ Chrome WebDriver works!")
        return True

    except Exception as e:
        print(f"  ✗ Chrome WebDriver failed: {e}")
        print(f"     Make sure Chrome/Chromium is installed")
        return False


def check_directories():
    """Check if required directories exist"""
    print("\nChecking directories...")

    dirs = ['scrapers', 'static', 'data', 'images']
    all_exist = True

    for dir_name in dirs:
        if os.path.isdir(dir_name):
            print(f"  ✓ {dir_name}/ exists")
        else:
            print(f"  ✗ {dir_name}/ missing (will be created)")
            all_exist = False

    return all_exist


def main():
    """Run all checks"""
    print("=" * 60)
    print("FOOD NUTRITION SCRAPER - SETUP TEST")
    print("=" * 60)
    print()

    # Check imports
    missing_packages = check_imports()

    # Check environment
    has_api_key = check_env()

    # Check Selenium
    selenium_works = check_selenium()

    # Check directories
    dirs_exist = check_directories()

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if missing_packages:
        print(f"✗ Missing packages: {', '.join(missing_packages)}")
        print(f"  Install with: pip install -r requirements.txt")
    else:
        print("✓ All packages installed")

    if not has_api_key:
        print("✗ ANTHROPIC_API_KEY not configured")
        print("  Nutrition extraction will not work without it")
    else:
        print("✓ API key configured")

    if not selenium_works:
        print("✗ Selenium/Chrome not working")
        print("  Scraping will not work")
    else:
        print("✓ Selenium ready")

    if not dirs_exist:
        print("⚠ Some directories missing (will be auto-created)")

    print()

    if not missing_packages and selenium_works:
        print("🎉 Setup looks good! You can run:")
        print("   python main_scraper.py --max-items 5")
        print()
        if not has_api_key:
            print("⚠  Note: Set ANTHROPIC_API_KEY to enable nutrition extraction")
        return 0
    else:
        print("❌ Please fix the issues above before running the scraper")
        return 1


if __name__ == '__main__':
    sys.exit(main())
