"""
LLM-based nutrition information extractor.
Uses vision-capable LLMs to extract nutrition facts from product images.
Supports both Anthropic API and local Ollama models.
"""

import os
import base64
import json
from typing import Dict, List, Optional
from pathlib import Path
import logging
import requests


class NutritionExtractor:
    """Extracts nutrition information from product images using LLM"""

    def __init__(self,
                 backend: str = 'ollama',
                 api_key: Optional[str] = None,
                 ollama_model: str = 'llava',
                 ollama_host: str = 'http://localhost:11434',
                 verbose: bool = True):
        """
        Initialize nutrition extractor.

        Args:
            backend: 'ollama' or 'anthropic'
            api_key: Anthropic API key (only needed for anthropic backend)
            ollama_model: Ollama model to use (llava, bakllava, llava-phi3, etc.)
            ollama_host: Ollama server URL
            verbose: Enable verbose logging
        """
        self.backend = backend.lower()
        self.verbose = verbose
        self.logger = self._setup_logger()

        if self.backend == 'anthropic':
            try:
                import anthropic
                self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
                if not self.api_key:
                    raise ValueError("Anthropic API key required. Set ANTHROPIC_API_KEY env var or pass api_key parameter")
                self.client = anthropic.Anthropic(api_key=self.api_key)
                self.logger.info("Using Anthropic Claude API for nutrition extraction")
            except ImportError:
                raise ImportError("anthropic package required for Anthropic backend. Install with: pip install anthropic")

        elif self.backend == 'ollama':
            self.ollama_model = ollama_model
            self.ollama_host = ollama_host
            # Test Ollama connection
            try:
                response = requests.get(f"{self.ollama_host}/api/tags", timeout=5)
                response.raise_for_status()
                self.logger.info(f"Using Ollama local model: {self.ollama_model}")
            except Exception as e:
                raise ConnectionError(f"Cannot connect to Ollama at {self.ollama_host}. Is Ollama running? Error: {e}")

        else:
            raise ValueError(f"Invalid backend: {self.backend}. Must be 'ollama' or 'anthropic'")

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

    def _encode_image(self, image_path: str) -> tuple[str, str]:
        """
        Encode image to base64.

        Args:
            image_path: Path to image file

        Returns:
            Tuple of (base64_data, media_type)
        """
        with open(image_path, 'rb') as f:
            image_data = f.read()

        # Determine media type
        ext = Path(image_path).suffix.lower()
        media_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        media_type = media_type_map.get(ext, 'image/jpeg')

        base64_data = base64.standard_b64encode(image_data).decode('utf-8')

        return base64_data, media_type

    def extract_from_image(self, image_path: str) -> Optional[Dict]:
        """
        Extract nutrition information from a single image.

        Args:
            image_path: Path to product image

        Returns:
            Dictionary with nutrition info, or None if extraction failed
        """
        try:
            self.logger.debug(f"Extracting nutrition from: {image_path}")

            if self.backend == 'ollama':
                return self._extract_ollama(image_path)
            elif self.backend == 'anthropic':
                return self._extract_anthropic(image_path)

        except Exception as e:
            self.logger.error(f"  ✗ Error extracting nutrition: {e}")
            return None

    def _extract_ollama(self, image_path: str) -> Optional[Dict]:
        """Extract nutrition using Ollama"""
        # Encode image
        base64_data, _ = self._encode_image(image_path)

        # Create prompt
        prompt = """Analyze this product image and extract nutrition information if visible.

Look for nutrition facts labels and extract:
1. Grams per serving (serving size in grams)
2. Number of servings per container
3. Total calories per serving
4. Grams of protein per serving
5. Grams of carbohydrates per serving (total carbs)
6. Grams of fat per serving (total fat)

Return ONLY a JSON object with these exact keys:
{
    "serving_size_grams": <number or null>,
    "servings_per_container": <number or null>,
    "calories_per_serving": <number or null>,
    "protein_grams": <number or null>,
    "carbs_grams": <number or null>,
    "fat_grams": <number or null>,
    "found_nutrition_label": <true or false>
}

If you cannot find a value, use null. Return ONLY valid JSON, no other text."""

        # Call Ollama API
        response = requests.post(
            f"{self.ollama_host}/api/generate",
            json={
                "model": self.ollama_model,
                "prompt": prompt,
                "images": [base64_data],
                "stream": False,
                "format": "json"
            },
            timeout=120
        )
        response.raise_for_status()

        # Parse response
        result = response.json()
        response_text = result.get('response', '').strip()

        # Extract JSON
        nutrition_data = self._parse_json_response(response_text)
        if nutrition_data:
            self.logger.debug(f"  ✓ Extracted: {nutrition_data}")
        return nutrition_data

    def _extract_anthropic(self, image_path: str) -> Optional[Dict]:
        """Extract nutrition using Anthropic Claude"""
        # Encode image
        base64_data, media_type = self._encode_image(image_path)

        # Create prompt
        prompt = """Please analyze this product image and extract the following nutrition information if visible:

1. Grams per serving
2. Number of servings per container
3. Total calories per serving
4. Grams of protein per serving
5. Grams of carbohydrates per serving
6. Grams of fat per serving

Look for nutrition facts labels, ingredient lists, or any text on the packaging that contains this information.

Return the information in JSON format with these exact keys:
{
    "serving_size_grams": <number or null>,
    "servings_per_container": <number or null>,
    "calories_per_serving": <number or null>,
    "protein_grams": <number or null>,
    "carbs_grams": <number or null>,
    "fat_grams": <number or null>,
    "found_nutrition_label": <true or false>
}

If you cannot find a specific value, use null. Only include numeric values you can clearly read from the image.
Return ONLY the JSON object, no other text."""

        # Call Claude API
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": base64_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        # Parse response
        response_text = message.content[0].text.strip()
        nutrition_data = self._parse_json_response(response_text)
        if nutrition_data:
            self.logger.debug(f"  ✓ Extracted: {nutrition_data}")
        return nutrition_data

    def _parse_json_response(self, response_text: str) -> Optional[Dict]:
        """Parse JSON from LLM response"""
        # Extract JSON from response (in case there's extra text)
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                self.logger.warning(f"  ✗ Invalid JSON in response")
                return None
        else:
            self.logger.warning(f"  ✗ Could not find JSON in response")
            return None

    def extract_from_images(self, image_paths: List[str]) -> Dict:
        """
        Extract nutrition information from multiple images (tries until successful).

        Args:
            image_paths: List of image paths to analyze

        Returns:
            Dictionary with best nutrition info found
        """
        best_result = {
            "serving_size_grams": None,
            "servings_per_container": None,
            "calories_per_serving": None,
            "protein_grams": None,
            "carbs_grams": None,
            "fat_grams": None,
            "found_nutrition_label": False
        }

        for image_path in image_paths:
            result = self.extract_from_image(image_path)

            if result and result.get('found_nutrition_label'):
                # Merge non-null values
                for key in best_result:
                    if result.get(key) is not None:
                        best_result[key] = result[key]

                # If we found everything, we can stop
                if all(best_result[k] is not None for k in best_result if k != 'found_nutrition_label'):
                    self.logger.info("  ✓ Complete nutrition information found")
                    break

        return best_result

    def extract_for_product(self, product: Dict, image_paths: List[str]) -> Dict:
        """
        Extract nutrition information for a product.

        Args:
            product: Product dictionary
            image_paths: List of image paths for this product

        Returns:
            Product dictionary updated with nutrition info
        """
        product_name = product.get('name', 'Unknown')

        if not image_paths:
            self.logger.warning(f"No images available for: {product_name}")
            return product

        self.logger.info(f"Analyzing {len(image_paths)} images for: {product_name}")

        nutrition_data = self.extract_from_images(image_paths)

        # Add nutrition data to product
        product['nutrition'] = nutrition_data

        # Log what we found
        found_count = sum(1 for v in nutrition_data.values() if v is not None and v is not False)
        self.logger.info(f"  Found {found_count}/6 nutrition fields")

        return product

    def extract_all(self, products: List[Dict], image_map: Dict[str, List[str]]) -> List[Dict]:
        """
        Extract nutrition information for all products.

        Args:
            products: List of product dictionaries
            image_map: Dictionary mapping product names to image paths

        Returns:
            Updated list of products with nutrition info
        """
        self.logger.info(f"Starting nutrition extraction for {len(products)} products")
        self.logger.info("=" * 80)

        updated_products = []

        for i, product in enumerate(products, 1):
            product_name = product.get('name', f'product_{i}')
            self.logger.info(f"\n[{i}/{len(products)}] {product_name}")

            image_paths = image_map.get(product_name, [])
            updated_product = self.extract_for_product(product, image_paths)
            updated_products.append(updated_product)

        self.logger.info("\n" + "=" * 80)
        self.logger.info("Nutrition extraction complete!")

        # Statistics
        products_with_nutrition = sum(
            1 for p in updated_products
            if p.get('nutrition', {}).get('found_nutrition_label')
        )
        self.logger.info(f"Products with nutrition labels: {products_with_nutrition}/{len(products)}")

        return updated_products
