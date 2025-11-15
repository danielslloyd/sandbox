# 🖥️ Running LLMs Locally with 16GB VRAM

This guide will help you run open-source LLMs locally on your GPU for the quiz generator.

## 🎯 Best Models for 16GB VRAM

With 16GB VRAM, you can run several excellent open-source models. Here are the top recommendations:

### Tier 1: Best Overall (Recommended)

**1. Llama 3.1 8B Instruct**
- **Size**: ~5GB (quantized)
- **Quality**: Excellent, comparable to GPT-3.5
- **Speed**: Very fast on 16GB GPU
- **Best for**: General knowledge, history, factual content
- **Provider**: Meta (Facebook)
- **License**: Free for commercial use

**2. Mistral 7B Instruct v0.2**
- **Size**: ~4.4GB (quantized)
- **Quality**: Excellent reasoning and instruction following
- **Speed**: Very fast
- **Best for**: Detailed explanations, nuanced content
- **Provider**: Mistral AI
- **License**: Apache 2.0 (fully open)

**3. Qwen 2.5 14B Instruct**
- **Size**: ~8.5GB (quantized)
- **Quality**: Exceptional for factual tasks
- **Speed**: Fast on 16GB
- **Best for**: Historical accuracy, detailed knowledge
- **Provider**: Alibaba Cloud
- **License**: Apache 2.0

### Tier 2: Specialized Options

**4. Gemma 2 9B Instruct**
- **Size**: ~5.5GB (quantized)
- **Quality**: Very good, Google-trained
- **Speed**: Fast
- **Best for**: Balanced performance
- **Provider**: Google
- **License**: Gemma Terms of Use (permissive)

**5. Phi-3 Medium 14B**
- **Size**: ~8GB (quantized)
- **Quality**: Excellent for size
- **Speed**: Fast
- **Best for**: Efficient high-quality output
- **Provider**: Microsoft
- **License**: MIT

**6. Neural Chat 7B**
- **Size**: ~4.1GB (quantized)
- **Quality**: Good for educational content
- **Speed**: Very fast
- **Best for**: Conversational, helpful responses
- **Provider**: Intel
- **License**: Apache 2.0

### Tier 3: Experimental/Advanced

**7. Mixtral 8x7B Instruct**
- **Size**: ~26GB full, ~13GB quantized (Q4)
- **Quality**: Excellent (near GPT-3.5 level)
- **Speed**: Slower but powerful
- **Best for**: When you need maximum quality
- **Note**: Tight fit on 16GB, requires aggressive quantization

## 🚀 Easiest Setup: Ollama (Recommended)

**Ollama** is the simplest way to run local models. It's like Docker for LLMs.

