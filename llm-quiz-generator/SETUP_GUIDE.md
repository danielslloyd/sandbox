# 🛠️ Detailed Setup Guide

This guide will walk you through setting up the LLM Quiz Generator step-by-step.

## Step 1: Prerequisites

### Install Node.js

**Check if you have Node.js:**
```bash
node --version
```

If you see a version number (v14+), you're good! Otherwise:

- **macOS**: `brew install node`
- **Windows**: Download from [nodejs.org](https://nodejs.org/)
- **Linux**: `sudo apt install nodejs npm` (Ubuntu/Debian)

### Get API Keys

You'll need at least one API key to use the application.

#### OpenAI (GPT-4, GPT-3.5)

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add billing information (pay-as-you-go)

**Cost**: ~$0.01-0.05 per quiz generation with GPT-4

#### Anthropic (Claude)

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-`)
6. Add credits to your account

**Cost**: ~$0.01-0.03 per quiz generation

#### Google (Gemini)

1. Go to [makersuite.google.com](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create API key
4. Copy the key
5. Free tier available!

**Cost**: Often free for moderate usage

## Step 2: Project Setup

### Download the Project

If you received this as a zip file:
```bash
unzip llm-quiz-generator.zip
cd llm-quiz-generator
```

If from git:
```bash
git clone <repository-url>
cd llm-quiz-generator
```

### Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `axios` - HTTP client

**Troubleshooting npm install:**
- If you get permission errors: `sudo npm install` (not recommended) or fix npm permissions
- If packages fail: Try `npm cache clean --force` then retry
- If still failing: Delete `node_modules` and `package-lock.json`, then retry

## Step 3: Configure Environment

### Create .env File

```bash
cp .env.example .env
```

### Add Your API Keys

Open `.env` in your text editor:

```bash
# On macOS/Linux
nano .env

# Or use any text editor
code .env  # VS Code
```

Add your keys:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
GOOGLE_API_KEY=xxxxxxxxxxxxx

PORT=3000
```

**Important:**
- Don't share these keys
- Don't commit `.env` to git
- Keep them secret and secure

### Verify Configuration

```bash
cat .env
```

Make sure:
- No extra spaces around `=`
- Keys are complete
- No quote marks around keys

## Step 4: Start the Application

### Start the Server

```bash
npm start
```

You should see:
```
🚀 LLM Quiz Generator Server Running
📍 Server: http://localhost:3000
🔧 API: http://localhost:3000/api

🔑 API Keys Status:
   OpenAI: ✓
   Anthropic: ✓
   Google: ✓
```

**Troubleshooting:**
- **Port already in use**: Change `PORT=3001` in `.env`
- **API key shows ✗**: Double-check the key in `.env`
- **Module not found**: Run `npm install` again

### For Development (Auto-restart)

```bash
npm run dev
```

This uses `nodemon` to auto-restart on file changes.

## Step 5: Use the Application

### Open in Browser

Navigate to: `http://localhost:3000`

### First Test

1. Enter: "Abraham Lincoln"
2. Select: GPT-4 (or any available model)
3. Click: "Generate Quiz Content"
4. Wait: 2-5 seconds
5. Review: The generated content

### Example Output

**Correct Answer:**
> Abraham Lincoln (1809-1865) was the 16th President of the United States, serving from 1861 until his assassination in 1865. He led the nation through the American Civil War, preserved the Union, and issued the Emancipation Proclamation, which began the process of freedom for America's enslaved people.

**Distractors:**
1. Abraham Lincoln (1809-1865) was the 15th President...
2. Abraham Lincoln served as President from 1857-1864...
3. Lincoln was a Southern plantation owner who opposed...

## Step 6: Advanced Usage

### Compare Multiple Models

Select 2-3 models to see different approaches:
- **GPT-4**: Often most comprehensive
- **Claude**: Strong on nuance and accuracy
- **GPT-3.5**: Faster, more economical

### Optimize Distractor Count

- **3 distractors**: Standard multiple choice (4 total options)
- **4 distractors**: Harder quiz (5 total options)
- **5 distractors**: Expert-level difficulty

### Export Results

Click "Copy All Results" to get formatted text:
```
Quiz Content for: Abraham Lincoln
Generated: 1/15/2024, 2:30:45 PM
============================================================

Model: GPT-4 (openai)
------------------------------------------------------------
...
```

Paste into your quiz creation software!

## Common Issues and Solutions

### Issue: "API key not configured"

**Solution:**
1. Check `.env` file exists
2. Verify key is correct
3. Restart server: Stop (Ctrl+C) and run `npm start` again

### Issue: "Failed to parse response"

**Solution:**
1. Try regenerating
2. Try a different model
3. Check API provider status
4. Verify you have credits/quota

### Issue: "Rate limit exceeded"

**Solution:**
1. Wait a few minutes
2. Upgrade API plan
3. Use fewer models simultaneously
4. Check your provider dashboard

### Issue: "Network error"

**Solution:**
1. Check internet connection
2. Verify API keys are valid
3. Check if API provider is having issues
4. Try a different model/provider

### Issue: Port 3000 already in use

**Solution:**
```bash
# Option 1: Change port
echo "PORT=3001" >> .env
npm start

# Option 2: Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Testing the Setup

### Test 1: Server Health

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Test 2: API Keys Status

```bash
curl http://localhost:3000/api/keys-status
```

Expected: `{"openai":true,"anthropic":true,"google":true}`

### Test 3: Generate Content

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "George Washington",
    "models": [{"model": "gpt-3.5-turbo", "provider": "openai"}],
    "numDistractors": 3
  }'
```

Expected: JSON response with correct answer and distractors

## Next Steps

### 1. Customize for Your Needs

- Edit `services/prompts.js` for different subjects
- Adjust `public/styles.css` for your branding
- Modify `public/index.html` for additional features

### 2. Monitor Usage and Costs

- Check OpenAI dashboard: [platform.openai.com/usage](https://platform.openai.com/usage)
- Check Anthropic console: [console.anthropic.com](https://console.anthropic.com/)
- Check Google AI Studio: [makersuite.google.com](https://makersuite.google.com/)

### 3. Optimize Costs

- Use GPT-3.5 instead of GPT-4 for most queries
- Cache results for common topics
- Use Haiku for bulk generation
- Take advantage of free tiers

### 4. Expand Functionality

Ideas:
- Add database to save generated quizzes
- Implement user authentication
- Add more subjects (science, literature, etc.)
- Create quiz export formats (Moodle, Canvas, etc.)
- Add image generation for visual questions

## Getting Help

### Debug Mode

Add this to your `.env`:
```env
NODE_ENV=development
DEBUG=true
```

This enables verbose logging.

### Check Logs

The server logs all requests and errors. Watch the terminal where you ran `npm start`.

### API Provider Support

- **OpenAI**: [help.openai.com](https://help.openai.com/)
- **Anthropic**: [support.anthropic.com](https://support.anthropic.com/)
- **Google**: [ai.google.dev/docs](https://ai.google.dev/docs)

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Uninstalling

```bash
cd ..
rm -rf llm-quiz-generator
```

---

**You're all set!** Start generating high-quality quiz content! 🎓✨
