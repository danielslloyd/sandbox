#!/bin/bash

# LLM Quiz Generator - Auto Startup Script
# This script handles everything needed to run the quiz generator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🎓 LLM Quiz Generator - Auto Startup            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Ollama is running
ollama_is_running() {
    curl -s http://localhost:11434/api/tags >/dev/null 2>&1
}

# Step 1: Check Node.js
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"

# Step 2: Install dependencies if needed
echo -e "${YELLOW}[2/5] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Step 3: Check .env file
echo -e "${YELLOW}[3/5] Checking configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}   You can add API keys to .env for cloud models${NC}"
else
    echo -e "${GREEN}✓ Configuration file exists${NC}"
fi

# Step 4: Check and start Ollama
echo -e "${YELLOW}[4/5] Checking Ollama (local models)...${NC}"
if ! command_exists ollama; then
    echo -e "${YELLOW}⚠️  Ollama not installed (local models will not work)${NC}"
    echo "   To use local models, install from: https://ollama.com/download"
    echo "   (You can still use cloud models)"
else
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ Ollama ${OLLAMA_VERSION} found${NC}"

    if ollama_is_running; then
        echo -e "${GREEN}✓ Ollama is already running${NC}"
    else
        echo "Starting Ollama server..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - start as background service
            ollama serve >/dev/null 2>&1 &
        else
            # Linux - start in background
            nohup ollama serve >/dev/null 2>&1 &
        fi

        # Wait for Ollama to start
        echo -n "Waiting for Ollama to start"
        for i in {1..10}; do
            if ollama_is_running; then
                echo ""
                echo -e "${GREEN}✓ Ollama started successfully${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done

        if ! ollama_is_running; then
            echo ""
            echo -e "${YELLOW}⚠️  Could not auto-start Ollama${NC}"
            echo "   Run 'ollama serve' manually for local models"
        fi
    fi

    # Check for installed models
    if ollama_is_running; then
        MODEL_COUNT=$(ollama list 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
        if [ "$MODEL_COUNT" -gt "0" ]; then
            echo -e "${GREEN}✓ Found ${MODEL_COUNT} local model(s)${NC}"
        else
            echo -e "${YELLOW}⚠️  No local models installed yet${NC}"
            echo "   The app will help you download models from the UI"
        fi
    fi
fi

# Step 5: Start the server
echo -e "${YELLOW}[5/5] Starting Quiz Generator server...${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Server starting on http://localhost:3000${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Auto-open browser after a short delay
(sleep 2 && {
    if command_exists open; then
        open http://localhost:3000
    elif command_exists xdg-open; then
        xdg-open http://localhost:3000
    fi
} 2>/dev/null) &

# Start the Node.js server
npm start