### Installation

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com](https://ollama.com/download)

### Starting Ollama

```bash
# Start the Ollama service
ollama serve
```

This runs on `http://localhost:11434` by default.

### Downloading Models

```bash
# Install recommended models
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull mistral:7b-instruct-v0.2-q4_K_M
ollama pull qwen2.5:14b-instruct-q4_K_M
ollama pull gemma2:9b-instruct-q4_K_M
ollama pull phi3:14b-medium-4k-instruct-q4_K_M

# List installed models
ollama list

# Test a model
ollama run llama3.1:8b-instruct-q4_K_M
```

### Quantization Levels Explained

Models come in different quantization levels (compression):

- **Q8**: Highest quality, ~8GB for 7B model
- **Q6_K**: Very good quality, ~6GB for 7B model
- **Q5_K_M**: Good balance, ~5GB for 7B model
- **Q4_K_M**: **Recommended**, ~4GB for 7B model
- **Q3_K_M**: Lower quality, ~3GB for 7B model
- **Q2_K**: Lowest quality, not recommended

**For 16GB VRAM, use Q4_K_M or Q5_K_M quantization.**

## 🔧 Alternative: LM Studio

**LM Studio** provides a GUI interface for local models.

### Installation

1. Download from [lmstudio.ai](https://lmstudio.ai/)
2. Install the application
3. Browse and download models from the UI
4. Start local server (compatible with OpenAI API)

### Recommended Models in LM Studio

Search for:
- `meta-llama-3.1-8b-instruct-GGUF`
- `mistral-7b-instruct-v0.2-GGUF`
- `qwen2.5-14b-instruct-GGUF`

Look for files ending in `Q4_K_M.gguf` or `Q5_K_M.gguf`.

## 🎓 Alternative: llama.cpp (Advanced)

For more control, use **llama.cpp** directly.

### Installation

```bash
# Clone repository
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build with CUDA support (NVIDIA GPU)
make LLAMA_CUBLAS=1

# Or with ROCm (AMD GPU)
make LLAMA_HIPBLAS=1
```

### Download Models from Hugging Face

Models in GGUF format (compatible with llama.cpp):

```bash
# Install huggingface-cli
pip install huggingface-hub

# Download Llama 3.1 8B
huggingface-cli download \
  bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \
  Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
  --local-dir ./models

# Download Mistral 7B
huggingface-cli download \
  TheBloke/Mistral-7B-Instruct-v0.2-GGUF \
  mistral-7b-instruct-v0.2.Q4_K_M.gguf \
  --local-dir ./models

# Download Qwen 2.5 14B
huggingface-cli download \
  Qwen/Qwen2.5-14B-Instruct-GGUF \
  qwen2.5-14b-instruct-q4_k_m.gguf \
  --local-dir ./models
```

### Running Models

```bash
# Run llama.cpp server
./server \
  -m ./models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
  -c 4096 \
  -ngl 35 \
  --port 8080
```

Parameters:
- `-m`: Model file path
- `-c`: Context length (4096 tokens)
- `-ngl`: GPU layers (35 = all on GPU for 8B model)
- `--port`: Server port

## 🌐 Where to Find Models

### Hugging Face (Primary Source)

**Official Model Pages:**
1. **Llama 3.1**: [meta-llama/Meta-Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct)
2. **Mistral**: [mistralai/Mistral-7B-Instruct-v0.2](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)
3. **Qwen**: [Qwen/Qwen2.5-14B-Instruct](https://huggingface.co/Qwen/Qwen2.5-14B-Instruct)
4. **Gemma**: [google/gemma-2-9b-it](https://huggingface.co/google/gemma-2-9b-it)
5. **Phi-3**: [microsoft/Phi-3-medium-4k-instruct](https://huggingface.co/microsoft/Phi-3-medium-4k-instruct)

**Quantized GGUF Versions (Ready to Use):**
- Search Hugging Face for model name + "GGUF"
- Look for creators: `TheBloke`, `bartowski`, `QuantFactory`
- Example: [bartowski/Meta-Llama-3.1-8B-Instruct-GGUF](https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF)

### Ollama Library

Browse models at [ollama.com/library](https://ollama.com/library)

Search for:
- `llama3.1`
- `mistral`
- `qwen2.5`
- `gemma2`
- `phi3`

## 🎯 My Recommendations for Quiz Generation

**Best Single Model (Quality + Speed):**
```bash
ollama pull qwen2.5:14b-instruct-q4_K_M
```
Qwen excels at factual, accurate historical content.

**Best Speed (Good Quality):**
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
```
Very fast, excellent general knowledge.

**Best Value Pack (Try All):**
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull mistral:7b-instruct-v0.2-q4_K_M
ollama pull qwen2.5:14b-instruct-q4_K_M
```
Compare outputs just like with cloud APIs!

## 💾 Storage Requirements

- **8B models (Q4)**: ~4-5GB each
- **14B models (Q4)**: ~8-9GB each
- **Total for 3 models**: ~20GB disk space

Plan for 50-100GB if you want to try many models.

## ⚡ Performance Expectations

**Generation Speed (16GB VRAM):**
- **8B models**: 40-80 tokens/second
- **14B models**: 20-40 tokens/second

**Quiz generation time:**
- Cloud APIs: 2-5 seconds
- Local 8B: 3-7 seconds
- Local 14B: 5-10 seconds

## 🔍 Testing Your Setup

Once Ollama is running:

```bash
# Test if server is running
curl http://localhost:11434/api/tags

# Test generation
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b-instruct-q4_K_M",
  "prompt": "Who was Abraham Lincoln?",
  "stream": false
}'
```

## 🐛 Troubleshooting

### CUDA Out of Memory
- Use more aggressive quantization (Q4 instead of Q5)
- Try smaller models (7B instead of 14B)
- Close other GPU applications
- Reduce context length: `-c 2048`

### Model Not Found
```bash
ollama list  # Check installed models
ollama pull model-name  # Download if missing
```

### Slow Generation
- Ensure all layers are on GPU (`-ngl 35` or higher)
- Check GPU usage: `nvidia-smi`
- Try smaller model

### Connection Refused
```bash
# Make sure Ollama is running
ollama serve

# Or check if port 11434 is in use
lsof -i :11434
```

## 🆚 Local vs Cloud Comparison

| Aspect | Local (Ollama) | Cloud (OpenAI/Anthropic) |
|--------|----------------|--------------------------|
| **Cost** | Free (one-time GPU cost) | Pay per token (~$0.01-0.05/quiz) |
| **Speed** | Fast (3-10s) | Very fast (2-5s) |
| **Quality** | Very good | Excellent |
| **Privacy** | 100% private | Data sent to provider |
| **Setup** | 30 min setup | 5 min setup |
| **Scaling** | Limited by GPU | Unlimited |

**When to use local:**
- Privacy concerns
- High volume usage
- Offline operation needed
- Learning/experimentation

**When to use cloud:**
- Need absolute best quality
- Occasional use
- Don't have GPU
- Want latest models

## 🎓 Next Steps

1. **Install Ollama** (easiest option)
2. **Download 2-3 recommended models**
3. **Test them** with sample prompts
4. **Integrate with quiz generator** (I'll update the code next!)
5. **Compare** local vs cloud results

Ready to integrate these local models into your quiz generator! 🚀
