// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const topicInput = document.getElementById('topic');
const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('results');
const errorSection = document.getElementById('errorSection');
const errorText = document.getElementById('errorText');
const exportBtn = document.getElementById('exportBtn');
const numDistractorsSelect = document.getElementById('numDistractors');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');

// State
let currentResults = [];
let installedModels = new Set();
let ollamaRunning = false;

// Recommended local models with metadata
const RECOMMENDED_MODELS = [
    {
        id: 'llama3.1:8b-instruct-q4_K_M',
        displayName: 'Llama 3.1 8B',
        description: 'Fast, excellent quality',
        size: '~5GB',
        recommended: true
    },
    {
        id: 'qwen2.5:14b-instruct-q4_K_M',
        displayName: 'Qwen 2.5 14B',
        description: 'Best for factual/historical content',
        size: '~8.5GB',
        recommended: true
    },
    {
        id: 'mistral:7b-instruct-v0.2-q4_K_M',
        displayName: 'Mistral 7B',
        description: 'Great reasoning',
        size: '~4.4GB',
        recommended: false
    },
    {
        id: 'gemma2:9b-instruct-q4_K_M',
        displayName: 'Gemma 2 9B',
        description: 'Good balanced performance',
        size: '~5.5GB',
        recommended: false
    },
    {
        id: 'phi3:14b-medium-4k-instruct-q4_K_M',
        displayName: 'Phi-3 Medium 14B',
        description: 'Efficient high-quality output',
        size: '~8GB',
        recommended: false
    },
    {
        id: 'neural-chat:7b-v3.3-q4_K_M',
        displayName: 'Neural Chat 7B',
        description: 'Good for educational content',
        size: '~4.1GB',
        recommended: false
    }
];

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
exportBtn.addEventListener('click', handleExport);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;

        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Show/hide model sections
        if (tab === 'cloud') {
            document.getElementById('cloudModels').style.display = 'grid';
            document.getElementById('localModels').style.display = 'none';
            document.getElementById('localHelp').style.display = 'none';
        } else {
            document.getElementById('cloudModels').style.display = 'none';
            document.getElementById('localModels').style.display = 'grid';
            document.getElementById('localHelp').style.display = 'block';
        }
    });
});

// Allow Enter key to trigger generation
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGenerate();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkOllamaStatus();
});

/**
 * Check Ollama status and load installed models
 */
async function checkOllamaStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/ollama/status`);
        const data = await response.json();

        ollamaRunning = data.running;

        if (ollamaRunning) {
            await loadInstalledModels();
        } else {
            showOllamaNotRunning();
        }
    } catch (error) {
        console.error('Error checking Ollama status:', error);
        showOllamaNotRunning();
    }
}

/**
 * Load installed Ollama models
 */
async function loadInstalledModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/ollama/models`);
        const data = await response.json();

        if (data.success) {
            // Store installed model names
            installedModels = new Set(data.models.map(m => m.name));

            // Populate the local models UI
            populateLocalModels();

            if (data.count > 0) {
                document.getElementById('ollamaStatusText').textContent =
                    `✓ Ollama running with ${data.count} model(s) installed`;
            } else {
                document.getElementById('ollamaStatusText').textContent =
                    `⚠️ Ollama running, but no models installed yet. Install models below.`;
            }
        } else {
            showOllamaNotRunning();
        }
    } catch (error) {
        console.error('Error loading models:', error);
        showOllamaNotRunning();
    }
}

/**
 * Populate local models section with recommended models
 */
function populateLocalModels() {
    const container = document.getElementById('localModels');
    container.innerHTML = '';

    RECOMMENDED_MODELS.forEach(model => {
        const isInstalled = installedModels.has(model.id);
        const card = createModelCard(model, isInstalled);
        container.appendChild(card);
    });
}

/**
 * Create a model card with install button if needed
 */
