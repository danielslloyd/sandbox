"""
Text Rewriter Application
A Flask-based web app for rewriting text using Ollama with optional style corpus.
"""

import os
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

OLLAMA_API_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.2"  # You can change this to any model you have pulled


def check_ollama_available():
    """Check if Ollama service is running."""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False


def read_corpus_files(corpus_path):
    """Read all text files from the corpus directory."""
    if not corpus_path or not os.path.isdir(corpus_path):
        return None

    corpus_texts = []
    supported_extensions = {'.txt', '.md', '.text'}

    for file_path in Path(corpus_path).rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        corpus_texts.append(content)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    return corpus_texts if corpus_texts else None


def build_rewrite_prompt(original_text, custom_prompt, corpus_texts=None):
    """Build the complete prompt for the LLM."""
    prompt_parts = []

    if corpus_texts:
        # Few-shot learning approach with corpus examples
        prompt_parts.append("You are a text rewriter. Below are examples of the target writing style:\n")

        # Include up to 3 examples to avoid token limits
        for i, example in enumerate(corpus_texts[:3], 1):
            # Truncate very long examples
            example_text = example[:1000] + "..." if len(example) > 1000 else example
            prompt_parts.append(f"EXAMPLE {i}:\n{example_text}\n")

        prompt_parts.append("\nNow, rewrite the following text in the same style as the examples above.")
        if custom_prompt:
            prompt_parts.append(f" Additional instructions: {custom_prompt}")
        prompt_parts.append(f"\n\nORIGINAL TEXT:\n{original_text}\n\nREWRITTEN TEXT:")
    else:
        # Simple rewrite with just custom instructions
        if custom_prompt:
            prompt_parts.append(f"{custom_prompt}\n\n")
        prompt_parts.append(f"ORIGINAL TEXT:\n{original_text}\n\nREWRITTEN TEXT:")

    return "".join(prompt_parts)


def call_ollama(prompt, model=DEFAULT_MODEL):
    """Call Ollama API to generate rewritten text."""
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9
            }
        }

        response = requests.post(OLLAMA_API_URL, json=payload, timeout=120)
        response.raise_for_status()

        result = response.json()
        return result.get('response', '').strip()

    except requests.exceptions.Timeout:
        raise Exception("Request to Ollama timed out. The text might be too long.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error calling Ollama: {str(e)}")


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/check-ollama', methods=['GET'])
def check_ollama():
    """Check if Ollama is available."""
    is_available = check_ollama_available()
    return jsonify({'available': is_available})


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available Ollama models."""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        response.raise_for_status()
        models = response.json().get('models', [])
        model_names = [model['name'] for model in models]
        return jsonify({'models': model_names})
    except:
        return jsonify({'models': [DEFAULT_MODEL]})


@app.route('/api/rewrite', methods=['POST'])
def rewrite_text():
    """Handle text rewriting request."""
    try:
        data = request.json

        original_text = data.get('text', '').strip()
        custom_prompt = data.get('prompt', '').strip()
        corpus_path = data.get('corpus_path', '').strip()
        model = data.get('model', DEFAULT_MODEL)

        if not original_text:
            return jsonify({'error': 'No text provided'}), 400

        # Read corpus if path provided
        corpus_texts = None
        if corpus_path:
            corpus_texts = read_corpus_files(corpus_path)
            if not corpus_texts:
                return jsonify({'warning': 'No valid text files found in corpus directory'}), 400

        # Build prompt and call Ollama
        prompt = build_rewrite_prompt(original_text, custom_prompt, corpus_texts)
        rewritten_text = call_ollama(prompt, model)

        return jsonify({
            'rewritten_text': rewritten_text,
            'corpus_files_used': len(corpus_texts) if corpus_texts else 0
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = 5000
    print(f"\n{'='*60}")
    print(f"  Text Rewriter Application")
    print(f"{'='*60}")
    print(f"\n  Server running at: http://localhost:{port}")
    print(f"\n  Press Ctrl+C to stop the server")
    print(f"{'='*60}\n")

    app.run(host='0.0.0.0', port=port, debug=False)
