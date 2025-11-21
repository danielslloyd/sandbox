# Vocabulary Learning Application

A comprehensive vocabulary building tool with adaptive difficulty, spaced repetition, and flashcard modes.

## Features

- **Adaptive Quiz Mode**: Dynamically adjusts difficulty to triangulate your vocabulary level
- **Spaced Repetition**: Smart review system that schedules words based on your performance
- **Flashcard Mode**: Review recently learned or difficult words
- **Multi-user Support**: Track progress for multiple users locally
- **Etymology & Definitions**: Learn word origins and multiple definitions
- **False Definition Generator**: Test your knowledge with plausible incorrect definitions
- **Optional LLM Integration**: Use local Ollama for more convincing false definitions

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd Vocab
   pip install -r requirements.txt
   ```

3. Run the application:
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
3. Ensure Ollama is running (default: http://localhost:11434)
4. The app will automatically use LLM-generated false definitions when available

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

All user data is stored locally in `user_data.json` (gitignored):
- Multiple user profiles supported
- Progress tracked per word
- Quiz history and statistics
- Spaced repetition schedules

Word data is cached in `word_cache.json` (gitignored) to reduce API calls.

## API Used

- **Free Dictionary API**: https://dictionaryapi.dev/
  - No API key required
  - Provides definitions, etymology, and pronunciation

## File Structure

```
Vocab/
├── vocab_app.py              # Main application
├── words_by_frequency.json   # Word list sorted by frequency
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── .gitignore               # Git ignore rules
├── user_data.json           # User progress (gitignored)
└── word_cache.json          # Cached word data (gitignored)
```

## Tips for Learning

1. **Start with the Adaptive Quiz** to establish your baseline vocabulary level
2. **Use Review Mode daily** to reinforce learning with spaced repetition
3. **Flashcard Mode** is great for quick 5-10 minute study sessions
4. **Read the etymology** to understand word origins and remember them better
5. **Be consistent** - regular short sessions are more effective than long cramming

## Future Enhancements

Potential features to add:
- Export progress to CSV/JSON
- Import custom word lists
- Pronunciation audio
- Word usage examples from real texts
- Achievement system and gamification
- Mobile app version
- Cloud sync for multi-device support

## Contributing

Feel free to submit issues or pull requests to improve the application!

## License

MIT License - Feel free to use and modify as needed.
