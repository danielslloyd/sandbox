"""
Base scraper class for flexible food retailer scraping.
Designed to be extended for different retailers (Costco, Walmart, etc.)
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import logging
from datetime import datetime


class BaseFoodScraper(ABC):
    """Abstract base class for food item scrapers"""

    def __init__(self, verbose: bool = True):
        """
        Initialize the scraper.

        Args:
            verbose: Enable verbose logging
        """
        self.verbose = verbose
        self.logger = self._setup_logger()
        self.items_scraped = []

    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the scraper"""
        logger = logging.getLogger(self.__class__.__name__)
        logger.setLevel(logging.DEBUG if self.verbose else logging.INFO)

        # Console handler
        handler = logging.StreamHandler()
        handler.setLevel(logging.DEBUG if self.verbose else logging.INFO)

        # Format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)
        return logger

    @abstractmethod
    def get_retailer_name(self) -> str:
        """Return the name of the retailer"""
        pass

    @abstractmethod
    def get_category_urls(self) -> List[str]:
        """
        Get URLs for all food categories to scrape.

        Returns:
            List of category URLs
        """
        pass

    @abstractmethod
    def scrape_category(self, category_url: str) -> List[str]:
        """
        Scrape a category page for product URLs.

        Args:
            category_url: URL of the category page

        Returns:
            List of product URLs
        """
        pass

    @abstractmethod
    def scrape_product(self, product_url: str) -> Optional[Dict]:
        """
        Scrape a product page for item details.

        Args:
            product_url: URL of the product page

        Returns:
            Dictionary containing:
                - name: Product name
                - url: Product URL
                - price: Price in dollars (float)
                - image_urls: List of image URLs
                - raw_html: Raw HTML for additional parsing if needed
        """
        pass

    def scrape_all(self) -> List[Dict]:
        """
        Scrape all food items from the retailer.

        Returns:
            List of scraped items
        """
        self.logger.info(f"Starting scrape for {self.get_retailer_name()}")
        self.logger.info("=" * 80)

        # Get all category URLs
        self.logger.info("Fetching category URLs...")
        category_urls = self.get_category_urls()
        self.logger.info(f"Found {len(category_urls)} categories to scrape")

        # Scrape each category
        all_product_urls = []
        for i, category_url in enumerate(category_urls, 1):
            self.logger.info(f"\n[{i}/{len(category_urls)}] Scraping category: {category_url}")
            try:
                product_urls = self.scrape_category(category_url)
                self.logger.info(f"  → Found {len(product_urls)} products")
                all_product_urls.extend(product_urls)
            except Exception as e:
                self.logger.error(f"  → Error scraping category: {e}")
                continue

        self.logger.info(f"\nTotal products found: {len(all_product_urls)}")
        self.logger.info("=" * 80)

        # Scrape each product
        self.logger.info("\nScraping individual products...")
        for i, product_url in enumerate(all_product_urls, 1):
            self.logger.info(f"\n[{i}/{len(all_product_urls)}] Scraping: {product_url}")
            try:
                item = self.scrape_product(product_url)
                if item:
                    item['scraped_at'] = datetime.now().isoformat()
                    item['retailer'] = self.get_retailer_name()
                    self.items_scraped.append(item)
                    self.logger.info(f"  ✓ {item.get('name', 'Unknown')} - ${item.get('price', 'N/A')}")
                else:
                    self.logger.warning(f"  ✗ Failed to scrape product")
            except Exception as e:
                self.logger.error(f"  ✗ Error: {e}")
                continue

        self.logger.info("\n" + "=" * 80)
        self.logger.info(f"Scraping complete! Total items: {len(self.items_scraped)}")

        return self.items_scraped