function createModelCard(model, isInstalled) {
    const card = document.createElement('div');
    card.className = 'model-card';

    if (isInstalled) {
        // Installed model - show checkbox
        card.innerHTML = `
            <label class="model-checkbox">
                <input type="checkbox" value="${model.id}" data-provider="ollama">
                <div class="model-info">
                    <span class="model-name">${model.displayName}</span>
                    <span class="model-description">${model.description}</span>
                </div>
                <span class="model-badge ollama">✓ Installed</span>
            </label>
        `;
    } else {
        // Not installed - show install button
        card.innerHTML = `
            <div class="model-card-not-installed">
                <div class="model-info">
                    <span class="model-name">${model.displayName}</span>
                    <span class="model-description">${model.description} • ${model.size}</span>
                </div>
                <button class="install-btn" data-model="${model.id}">
                    📥 Install
                </button>
            </div>
        `;

        // Add click handler for install button
        const installBtn = card.querySelector('.install-btn');
        installBtn.addEventListener('click', () => installModel(model.id, installBtn));
    }

    return card;
}

/**
 * Install a model
 */
async function installModel(modelId, button) {
    button.disabled = true;
    button.innerHTML = '⏳ Installing...';

    try {
        const response = await fetch(`${API_BASE_URL}/ollama/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model: modelId })
        });

        if (!response.ok) {
            throw new Error('Failed to start model download');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));

                        if (data.status === 'complete') {
                            button.innerHTML = '✓ Installed';

                            // Refresh the models list
                            setTimeout(() => {
                                loadInstalledModels();
                            }, 1000);
                            return;
                        } else if (data.status === 'downloading' && data.completed && data.total) {
                            const percent = Math.round((data.completed / data.total) * 100);
                            button.innerHTML = `⏳ ${percent}%`;
                        } else if (data.status) {
                            button.innerHTML = `⏳ ${data.status}`;
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error installing model:', error);
        button.innerHTML = '❌ Failed';
        button.disabled = false;
        showError(`Failed to install model: ${error.message}`);
    }
}

/**
 * Show Ollama not running message
 */
function showOllamaNotRunning() {
    const statusDiv = document.getElementById('ollamaStatus');
    statusDiv.style.display = 'block';
    document.getElementById('ollamaStatusText').innerHTML =
        `❌ Ollama not running. Start it with: <code>./start.sh</code> or <code>ollama serve</code>`;

    // Show message in local models area
    const container = document.getElementById('localModels');
    container.innerHTML = `
        <div class="status-message warning">
            <p><strong>Ollama Not Running</strong></p>
            <p>Local models require Ollama to be running.</p>
            <p>Run the startup script: <code>./start.sh</code></p>
            <p>Or start manually: <code>ollama serve</code></p>
        </div>
    `;
}

/**
 * Main generation handler
 */
async function handleGenerate() {
    const topic = topicInput.value.trim();
    const selectedModels = getSelectedModels();
    const numDistractors = parseInt(numDistractorsSelect.value);

    // Validation
    if (!topic) {
        showError('Please enter a historical person or event');
        return;
    }

    if (selectedModels.length === 0) {
        showError('Please select at least one AI model');
        return;
    }

    // Clear previous results and errors
    hideError();
    resultsSection.style.display = 'none';
    currentResults = [];

    // Update button state
    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic,
                models: selectedModels,
                numDistractors
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate quiz content');
        }

        const data = await response.json();
        currentResults = data.results;
        displayResults(data.results);
        resultsSection.style.display = 'block';

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || 'An error occurred while generating quiz content');
    } finally {
        setLoading(false);
    }
}

/**
 * Get selected models from checkboxes
 */
function getSelectedModels() {
    const checkboxes = document.querySelectorAll('.model-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => ({
        model: cb.value,
        provider: cb.dataset.provider
    }));
}

/**
 * Display results in the UI
 */
function displayResults(results) {
    resultsContainer.innerHTML = '';

    results.forEach(result => {
        const resultCard = createResultCard(result);
        resultsContainer.appendChild(resultCard);
    });
}

/**
 * Create a result card for a single model's output
 */
function createResultCard(result) {
    const card = document.createElement('div');
    card.className = `model-result ${result.provider}`;

    const header = document.createElement('div');
    header.className = 'model-header';

    const title = document.createElement('div');
    title.className = 'model-title';
    title.textContent = getModelDisplayName(result.model);

    const time = document.createElement('div');
    time.className = 'generation-time';
    time.textContent = `Generated in ${result.generationTime}ms`;

    header.appendChild(title);
    header.appendChild(time);
    card.appendChild(header);

    // Correct Answer Section
    if (result.correctAnswer) {
        const answerSection = document.createElement('div');
        answerSection.className = 'answer-section';

        const answerTitle = document.createElement('h3');
        answerTitle.textContent = 'Correct Answer';

        const answerContent = document.createElement('div');
        answerContent.className = 'correct-answer';
        answerContent.textContent = result.correctAnswer;

        answerSection.appendChild(answerTitle);
        answerSection.appendChild(answerContent);
        card.appendChild(answerSection);
    }

    // Distractors Section
    if (result.distractors && result.distractors.length > 0) {
        const distractorsSection = document.createElement('div');
        distractorsSection.className = 'distractors-section';

        const distractorsTitle = document.createElement('h3');
        distractorsTitle.textContent = `Wrong Answers (Distractors)`;

        const distractorsList = document.createElement('ul');
        distractorsList.className = 'distractors-list';

        result.distractors.forEach((distractor, index) => {
            const item = document.createElement('li');
            item.className = 'distractor-item';
            item.textContent = distractor;
            distractorsList.appendChild(item);
        });

        distractorsSection.appendChild(distractorsTitle);
        distractorsSection.appendChild(distractorsList);
        card.appendChild(distractorsSection);
    }

    // Error display if present
    if (result.error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'var(--error-color)';
        errorDiv.style.padding = '1rem';
        errorDiv.style.background = '#fef2f2';
        errorDiv.style.borderRadius = '8px';
        errorDiv.textContent = `Error: ${result.error}`;
        card.appendChild(errorDiv);
    }

    return card;
}

/**
 * Get human-readable model name
 */
function getModelDisplayName(modelId) {
    const names = {
        // Cloud models
        'gpt-4': 'GPT-4',
        'gpt-3.5-turbo': 'GPT-3.5 Turbo',
        'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
        'claude-3-haiku-20240307': 'Claude 3 Haiku',
        'gemini-pro': 'Gemini Pro',
        // Local models (Ollama)
        'llama3.1:8b-instruct-q4_K_M': 'Llama 3.1 8B (Local)',
        'mistral:7b-instruct-v0.2-q4_K_M': 'Mistral 7B (Local)',
        'qwen2.5:14b-instruct-q4_K_M': 'Qwen 2.5 14B (Local)',
        'gemma2:9b-instruct-q4_K_M': 'Gemma 2 9B (Local)',
        'phi3:14b-medium-4k-instruct-q4_K_M': 'Phi-3 Medium 14B (Local)',
        'neural-chat:7b-v3.3-q4_K_M': 'Neural Chat 7B (Local)'
    };
    return names[modelId] || modelId;
}

/**
 * Export all results to clipboard
 */
async function handleExport() {
    if (currentResults.length === 0) return;

    const topic = topicInput.value.trim();
    let exportText = `Quiz Content for: ${topic}\n`;
    exportText += `Generated: ${new Date().toLocaleString()}\n`;
    exportText += '='.repeat(60) + '\n\n';

    currentResults.forEach((result, index) => {
        exportText += `Model: ${getModelDisplayName(result.model)} (${result.provider})\n`;
        exportText += '-'.repeat(60) + '\n';

        if (result.correctAnswer) {
            exportText += `\nCORRECT ANSWER:\n${result.correctAnswer}\n`;
        }

        if (result.distractors && result.distractors.length > 0) {
            exportText += `\nWRONG ANSWERS:\n`;
            result.distractors.forEach((d, i) => {
                exportText += `${i + 1}. ${d}\n`;
            });
        }

        exportText += '\n' + '='.repeat(60) + '\n\n';
    });

    try {
        await navigator.clipboard.writeText(exportText);

        // Visual feedback
        const originalText = exportBtn.textContent;
        exportBtn.textContent = '✓ Copied!';
        exportBtn.style.background = 'var(--success-color)';

        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.style.background = '';
        }, 2000);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showError('Failed to copy to clipboard');
    }
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;

    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorText.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Hide error message
 */
function hideError() {
    errorSection.style.display = 'none';
}
