"""
Costco-specific scraper implementation.
Scrapes food items from costco.com.
"""

from typing import List, Dict, Optional
import time
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
from .base_scraper import BaseFoodScraper


class CostcoScraper(BaseFoodScraper):
    """Scraper for Costco food items"""

    def __init__(self, verbose: bool = True, headless: bool = True):
        """
        Initialize Costco scraper.

        Args:
            verbose: Enable verbose logging
            headless: Run browser in headless mode
        """
        super().__init__(verbose)
        self.headless = headless
        self.driver = None
        self.base_url = "https://www.costco.com"

    def _init_driver(self):
        """Initialize Selenium WebDriver"""
        if self.driver is None:
            self.logger.info("Initializing Chrome WebDriver...")
            options = webdriver.ChromeOptions()
            if self.headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

            self.driver = webdriver.Chrome(options=options)
            self.logger.info("WebDriver initialized successfully")

    def _close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def get_retailer_name(self) -> str:
        """Return the name of the retailer"""
        return "Costco"

    def get_category_urls(self) -> List[str]:
        """
        Get URLs for all food categories to scrape.

        Returns:
            List of category URLs
        """
        # Major food categories at Costco
        # These are common food department URLs
        categories = [
            f"{self.base_url}/grocery-household.html",
            f"{self.base_url}/meat-seafood-deli.html",
            f"{self.base_url}/fresh-foods.html",
            f"{self.base_url}/frozen-foods.html",
            f"{self.base_url}/organic-foods.html",
            f"{self.base_url}/bakery-desserts.html",
        ]

        return categories

    def scrape_category(self, category_url: str) -> List[str]:
        """
        Scrape a category page for product URLs.

        Args:
            category_url: URL of the category page

        Returns:
            List of product URLs
        """
        self._init_driver()
        product_urls = []

        try:
            self.driver.get(category_url)
            time.sleep(3)  # Wait for page to load

            # Scroll to load more items (lazy loading)
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            scroll_attempts = 0
            max_scrolls = 5

            while scroll_attempts < max_scrolls:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)

                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
                scroll_attempts += 1

            # Parse the page
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Find product links (adjust selectors based on actual Costco HTML structure)
            # Common patterns: product tiles, product cards, etc.
            product_links = soup.find_all('a', href=re.compile(r'/.*\.product\.\d+\.html'))

            for link in product_links:
                href = link.get('href', '')
                if href:
                    # Make absolute URL
                    if href.startswith('http'):
                        product_url = href
                    else:
                        product_url = self.base_url + href

                    if product_url not in product_urls:
                        product_urls.append(product_url)

        except Exception as e:
            self.logger.error(f"Error scraping category {category_url}: {e}")

        return product_urls

    def scrape_product(self, product_url: str) -> Optional[Dict]:
        """
        Scrape a product page for item details.

        Args:
            product_url: URL of the product page

        Returns:
            Dictionary containing product details
        """
        self._init_driver()

        try:
            self.driver.get(product_url)
            time.sleep(2)

            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extract product name
            name_elem = soup.find('h1', {'automation-id': 'productName'})
            if not name_elem:
                name_elem = soup.find('h1', class_=re.compile(r'product.*name', re.I))
            name = name_elem.get_text(strip=True) if name_elem else "Unknown Product"

            # Extract price
            price = None
            price_elem = soup.find('span', class_=re.compile(r'.*price.*', re.I))
            if not price_elem:
                price_elem = soup.find('span', {'automation-id': 'productPrice'})
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                # Extract numeric value
                price_match = re.search(r'\$?(\d+(?:,\d{3})*\.?\d*)', price_text)
                if price_match:
                    price = float(price_match.group(1).replace(',', ''))

            # Extract image URLs
            image_urls = []
            # Main product image
            main_img = soup.find('img', {'automation-id': 'productImage'})
            if not main_img:
                main_img = soup.find('img', class_=re.compile(r'product.*image', re.I))

            if main_img and main_img.get('src'):
                image_urls.append(main_img['src'])

            # Additional images
            img_gallery = soup.find_all('img', class_=re.compile(r'thumbnail|gallery', re.I))
            for img in img_gallery:
                img_src = img.get('src') or img.get('data-src')
                if img_src and img_src not in image_urls:
                    image_urls.append(img_src)

            # Get nutrition label images specifically
            nutrition_imgs = soup.find_all('img', alt=re.compile(r'nutrition|label', re.I))
            for img in nutrition_imgs:
                img_src = img.get('src') or img.get('data-src')
                if img_src and img_src not in image_urls:
                    image_urls.append(img_src)

            return {
                'name': name,
                'url': product_url,
                'price': price,
                'image_urls': image_urls,
                'raw_html': str(soup)
            }

        except Exception as e:
            self.logger.error(f"Error scraping product {product_url}: {e}")
            return None

    def scrape_all(self) -> List[Dict]:
        """Override to ensure driver cleanup"""
        try:
            return super().scrape_all()
        finally:
            self._close_driver()

    def __del__(self):
        """Cleanup on deletion"""
        self._close_driver()
