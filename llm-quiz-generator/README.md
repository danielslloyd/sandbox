# 🎓 LLM Quiz Generator

A powerful web application that uses multiple Large Language Models (LLMs) to generate high-quality quiz content for educational purposes. Select from cloud models like GPT-4, Claude, Gemini, or run models locally with Ollama to create both correct answers and plausible distractors for multiple-choice quizzes.

## ✨ Features

- **Multi-Model Support**:
  - **Cloud Models**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Google (Gemini)
  - **Local Models**: Run Llama 3.1, Mistral, Qwen, Gemma, Phi-3 locally with Ollama (FREE!)
- **Intelligent Content Generation**:
  - Generates factually accurate, educational answers
  - Creates plausible but incorrect "distractor" answers
  - Optimized prompts for best results from each model
- **Beautiful UI**: Clean, modern interface with tabs for cloud/local models
- **Parallel Processing**: Query multiple models simultaneously
- **Easy Export**: Copy all results to clipboard for use in your quizzes
- **Privacy Option**: Use local models for 100% private, offline quiz generation
- **History Focus**: Optimized for historical persons and events (extensible to other subjects)

## 🚀 Quick Start - Fully Automated!

### One-Step Startup

**macOS / Linux:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

That's it! The script automatically:
- ✅ Checks Node.js
- ✅ Installs dependencies
- ✅ Creates .env file
- ✅ Starts Ollama (if installed)
- ✅ Opens browser
- ✅ Auto-detects installed models
- ✅ Shows install buttons for missing models

### Prerequisites

