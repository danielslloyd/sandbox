"""
Image downloader for product images.
Downloads and organizes product images for nutrition analysis.
"""

import os
import hashlib
import requests
from typing import List, Dict
from pathlib import Path
import logging


class ImageDownloader:
    """Downloads and manages product images"""

    def __init__(self, output_dir: str = "images", verbose: bool = True):
        """
        Initialize image downloader.

        Args:
            output_dir: Directory to save images
            verbose: Enable verbose logging
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.verbose = verbose
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Set up logging"""
        logger = logging.getLogger(self.__class__.__name__)
        logger.setLevel(logging.DEBUG if self.verbose else logging.INFO)

        handler = logging.StreamHandler()
        handler.setLevel(logging.DEBUG if self.verbose else logging.INFO)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)
        return logger

    def _get_image_filename(self, url: str, product_name: str, index: int) -> str:
        """
        Generate a unique filename for an image.

        Args:
            url: Image URL
            product_name: Name of the product
            index: Index of the image for this product

        Returns:
            Filename for the image
        """
        # Create hash of URL for uniqueness
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

        # Clean product name for filename
        clean_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in product_name)
        clean_name = clean_name.replace(' ', '_')[:50]  # Limit length

        # Get file extension from URL
        ext = '.jpg'  # Default
        if '.' in url.split('/')[-1]:
            url_ext = url.split('/')[-1].split('.')[-1].lower()
            if url_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                ext = f'.{url_ext}'

        return f"{clean_name}_{index}_{url_hash}{ext}"

    def download_image(self, url: str, product_name: str, index: int = 0) -> str:
        """
        Download a single image.

        Args:
            url: Image URL
            product_name: Name of the product
            index: Index of the image for this product

        Returns:
            Path to downloaded image, or empty string on failure
        """
        try:
            # Handle relative URLs
            if url.startswith('//'):
                url = 'https:' + url

            self.logger.debug(f"Downloading image {index} for {product_name}")
            self.logger.debug(f"  URL: {url}")

            # Download image
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            # Save image
            filename = self._get_image_filename(url, product_name, index)
            filepath = self.output_dir / filename

            with open(filepath, 'wb') as f:
                f.write(response.content)

            self.logger.debug(f"  ✓ Saved to: {filepath}")
            return str(filepath)

        except Exception as e:
            self.logger.error(f"  ✗ Error downloading image: {e}")
            return ""

    def download_product_images(self, product: Dict) -> List[str]:
        """
        Download all images for a product.

        Args:
            product: Product dictionary with 'name' and 'image_urls'

        Returns:
            List of paths to downloaded images
        """
        product_name = product.get('name', 'unknown')
        image_urls = product.get('image_urls', [])

        if not image_urls:
            self.logger.warning(f"No images found for: {product_name}")
            return []

        self.logger.info(f"Downloading {len(image_urls)} images for: {product_name}")

        downloaded_paths = []
        for i, url in enumerate(image_urls):
            path = self.download_image(url, product_name, i)
            if path:
                downloaded_paths.append(path)

        self.logger.info(f"  Successfully downloaded {len(downloaded_paths)}/{len(image_urls)} images")

        return downloaded_paths

    def download_all_images(self, products: List[Dict]) -> Dict[str, List[str]]:
        """
        Download images for all products.

        Args:
            products: List of product dictionaries

        Returns:
            Dictionary mapping product names to lists of image paths
        """
        self.logger.info(f"Starting image download for {len(products)} products")
        self.logger.info("=" * 80)

        image_map = {}

        for i, product in enumerate(products, 1):
            product_name = product.get('name', f'product_{i}')
            self.logger.info(f"\n[{i}/{len(products)}] {product_name}")

            paths = self.download_product_images(product)
            image_map[product_name] = paths

        self.logger.info("\n" + "=" * 80)
        self.logger.info(f"Image download complete!")
        total_images = sum(len(paths) for paths in image_map.values())
        self.logger.info(f"Total images downloaded: {total_images}")

        return image_map
