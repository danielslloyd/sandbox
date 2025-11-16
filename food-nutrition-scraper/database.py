"""
JSON database for storing scraped food items with nutrition information.
"""

import json
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
import logging


class FoodDatabase:
    """Simple JSON-based database for food items"""

    def __init__(self, db_path: str = "data/food_items.json", verbose: bool = True):
        """
        Initialize database.

        Args:
            db_path: Path to JSON database file
            verbose: Enable verbose logging
        """
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.verbose = verbose
        self.logger = self._setup_logger()
        self.data = self._load()

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

    def _load(self) -> Dict:
        """Load database from file"""
        if self.db_path.exists():
            self.logger.info(f"Loading database from: {self.db_path}")
            try:
                with open(self.db_path, 'r') as f:
                    data = json.load(f)
                    self.logger.info(f"  Loaded {len(data.get('items', []))} items")
                    return data
            except Exception as e:
                self.logger.error(f"Error loading database: {e}")
                return self._create_empty_db()
        else:
            self.logger.info("Creating new database")
            return self._create_empty_db()

    def _create_empty_db(self) -> Dict:
        """Create empty database structure"""
        return {
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "items": []
        }

    def save(self):
        """Save database to file"""
        try:
            self.data['last_updated'] = datetime.now().isoformat()

            with open(self.db_path, 'w') as f:
                json.dump(self.data, f, indent=2)

            self.logger.info(f"Database saved to: {self.db_path}")
            self.logger.info(f"  Total items: {len(self.data['items'])}")

        except Exception as e:
            self.logger.error(f"Error saving database: {e}")

    def add_item(self, item: Dict):
        """
        Add a single item to the database.

        Args:
            item: Item dictionary
        """
        # Add metadata
        if 'added_at' not in item:
            item['added_at'] = datetime.now().isoformat()

        self.data['items'].append(item)
        self.logger.debug(f"Added item: {item.get('name', 'Unknown')}")

    def add_items(self, items: List[Dict]):
        """
        Add multiple items to the database.

        Args:
            items: List of item dictionaries
        """
        self.logger.info(f"Adding {len(items)} items to database")

        for item in items:
            self.add_item(item)

        self.logger.info(f"  Total items in database: {len(self.data['items'])}")

    def get_all_items(self) -> List[Dict]:
        """
        Get all items from database.

        Returns:
            List of all items
        """
        return self.data.get('items', [])

    def get_items_with_nutrition(self) -> List[Dict]:
        """
        Get items that have complete nutrition information.

        Returns:
            List of items with nutrition data
        """
        items = []
        for item in self.data.get('items', []):
            nutrition = item.get('nutrition', {})
            # Check if we have the essential nutrition info
            if (nutrition.get('calories_per_serving') is not None and
                nutrition.get('protein_grams') is not None and
                nutrition.get('carbs_grams') is not None and
                nutrition.get('fat_grams') is not None):
                items.append(item)

        return items

    def get_by_retailer(self, retailer: str) -> List[Dict]:
        """
        Get items from a specific retailer.

        Args:
            retailer: Retailer name

        Returns:
            List of items from that retailer
        """
        return [
            item for item in self.data.get('items', [])
            if item.get('retailer', '').lower() == retailer.lower()
        ]

    def clear(self):
        """Clear all items from database"""
        self.logger.warning("Clearing all items from database")
        self.data = self._create_empty_db()

    def get_stats(self) -> Dict:
        """
        Get database statistics.

        Returns:
            Dictionary with database stats
        """
        items = self.data.get('items', [])
        items_with_nutrition = self.get_items_with_nutrition()

        retailers = {}
        for item in items:
            retailer = item.get('retailer', 'Unknown')
            retailers[retailer] = retailers.get(retailer, 0) + 1

        return {
            'total_items': len(items),
            'items_with_nutrition': len(items_with_nutrition),
            'retailers': retailers,
            'created_at': self.data.get('created_at'),
            'last_updated': self.data.get('last_updated')
        }

    def export_for_visualization(self, output_path: str = "data/visualization_data.json"):
        """
        Export data in format optimized for visualization.

        Args:
            output_path: Path to export file
        """
        items = self.get_items_with_nutrition()

        # Calculate percentages of calories from each macro
        viz_data = []
        for item in items:
            nutrition = item.get('nutrition', {})

            # Get values
            protein_g = nutrition.get('protein_grams', 0) or 0
            carbs_g = nutrition.get('carbs_grams', 0) or 0
            fat_g = nutrition.get('fat_grams', 0) or 0
            calories = nutrition.get('calories_per_serving', 0) or 0

            # Calculate calories from each macro
            # Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
            protein_cal = protein_g * 4
            carbs_cal = carbs_g * 4
            fat_cal = fat_g * 9

            total_macro_cal = protein_cal + carbs_cal + fat_cal

            if total_macro_cal > 0:
                # Calculate percentages
                protein_pct = (protein_cal / total_macro_cal) * 100
                carbs_pct = (carbs_cal / total_macro_cal) * 100
                fat_pct = (fat_cal / total_macro_cal) * 100

                viz_data.append({
                    'name': item.get('name', 'Unknown'),
                    'url': item.get('url', ''),
                    'price': item.get('price'),
                    'retailer': item.get('retailer', 'Unknown'),
                    'calories': calories,
                    'protein_grams': protein_g,
                    'carbs_grams': carbs_g,
                    'fat_grams': fat_g,
                    'protein_percent': round(protein_pct, 2),
                    'carbs_percent': round(carbs_pct, 2),
                    'fat_percent': round(fat_pct, 2),
                    'calories_per_dollar': round(calories / item['price'], 2) if item.get('price') else None
                })

        # Save
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(viz_data, f, indent=2)

        self.logger.info(f"Exported {len(viz_data)} items for visualization to: {output_path}")

        return viz_data
