# Vocabulary Learning Application

A comprehensive vocabulary building tool with adaptive difficulty, spaced repetition, and flashcard modes. Built with HTML, CSS, and JavaScript - **no installation required!**

## Features

- **Adaptive Quiz Mode**: Dynamically adjusts difficulty to triangulate your vocabulary level
- **Spaced Repetition**: Smart review system that schedules words based on your performance
- **Flashcard Mode**: Review recently learned or difficult words
- **Multi-user Support**: Track progress for multiple users locally (using localStorage)
- **Etymology & Definitions**: Learn word origins and multiple definitions
- **False Definition Generator**: Test your knowledge with plausible incorrect definitions
- **Optional LLM Integration**: Use local Ollama for more convincing false definitions
- **Offline-capable**: Works in your browser, data stored locally

## Quick Start (HTML Version - Recommended)

1. Open `index.html` in your web browser
2. That's it! No installation needed.

**For local testing, you may need a simple HTTP server:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server

# Then open http://localhost:8000
```

## Alternative: Python CLI Version

The original Python version is still available:

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python vocab_app.py
   ```

## Usage

### Main Menu Options

1. **Adaptive Quiz**: Take a quiz that adapts to your level. The system will present progressively harder or easier words based on your performance to estimate your vocabulary size.

2. **Review Mode**: Review words using spaced repetition. Words you get wrong will appear more frequently, while words you know well will appear less often.

3. **Flashcard Mode**: Cycle through words you've recently learned or gotten wrong. Great for quick review sessions.

4. **View Progress**: See your statistics including vocabulary level, words learned, and overall accuracy.

5. **Settings**: Change username, reset progress, or configure LLM integration.

### Optional: Local LLM Integration

For more convincing false definitions, you can use a local LLM via Ollama:

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. Generate false definitions:
   ```bash
   # Generate for 100 random words
   python scripts/generate_llm_definitions.py --count 100

   # Generate for specific words
   python scripts/generate_llm_definitions.py --words "ephemeral,ubiquitous,serendipity"

   # Use a different model
   python scripts/generate_llm_definitions.py --model mistral --count 50
   ```
5. The generated definitions are saved to `data/llm_false_definitions.json`
6. Refresh the HTML app to use the new definitions automatically

**Note:** The LLM script is completely separate from the HTML app. Run it once to generate definitions, and the HTML app will load them automatically.

## How It Works

### Adaptive Difficulty
The quiz starts at a moderate difficulty level and adjusts based on your performance:
- Correct answers → harder words
- Incorrect answers → easier words
- Final score estimates your vocabulary level

### Spaced Repetition Algorithm
Based on the SM-2 algorithm:
- Words you know well: reviewed less frequently
- Words you struggle with: reviewed more frequently
- Each review adjusts the next review date

### Word Database
- **3000+ common English words** sorted by frequency
- Definitions fetched from Free Dictionary API
- Etymology and pronunciation included
- Results cached locally for faster access

## Data Storage

### HTML Version
All data is stored in your browser's localStorage:
- **User Progress**: Multiple user profiles with stats
- **Word Cache**: API responses cached locally
- **Settings**: App preferences

Data persists between sessions and is private to your browser.

### Python Version
All user data is stored locally in JSON files (gitignored):
- `user_data.json` - User progress and statistics
- `word_cache.json` - Cached API responses

## API Used

- **Free Dictionary API**: https://dictionaryapi.dev/
  - No API key required
  - Provides definitions, etymology, and pronunciation

## File Structure

```
Vocab/
├── index.html                      # Main HTML application (START HERE!)
├── css/
│   └── styles.css                  # Application styles
├── js/
│   ├── vocab-app.js                # Main application controller
│   ├── word-database.js            # Word management & API
│   ├── user-progress.js            # User tracking with localStorage
│   └── spaced-repetition.js        # SR algorithm
├── data/
│   ├── words_by_frequency.json     # 3,500+ words sorted by frequency
│   └── llm_false_definitions.json  # LLM-generated false defs (optional)
├── scripts/
│   └── generate_llm_definitions.py # LLM definition generator (optional)
├── vocab_app.py                    # Python CLI version (alternative)
├── demo.py                         # Python demo script
├── requirements.txt                # Python dependencies
├── README.md                       # This file
└── .gitignore                      # Git ignore rules
```

## Tips for Learning

1. **Start with the Adaptive Quiz** to establish your baseline vocabulary level
2. **Use Review Mode daily** to reinforce learning with spaced repetition
3. **Flashcard Mode** is great for quick 5-10 minute study sessions
4. **Read the etymology** to understand word origins and remember them better
5. **Be consistent** - regular short sessions are more effective than long cramming

## Technical Details

### HTML/JavaScript Version
- **No dependencies**: Pure JavaScript (ES6 modules)
- **Responsive design**: Works on desktop, tablet, and mobile
- **localStorage**: All data stored locally in browser
- **Free Dictionary API**: Fetched via CORS-enabled endpoints
- **Modular architecture**: Separate concerns (UI, data, algorithms)

### Spaced Repetition Algorithm
- Based on SM-2 algorithm
- Ease factor: 1.3 - 4.0
- Interval adjustment based on performance
- Automatic scheduling of reviews

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6 module support
- localStorage required for data persistence

## Future Enhancements

Potential features to add:
- Export/import progress (CSV/JSON)
- Custom word lists
- Pronunciation audio (Web Speech API)
- Word usage examples from real texts
- Achievement system and gamification
- Progressive Web App (PWA) for offline use
- Dark mode theme
- Cloud sync option (Firebase, etc.)

## Troubleshooting

### CORS Issues
If you see CORS errors when fetching from the Dictionary API:
- Use a local HTTP server (not file://)
- Check browser console for specific errors
- Some browsers block API calls from file:// URLs

### localStorage Full
If localStorage is full:
- Clear browser data for the site
- Export your progress first (Settings screen)

### LLM Script Issues
If the LLM script fails:
- Ensure Ollama is running: `ollama serve`
- Check the model is installed: `ollama list`
- Try a different model: `--model mistral`

## Contributing

Feel free to submit issues or pull requests to improve the application!

## License

MIT License - Feel free to use and modify as needed.
