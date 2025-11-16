# Text Rewriter

A self-contained web application for rewriting text using local AI models via Ollama. Features optional corpus-based style learning, allowing you to rewrite text in the style of example writings.

## Features

- 🎨 **Style-based rewriting**: Provide example writings to teach the AI a specific style
- 🚀 **One-click launch**: Simple launcher scripts for easy startup
- 💻 **Local processing**: Runs entirely on your machine with Ollama
- 🎯 **Flexible prompts**: Use with or without style corpus
- 📁 **File support**: Upload text files or paste directly
- 🖥️ **Clean UI**: Modern, single-page interface

## Prerequisites

1. **Python 3.8+** installed on your system
2. **Ollama** installed and running ([Download Ollama](https://ollama.ai))
3. At least one LLM model pulled in Ollama (e.g., `ollama pull llama3.2`)

## Installation

1. Navigate to the `rewriter` directory
2. The launcher will automatically install Python dependencies on first run

## Usage

### Quick Start

**Windows:**
- Double-click `launcher.bat`

**Mac/Linux:**
```bash
./launcher.sh
```

**Manual Start:**
```bash
python3 launcher.py
```

The application will:
1. Check dependencies and install if needed
2. Verify Ollama is running
3. Start the web server
4. Automatically open your browser to `http://localhost:5000`

### Using the Application

#### Basic Rewriting (No Style Corpus)

1. Enter your custom instructions in the "Custom Instructions" field
   - Example: "rewrite this paragraph to be at a second grade reading level"
2. Paste or upload the text you want to rewrite
3. Click "Rewrite Text"

#### Style-Based Rewriting (With Corpus)

1. Create a folder with example writings in the target style (`.txt`, `.md` files)
2. Enter the path to that folder in "Style Corpus Directory"
3. Optionally add custom instructions
4. Paste or upload the text you want to rewrite
5. Click "Rewrite Text"

The AI will analyze the writing style from your examples and apply it to your text.

## Example Use Cases

### Academic to Casual
- **Corpus**: Folder with casual blog posts
- **Prompt**: "Rewrite in a conversational tone"
- **Input**: Technical academic paper

### Simplification
- **Corpus**: None
- **Prompt**: "Rewrite at a 5th grade reading level"
- **Input**: Complex legal document

### Author Style Emulation
- **Corpus**: Folder with specific author's works
- **Prompt**: "Match the writing style"
- **Input**: Your draft paragraph

### Professional Polish
- **Corpus**: Folder with professional business communications
- **Prompt**: "Make more professional and concise"
- **Input**: Rough draft email

## Configuration

### Changing the Default Model

Edit `app.py` line 14:
```python
DEFAULT_MODEL = "llama3.2"  # Change to your preferred model
```

Or select a different model from the dropdown in the UI.

### Changing the Port

Edit `launcher.py` or `app.py` to change from port 5000:
```python
app.run(host='0.0.0.0', port=5000, debug=False)  # Change 5000 to desired port
```

## Troubleshooting

### "Ollama is not running"
- Start Ollama: `ollama serve`
- Or launch the Ollama desktop application

### "No models available"
- Pull a model: `ollama pull llama3.2`
- Check available models: `ollama list`

### "Cannot connect to server"
- Ensure port 5000 is not in use by another application
- Check firewall settings

### "No valid text files found in corpus directory"
- Ensure the directory contains `.txt`, `.md`, or `.text` files
- Check file permissions
- Verify the path is correct

## Project Structure

```
rewriter/
├── app.py                  # Flask backend
├── launcher.py             # Auto-launcher script
├── launcher.bat            # Windows launcher
├── launcher.sh             # Unix/Linux/Mac launcher
├── requirements.txt        # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css      # UI styling
│   └── js/
│       └── app.js         # Frontend logic
├── templates/
│   └── index.html         # Main UI page
└── README.md              # This file
```

## API Reference

### POST /api/rewrite

Rewrite text with optional style corpus.

**Request:**
```json
{
  "text": "Text to rewrite",
  "prompt": "Custom instructions (optional)",
  "corpus_path": "/path/to/corpus (optional)",
  "model": "llama3.2"
}
```

**Response:**
```json
{
  "rewritten_text": "The rewritten text",
  "corpus_files_used": 5
}
```

### GET /api/models

Get list of available Ollama models.

**Response:**
```json
{
  "models": ["llama3.2", "mistral", ...]
}
```

### GET /api/check-ollama

Check if Ollama is available.

**Response:**
```json
{
  "available": true
}
```

## Advanced Usage

### Running Without Auto-Launch

```bash
# Install dependencies
pip install -r requirements.txt

# Start server only
python app.py

# Then manually navigate to http://localhost:5000
```

### Custom Prompt Engineering

The application uses few-shot learning when a corpus is provided. For best results:
- Provide 3-5 high-quality examples in your corpus
- Ensure examples are similar in length to your target text
- Use consistent formatting in corpus files

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Verify Ollama is properly installed and running
3. Ensure you have sufficient GPU/CPU resources for your chosen model

## Tips for Best Results

- **Model selection**: Larger models (7B+) generally produce better results
- **Corpus size**: 3-5 well-chosen examples are often better than many poor examples
- **Clear prompts**: Be specific about what you want changed
- **Iterative refinement**: Try different prompts if the first result isn't perfect
- **Temperature**: The default temperature (0.7) balances creativity and consistency

Enjoy rewriting! 🎉