- Node.js (v14 or higher) - [Install here](https://nodejs.org/)
- **Option A - Cloud Models** (requires API keys):
  - [OpenAI API Key](https://platform.openai.com/api-keys) (~$0.01-0.05 per generation)
  - [Anthropic API Key](https://console.anthropic.com/) (~$0.01-0.03 per generation)
  - [Google AI API Key](https://makersuite.google.com/app/apikey) (often free tier)
- **Option B - Local Models** (FREE, requires GPU):
  - Install [Ollama](https://ollama.com/download) for local LLM inference
  - 16GB VRAM recommended (8GB minimum)
  - See [Local Models Guide](docs/LOCAL_MODELS_GUIDE.md) for full setup

### First Time Setup

1. **Run the startup script**
   ```bash
   ./start.sh        # macOS/Linux
   # or
   start.bat         # Windows
   ```

2. **For Cloud Models** (optional): Add API keys to `.env`

3. **For Local Models** (optional): Click "📥 Install" in the UI or:
   ```bash
   ollama pull llama3.1:8b-instruct-q4_K_M
   ```

**See [QUICK_START.md](QUICK_START.md) for detailed instructions.**

## 📖 Usage

1. **Enter a Topic**: Type a historical person or event (e.g., "Abraham Lincoln", "The French Revolution")

2. **Select Models**:
   - Click "☁️ Cloud Models" tab for API-based models (GPT-4, Claude, Gemini)
   - Click "🖥️ Local Models" tab for Ollama models (free, private, offline)

3. **Configure**: Select how many wrong answers (distractors) you want (3-5 recommended)

4. **Generate**: Click "Generate Quiz Content" and wait for results

5. **Review**: Compare the outputs from different models side-by-side

6. **Export**: Copy all results to clipboard for use in your quiz platform

## 🖥️ Using Local Models (Ollama)

**Why use local models?**
- ✅ **FREE** - No API costs
- ✅ **Private** - Your data never leaves your machine
- ✅ **Offline** - Works without internet
- ✅ **Fast** - With a good GPU, comparable to cloud APIs

**Quick Setup:**
```bash
# 1. Install Ollama (macOS/Linux/Windows)
# Download from: https://ollama.com/download

# 2. Start Ollama
ollama serve

# 3. Download recommended models
ollama pull llama3.1:8b-instruct-q4_K_M      # Fast, excellent quality
ollama pull qwen2.5:14b-instruct-q4_K_M      # Best for factual content
ollama pull mistral:7b-instruct-v0.2-q4_K_M  # Great reasoning

# 4. Start the quiz generator
npm start

# 5. Select "🖥️ Local Models" tab in the UI
```

**📚 For detailed local model setup with 16GB VRAM recommendations, see [Local Models Guide](docs/LOCAL_MODELS_GUIDE.md)**

## 🏗️ Project Structure

```
llm-quiz-generator/
├── public/                       # Frontend files
│   ├── index.html               # Main UI with cloud/local tabs
│   ├── styles.css               # Styling
│   └── app.js                   # Frontend logic
├── services/                    # Backend services
│   ├── llmService.js            # LLM provider integrations (cloud + Ollama)
│   └── prompts.js               # Optimized prompts
├── docs/                        # Documentation
│   └── LOCAL_MODELS_GUIDE.md    # Complete local models setup guide
├── examples/                    # Examples and samples
│   └── sample-topics.md         # 100+ test topics
├── server.js                    # Express server
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── README.md                    # This file
└── SETUP_GUIDE.md               # Detailed setup instructions
```

## 🎯 How It Works

### Prompt Engineering

The application uses carefully crafted prompts to ensure high-quality output:

1. **Role Setting**: Establishes the AI as an expert educator
2. **Clear Instructions**: Specifies exactly what's needed
3. **Quality Criteria**: Defines what makes good/bad answers
4. **Format Specification**: Requests structured JSON output
5. **Educational Focus**: Emphasizes learning value over trivia

### Distractor Generation

Distractors (wrong answers) are designed to:
- Sound plausible to someone with partial knowledge
- Test different aspects of understanding
- Avoid being obviously wrong or silly
- Mix different types of common misconceptions

### Multi-Model Orchestration

The backend:
1. Accepts a topic and selected models
2. Sends parallel requests to each LLM API
3. Applies provider-specific formatting
4. Parses and validates responses
5. Returns unified results to frontend

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | For GPT models |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Claude models |
| `GOOGLE_API_KEY` | Google AI API key | For Gemini models |
| `PORT` | Server port (default: 3000) | No |

### Supported Models

**Cloud Models:**

**OpenAI:**
- `gpt-4` - Most capable, best accuracy
- `gpt-3.5-turbo` - Faster, more economical

**Anthropic:**
- `claude-3-5-sonnet-20241022` - Balanced performance
- `claude-3-haiku-20240307` - Fast and efficient

**Google:**
- `gemini-pro` - Strong factual accuracy

**Local Models (Ollama):**

**Llama (Meta):**
- `llama3.1:8b-instruct-q4_K_M` - Excellent quality, fast (Recommended)

**Mistral:**
- `mistral:7b-instruct-v0.2-q4_K_M` - Great reasoning and instruction following

**Qwen (Alibaba):**
- `qwen2.5:14b-instruct-q4_K_M` - Exceptional for factual/historical content (Recommended)

**Gemma (Google):**
- `gemma2:9b-instruct-q4_K_M` - Good balanced performance

**Phi (Microsoft):**
- `phi3:14b-medium-4k-instruct-q4_K_M` - Efficient high-quality output

**Neural Chat (Intel):**
- `neural-chat:7b-v3.3-q4_K_M` - Good for educational content

All local models use Q4_K_M quantization for optimal quality/size balance on 16GB VRAM.

## 💡 Tips for Best Results

1. **Be Specific**: "Marie Curie's work on radioactivity" works better than just "Marie Curie"
2. **Compare Models**: Different models excel at different aspects
3. **Check Facts**: Always verify generated content for accuracy
4. **Iterate**: Regenerate if results aren't satisfactory
5. **Mix Models**: Use multiple models to get diverse perspectives

## 🎨 Customization

### Adding New Subjects

Edit `services/prompts.js` to add templates for science, literature, etc.:

```javascript
science: (topic, numDistractors) => {
    return `You are creating quiz content for science education...`;
}
```

### Adjusting Model Parameters

Edit `services/llmService.js` to tune:
- `temperature` (creativity vs. consistency)
- `max_tokens` (response length)
- Other model-specific parameters

### Styling

Customize the look in `public/styles.css`. The design uses CSS variables for easy theming:

```css
:root {
    --primary-color: #4f46e5;
    --success-color: #10b981;
    /* etc. */
}
```

## 📊 API Endpoints

### `POST /api/generate`

Generate quiz content.

**Request:**
```json
{
  "topic": "Abraham Lincoln",
  "models": [
    {"model": "gpt-4", "provider": "openai"},
    {"model": "claude-3-5-sonnet-20241022", "provider": "anthropic"}
  ],
  "numDistractors": 3
}
```

**Response:**
```json
{
  "topic": "Abraham Lincoln",
  "results": [
    {
      "model": "gpt-4",
      "provider": "openai",
      "correctAnswer": "Abraham Lincoln (1809-1865) was the 16th President...",
      "distractors": [
        "Wrong but plausible answer 1",
        "Wrong but plausible answer 2",
        "Wrong but plausible answer 3"
      ],
      "generationTime": 1543
    }
  ]
}
```

### `GET /api/health`

Check server status.

### `GET /api/keys-status`

Check which API keys are configured (returns boolean, not actual keys).

## 🚨 Troubleshooting

### "API key not configured"
- Ensure `.env` file exists and contains valid API keys
- Restart the server after adding keys

### "Failed to parse response"
- Some models may return non-JSON text
- The app includes fallback parsing logic
- Try regenerating or using a different model

### CORS errors
- Make sure the server is running on port 3000
- Check that frontend is accessing the correct API URL

### Rate limits
- Most providers have rate limits on free tiers
- Consider upgrading your API plan
- Space out requests or use fewer models

## 💰 Cost Considerations

API calls to LLMs cost money. Approximate costs per request:

- **GPT-4**: ~$0.01-0.05 per generation
- **GPT-3.5**: ~$0.001-0.005 per generation
- **Claude**: ~$0.01-0.03 per generation
- **Gemini**: Often free tier available

Generate wisely and monitor your usage on provider dashboards.

## 🔐 Security Notes

- Never commit `.env` file to version control
- Keep API keys secure and rotate them regularly
- Consider rate limiting if exposing publicly
- Validate all user inputs
- Don't share generated content without fact-checking

## 🤝 Contributing

Ideas for improvements:
- Add more LLM providers (Cohere, Together AI, etc.)
- Support more subjects beyond history
- Add quality scoring for generated content
- Implement caching to reduce API costs
- Add user authentication
- Create a database to save generated quizzes

## 📄 License

MIT License - feel free to use this for educational purposes!

## 🙏 Acknowledgments

- Built with Express.js and vanilla JavaScript
- Uses OpenAI, Anthropic, and Google APIs
- Inspired by the need for better educational content generation

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API provider documentation
3. Ensure all dependencies are installed
4. Verify API keys are valid and have credits

---

**Happy Quiz Creating!** 🎉
