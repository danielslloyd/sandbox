# 🎓 LLM Quiz Generator

A powerful web application that uses multiple Large Language Models (LLMs) to generate high-quality quiz content for educational purposes. Select from GPT-4, Claude, Gemini, and more to create both correct answers and plausible distractors for multiple-choice quizzes.

## ✨ Features

- **Multi-Model Support**: Compare outputs from OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), and Google (Gemini)
- **Intelligent Content Generation**:
  - Generates factually accurate, educational answers
  - Creates plausible but incorrect "distractor" answers
  - Optimized prompts for best results from each model
- **Beautiful UI**: Clean, modern interface with real-time feedback
- **Parallel Processing**: Query multiple models simultaneously
- **Easy Export**: Copy all results to clipboard for use in your quizzes
- **History Focus**: Optimized for historical persons and events (extensible to other subjects)

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- API keys for the LLM providers you want to use:
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Anthropic API Key](https://console.anthropic.com/)
  - [Google AI API Key](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone or download this project**
   ```bash
   cd llm-quiz-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage

1. **Enter a Topic**: Type a historical person or event (e.g., "Abraham Lincoln", "The French Revolution")

2. **Select Models**: Choose one or more AI models to compare outputs

3. **Configure**: Select how many wrong answers (distractors) you want (3-5 recommended)

4. **Generate**: Click "Generate Quiz Content" and wait for results

5. **Review**: Compare the outputs from different models side-by-side

6. **Export**: Copy all results to clipboard for use in your quiz platform

## 🏗️ Project Structure

```
llm-quiz-generator/
├── public/                 # Frontend files
│   ├── index.html         # Main UI
│   ├── styles.css         # Styling
│   └── app.js             # Frontend logic
├── services/              # Backend services
│   ├── llmService.js      # LLM provider integrations
│   └── prompts.js         # Optimized prompts
├── server.js              # Express server
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md             # Documentation
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

**OpenAI:**
- `gpt-4` - Most capable, best accuracy
- `gpt-3.5-turbo` - Faster, more economical

**Anthropic:**
- `claude-3-5-sonnet-20241022` - Balanced performance
- `claude-3-haiku-20240307` - Fast and efficient

**Google:**
- `gemini-pro` - Strong factual accuracy

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
