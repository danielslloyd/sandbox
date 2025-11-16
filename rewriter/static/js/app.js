// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const modelSelect = document.getElementById('model-select');
const corpusPath = document.getElementById('corpus-path');
const prompt = document.getElementById('prompt');
const originalText = document.getElementById('original-text');
const fileUpload = document.getElementById('file-upload');
const fileName = document.getElementById('file-name');
const rewriteBtn = document.getElementById('rewrite-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const resultSection = document.getElementById('result-section');
const resultText = document.getElementById('result-text');
const resultInfo = document.getElementById('result-info');
const errorSection = document.getElementById('error-section');
const errorText = document.getElementById('error-text');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkOllamaStatus();
    loadModels();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    rewriteBtn.addEventListener('click', handleRewrite);
    clearBtn.addEventListener('click', handleClear);
    copyBtn.addEventListener('click', handleCopy);
    fileUpload.addEventListener('change', handleFileUpload);
}

// Check Ollama Status
async function checkOllamaStatus() {
    try {
        const response = await fetch('/api/check-ollama');
        const data = await response.json();

        if (data.available) {
            statusIndicator.textContent = '● Ollama Connected';
            statusIndicator.className = 'status online';
        } else {
            statusIndicator.textContent = '● Ollama Offline';
            statusIndicator.className = 'status offline';
            showError('Ollama is not running. Please start Ollama and refresh the page.');
        }
    } catch (error) {
        statusIndicator.textContent = '● Connection Error';
        statusIndicator.className = 'status offline';
        showError('Cannot connect to server.');
    }
}

// Load Available Models
async function loadModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();

        if (data.models && data.models.length > 0) {
            modelSelect.innerHTML = '';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        originalText.value = e.target.result;
    };
    reader.onerror = () => {
        showError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
}

// Handle Rewrite
async function handleRewrite() {
    hideError();
    hideResult();

    const text = originalText.value.trim();
    if (!text) {
        showError('Please enter or upload text to rewrite.');
        return;
    }

    const requestData = {
        text: text,
        prompt: prompt.value.trim(),
        corpus_path: corpusPath.value.trim(),
        model: modelSelect.value
    };

    // Show loading state
    setLoading(true);

    try {
        const response = await fetch('/api/rewrite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.warning || 'Unknown error occurred');
        }

        // Show results
        resultText.textContent = data.rewritten_text;

        let info = '';
        if (data.corpus_files_used > 0) {
            info = `Style learned from ${data.corpus_files_used} example file(s)`;
        }
        resultInfo.textContent = info;

        showResult();

    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// Handle Clear
function handleClear() {
    corpusPath.value = '';
    prompt.value = '';
    originalText.value = '';
    fileUpload.value = '';
    fileName.textContent = '';
    hideResult();
    hideError();
}

// Handle Copy
async function handleCopy() {
    try {
        await navigator.clipboard.writeText(resultText.textContent);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = 'var(--success-color)';
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    } catch (error) {
        showError('Failed to copy text to clipboard.');
    }
}

// UI Helper Functions
function setLoading(isLoading) {
    const buttonText = rewriteBtn.querySelector('.button-text');
    const spinner = rewriteBtn.querySelector('.spinner');

    if (isLoading) {
        buttonText.textContent = 'Rewriting...';
        spinner.style.display = 'inline-block';
        rewriteBtn.disabled = true;
    } else {
        buttonText.textContent = 'Rewrite Text';
        spinner.style.display = 'none';
        rewriteBtn.disabled = false;
    }
}

function showResult() {
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResult() {
    resultSection.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    errorSection.style.display = 'none';
}
