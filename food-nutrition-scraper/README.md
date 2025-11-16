# 🍎 Food Nutrition Scraper & Visualizer

A comprehensive web scraping and visualization tool that extracts food items from retailers (starting with Costco), downloads product images, uses AI to extract nutrition information from images, and visualizes the macronutrient composition in an interactive ternary plot.

## Features

- 🕷️ **Flexible Web Scraper**: Modular architecture supports multiple retailers
- 🖼️ **Image Downloader**: Automatically downloads product images for analysis
- 🤖 **AI Nutrition Extraction**: Uses Claude AI to extract nutrition facts from product images
- 💾 **JSON Database**: Simple and portable storage for scraped data
- 📊 **Interactive Ternary Plot**: Beautiful HTML5 visualization showing protein/carbs/fat ratios
- 🎯 **Interactive Features**: Hover, click, and explore products with links to original pages
- 📈 **Iso-calorie Lines**: Visual guides for calories per gram of protein

## Architecture

### Modular Scraper Design

The scraper uses an abstract base class (`BaseFoodScraper`) that can be extended for any retailer:

```
scrapers/
├── base_scraper.py      # Abstract base class
├── costco_scraper.py    # Costco implementation
└── [future retailers]   # Easy to add more!
```

### Data Flow

1. **Scrape** → Products scraped from retailer website
2. **Download** → Product images downloaded locally
3. **Extract** → AI analyzes images for nutrition facts
4. **Store** → Data saved to JSON database
5. **Visualize** → Interactive ternary plot in browser

## Installation

### Prerequisites

- Python 3.8+
- Chrome/Chromium browser (for Selenium)
- ChromeDriver (installed automatically with selenium)
- Anthropic API key (for nutrition extraction)

### Setup

1. Clone or download this project

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your Anthropic API key:
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Or create a `.env` file:
```
ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

### Quick Start

Run the complete pipeline:

```bash
python main_scraper.py
```

This will:
1. Scrape food items from Costco
2. Download product images
3. Extract nutrition information using AI
4. Save everything to `data/food_items.json`
5. Export visualization data to `data/visualization_data.json`

Then open the visualization:
```bash
open static/index.html
```

### Command Line Options

```bash
# Limit items for testing
python main_scraper.py --max-items 10

# Skip certain steps (useful for re-running parts)
python main_scraper.py --skip-scrape        # Use existing scraped data
python main_scraper.py --skip-images        # Skip image download
python main_scraper.py --skip-nutrition     # Skip AI extraction

# Custom paths
python main_scraper.py --db-path custom/db.json --image-dir custom/images

# Quiet mode (less verbose)
python main_scraper.py --quiet

# Specify retailer (currently only 'costco' supported)
python main_scraper.py --retailer costco
```

### Example Workflow

```bash
# 1. Test with a few items first
python main_scraper.py --max-items 5

# 2. Review the data
cat data/food_items.json

# 3. Open visualization
open static/index.html

# 4. Run full scrape (this will take a while!)
python main_scraper.py
```

## Visualization

The ternary plot shows the macronutrient composition of each food item:

- **Top vertex**: 100% Protein
- **Bottom-left vertex**: 100% Fat
- **Bottom-right vertex**: 100% Carbs

### Features

- **Hover**: See detailed nutrition info and price
- **Click**: Open product page on retailer website
- **Filter**: View specific retailers
- **Toggle**: Show/hide iso-calorie lines and labels
- **Color-coded**: Different colors for each retailer

### Interpreting the Plot

- Items near the **top** are high in protein
- Items near the **bottom-left** are high in fat
- Items near the **bottom-right** are high in carbs
- Items in the **center** have balanced macros

## Project Structure

```
food-nutrition-scraper/
├── scrapers/
│   ├── __init__.py
│   ├── base_scraper.py       # Abstract base scraper
│   └── costco_scraper.py     # Costco implementation
├── static/
│   └── index.html            # Ternary plot visualization
├── data/                     # Generated data (gitignored)
│   ├── food_items.json       # Main database
│   └── visualization_data.json
├── images/                   # Downloaded images (gitignored)
├── main_scraper.py           # Main pipeline script
├── image_downloader.py       # Image download module
├── nutrition_extractor.py    # AI nutrition extraction
├── database.py               # JSON database handler
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Adding New Retailers

