#!/usr/bin/env python3
"""
Main wrapper for food scraping pipeline.
Orchestrates scraping, image download, and nutrition extraction.
"""

import argparse
import sys
from pathlib import Path

from scrapers import CostcoScraper
from image_downloader import ImageDownloader
from nutrition_extractor import NutritionExtractor
from database import FoodDatabase


def main():
    """Main scraping pipeline"""
    parser = argparse.ArgumentParser(description='Scrape food items and extract nutrition info')
    parser.add_argument('--retailer', type=str, default='costco',
                        help='Retailer to scrape (currently only "costco" supported)')
    parser.add_argument('--skip-scrape', action='store_true',
                        help='Skip scraping (use existing data)')
    parser.add_argument('--skip-images', action='store_true',
                        help='Skip image download')
    parser.add_argument('--skip-nutrition', action='store_true',
                        help='Skip nutrition extraction')
    parser.add_argument('--db-path', type=str, default='data/food_items.json',
                        help='Path to database file')
    parser.add_argument('--image-dir', type=str, default='images',
                        help='Directory for images')
    parser.add_argument('--max-items', type=int, default=None,
                        help='Maximum number of items to scrape (for testing)')
    parser.add_argument('--quiet', action='store_true',
                        help='Reduce logging verbosity')

    # LLM backend options
    parser.add_argument('--backend', type=str, default='ollama',
                        choices=['ollama', 'anthropic'],
                        help='LLM backend for nutrition extraction (default: ollama)')
    parser.add_argument('--ollama-model', type=str, default='llava',
                        help='Ollama model to use (default: llava)')
    parser.add_argument('--ollama-host', type=str, default='http://localhost:11434',
                        help='Ollama server URL (default: http://localhost:11434)')

    args = parser.parse_args()

    verbose = not args.quiet

    print("=" * 80)
    print("FOOD NUTRITION SCRAPER")
    print("=" * 80)
    print(f"Retailer: {args.retailer}")
    print(f"Database: {args.db_path}")
    print(f"Images: {args.image_dir}")
    print(f"LLM Backend: {args.backend}")
    if args.backend == 'ollama':
        print(f"Ollama Model: {args.ollama_model}")
        print(f"Ollama Host: {args.ollama_host}")
    print("=" * 80)
    print()

    # Initialize database
    db = FoodDatabase(db_path=args.db_path, verbose=verbose)

    # Step 1: Scrape products
    products = []
    if not args.skip_scrape:
        print("\n" + "=" * 80)
        print("STEP 1: SCRAPING PRODUCTS")
        print("=" * 80)

        if args.retailer.lower() == 'costco':
            scraper = CostcoScraper(verbose=verbose, headless=False)  # Temporarily non-headless for debugging
        else:
            print(f"Error: Retailer '{args.retailer}' not supported yet")
            print("Currently supported: costco")
            sys.exit(1)

        try:
            products = scraper.scrape_all()

            # Limit for testing
            if args.max_items and len(products) > args.max_items:
                print(f"\nLimiting to {args.max_items} items for testing")
                products = products[:args.max_items]

            print(f"\n✓ Scraped {len(products)} products")

        except Exception as e:
            print(f"\n✗ Error during scraping: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    else:
        print("\n⊗ Skipping scraping step")
        products = db.get_all_items()
        if not products:
            print("Error: No existing products in database and --skip-scrape specified")
            sys.exit(1)
        print(f"Loaded {len(products)} existing products from database")

    # Step 2: Download images
    image_map = {}
    if not args.skip_images and products:
        print("\n" + "=" * 80)
        print("STEP 2: DOWNLOADING IMAGES")
        print("=" * 80)

        downloader = ImageDownloader(output_dir=args.image_dir, verbose=verbose)

        try:
            image_map = downloader.download_all_images(products)
            print(f"\n✓ Downloaded images for {len(image_map)} products")

            # Update products with image paths
            for product in products:
                product['image_paths'] = image_map.get(product.get('name', ''), [])

        except Exception as e:
            print(f"\n✗ Error downloading images: {e}")
            import traceback
            traceback.print_exc()

    else:
        print("\n⊗ Skipping image download step")

    # Step 3: Extract nutrition information
    if not args.skip_nutrition and products and image_map:
        print("\n" + "=" * 80)
        print("STEP 3: EXTRACTING NUTRITION INFORMATION")
        print("=" * 80)

        try:
            extractor = NutritionExtractor(
                backend=args.backend,
                ollama_model=args.ollama_model,
                ollama_host=args.ollama_host,
                verbose=verbose
            )
            products = extractor.extract_all(products, image_map)
            print(f"\n✓ Extracted nutrition info")

        except (ValueError, ConnectionError) as e:
            print(f"\n⊗ Skipping nutrition extraction: {e}")
            if args.backend == 'anthropic':
                print("Set ANTHROPIC_API_KEY environment variable to enable Anthropic API")
            elif args.backend == 'ollama':
                print("Make sure Ollama is running: ollama serve")
                print(f"And the model is available: ollama pull {args.ollama_model}")

        except Exception as e:
            print(f"\n✗ Error extracting nutrition: {e}")
            import traceback
            traceback.print_exc()

    else:
        print("\n⊗ Skipping nutrition extraction step")

    # Step 4: Save to database
    print("\n" + "=" * 80)
    print("STEP 4: SAVING TO DATABASE")
    print("=" * 80)

    try:
        if not args.skip_scrape:
            # Add new items
            db.add_items(products)
        db.save()

        # Print stats
        stats = db.get_stats()
        print(f"\nDatabase Statistics:")
        print(f"  Total items: {stats['total_items']}")
        print(f"  Items with nutrition: {stats['items_with_nutrition']}")
        print(f"  Retailers: {stats['retailers']}")
        print(f"  Last updated: {stats['last_updated']}")

        # Export for visualization
        print("\nExporting data for visualization...")
        viz_data = db.export_for_visualization()
        print(f"✓ Exported {len(viz_data)} items ready for visualization")

    except Exception as e:
        print(f"\n✗ Error saving to database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Done!
    print("\n" + "=" * 80)
    print("SCRAPING COMPLETE!")
    print("=" * 80)
    print(f"\nNext steps:")
    print(f"  1. View data: {args.db_path}")
    print(f"  2. Open visualization: open static/index.html")
    print()


if __name__ == '__main__':
    main()
