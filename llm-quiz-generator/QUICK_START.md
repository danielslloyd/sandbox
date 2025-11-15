# 🚀 Quick Start Guide - Single-Step Startup

This project is now **fully automated**! Just run one command and everything starts automatically.

## One-Step Startup

### macOS / Linux

```bash
./start.sh
```

### Windows

```cmd
start.bat
```

That's it! The script will:
1. ✅ Check Node.js installation
2. ✅ Install dependencies (if needed)
3. ✅ Create .env file (if needed)
4. ✅ Check and start Ollama (if installed)
5. ✅ Start the quiz generator server
6. ✅ Open your browser automatically

## What Happens Automatically

### Auto-Detection

When you open the app, it automatically:
- **Detects** if Ollama is running
- **Scans** for installed local models
- **Shows** only models you have installed
- **Displays** install buttons for models you don't have

### Smart Model Management

**Installed Models:**
- Show with a ✓ Installed badge
- Ready to select and use immediately
- No manual configuration needed

**Not Installed Models:**
- Show with a 📥 Install button
- Click to download directly from the UI
- Real-time download progress
- Auto-refresh when complete

## First Time Setup

### For Cloud Models (OpenAI, Anthropic, Google)

1. Open `.env` file
2. Add your API keys:
   ```env
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=...
   ```
3. Restart the server

### For Local Models (Ollama)

**Option 1: Use the UI (Easiest)**
1. The startup script already started Ollama
2. Click "🖥️ Local Models" tab
3. Click "📥 Install" on any model
4. Wait for download to complete
5. Use the model!

**Option 2: Command Line**
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull qwen2.5:14b-instruct-q4_K_M
```

## Daily Usage

Every time you want to use the quiz generator:

```bash
./start.sh        # macOS/Linux
# or
start.bat         # Windows
```

The script handles everything automatically!

## Troubleshooting

### "Ollama not running"

**Solution:** The startup script should auto-start Ollama, but if it fails:
```bash
ollama serve
```
Then refresh the page.

### "No models installed"

**Solution:** Click the "📥 Install" button next to any model in the UI, or:
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
```

### "Node.js not found"

**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

### Port 3000 already in use

**Solution:** Edit `.env` and change the port:
```env
PORT=3001
```

## Recommended First Models

When you first start, we recommend installing these two:

1. **Llama 3.1 8B** (~5GB)
   - Fast and high quality
   - Great for quick generations

2. **Qwen 2.5 14B** (~8.5GB)
   - Best for historical accuracy
   - Excellent for factual content

Both can run simultaneously on 16GB VRAM.

## What's Automated?

| Feature | Automated? |
|---------|-----------|
| Check Node.js | ✅ Yes |
| Install npm packages | ✅ Yes |
| Create .env file | ✅ Yes |
| Start Ollama | ✅ Yes |
| Detect installed models | ✅ Yes |
| Show only available models | ✅ Yes |
| Download models from UI | ✅ Yes |
| Open browser | ✅ Yes |
| Monitor download progress | ✅ Yes |
| Auto-refresh after install | ✅ Yes |

## Comparison: Before vs After

### Before (Manual)
```bash
# Terminal 1
ollama serve

# Terminal 2
cd llm-quiz-generator
npm install
cp .env.example .env
# Edit .env...
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull qwen2.5:14b-instruct-q4_K_M
npm start

# Browser
# Open http://localhost:3000 manually
# Remember which models you have installed
```

### After (Automated)
```bash
./start.sh
# Everything happens automatically!
# Browser opens automatically
# Models auto-detected
# Install missing models from UI
```

## Next Steps

1. ✅ Run `./start.sh`
2. ✅ Browser opens automatically
3. ✅ Click "🖥️ Local Models" tab
4. ✅ Install recommended models (if none installed)
5. ✅ Enter a historical topic
6. ✅ Select your models
7. ✅ Click "Generate Quiz Content"
8. 🎉 Done!

---

**Having issues?** Check the [troubleshooting section](README.md#-troubleshooting) in the main README.