To add support for a new retailer, create a new scraper class:

```python
# scrapers/walmart_scraper.py
from .base_scraper import BaseFoodScraper

class WalmartScraper(BaseFoodScraper):
    def get_retailer_name(self):
        return "Walmart"

    def get_category_urls(self):
        # Return list of category URLs
        return [...]

    def scrape_category(self, category_url):
        # Scrape product URLs from category
        return [...]

    def scrape_product(self, product_url):
        # Scrape product details
        return {
            'name': ...,
            'url': ...,
            'price': ...,
            'image_urls': [...]
        }
```

Then update `main_scraper.py` to import and use your new scraper.

## Data Schema

### Product Item

```json
{
  "name": "Product Name",
  "url": "https://...",
  "price": 12.99,
  "retailer": "Costco",
  "image_urls": ["https://..."],
  "image_paths": ["/path/to/image.jpg"],
  "nutrition": {
    "serving_size_grams": 28,
    "servings_per_container": 10,
    "calories_per_serving": 150,
    "protein_grams": 5,
    "carbs_grams": 20,
    "fat_grams": 6,
    "found_nutrition_label": true
  },
  "scraped_at": "2024-01-01T12:00:00",
  "added_at": "2024-01-01T12:00:00"
}
```

### Visualization Data

```json
{
  "name": "Product Name",
  "url": "https://...",
  "price": 12.99,
  "retailer": "Costco",
  "calories": 150,
  "protein_grams": 5,
  "carbs_grams": 20,
  "fat_grams": 6,
  "protein_percent": 13.33,
  "carbs_percent": 53.33,
  "fat_percent": 33.33,
  "calories_per_dollar": 11.55
}
```

## Troubleshooting

### Selenium/ChromeDriver Issues

If you get ChromeDriver errors:

1. Make sure Chrome is installed
2. Update selenium: `pip install --upgrade selenium`
3. ChromeDriver should install automatically with modern selenium

### API Rate Limits

The Anthropic API has rate limits. If you hit them:

- Use `--max-items` to limit the number of items
- Run in batches
- The scraper will log errors but continue with other items

### No Nutrition Data Found

If nutrition extraction fails:

- Check that images are downloading correctly
- Verify your `ANTHROPIC_API_KEY` is set
- Some products may not have visible nutrition labels in their images
- Try manually adding nutrition facts to the JSON if needed

### Website Structure Changes

Retailers frequently update their websites. If scraping fails:

1. Check the HTML structure in your browser's inspector
2. Update the CSS selectors in the scraper
3. The verbose logging will help identify what's failing

## Performance

- **Scraping**: ~2-5 seconds per product (depends on page load times)
- **Image download**: ~1-2 seconds per image
- **AI extraction**: ~2-3 seconds per image (API call)
- **Full Costco scrape**: Estimated 2-4 hours for 500+ items

Tips for faster testing:
- Use `--max-items 10` for testing
- Use `--skip-*` flags to skip completed steps
- Run overnight for full scrapes

## Cost Estimates

- **Anthropic API**: ~$0.02-0.05 per product analyzed (depends on image count)
- **Full Costco scrape**: Estimated $10-25 in API costs for 500 items

Save costs by:
- Testing with `--max-items` first
- Only running nutrition extraction on products you care about
- Reusing existing data with `--skip-nutrition`

## Future Enhancements

- [ ] Add more retailers (Walmart, Whole Foods, etc.)
- [ ] Add fast food nutrition scraping
- [ ] Price per calorie analysis
- [ ] Nutrition score/ranking system
- [ ] Export to CSV/Excel
- [ ] Database migrations for schema changes
- [ ] Caching for API calls
- [ ] Multi-threading for faster scraping
- [ ] Advanced filtering in visualization
- [ ] Mobile-responsive visualization

## Contributing

To add a new retailer:

1. Create a new scraper in `scrapers/`
2. Extend `BaseFoodScraper`
3. Implement the required methods
4. Update `main_scraper.py` to support your retailer
5. Update the color scheme in `static/index.html`

## License

MIT License - feel free to use and modify!

## Acknowledgments

- Built with Selenium for web scraping
- Anthropic Claude for AI vision capabilities
- HTML5 Canvas for visualization
- Inspired by the need to make informed food choices

---

**Happy scraping! 🍎🥗🍕**
