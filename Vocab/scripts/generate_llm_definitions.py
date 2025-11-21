#!/usr/bin/env python3
"""
LLM False Definition Generator

This script uses Ollama to generate convincing false definitions for vocabulary words.
The generated definitions are saved to data/llm_false_definitions.json,
which can then be loaded by the HTML/JS application.

Requirements:
- Ollama installed and running (https://ollama.ai)
- A model pulled (e.g., ollama pull llama2)

Usage:
    python scripts/generate_llm_definitions.py [options]

Options:
    --words WORD1,WORD2,...  Generate definitions for specific words
    --count N               Generate for N random words (default: 100)
    --model MODEL           Ollama model to use (default: llama2)
    --batch-size N          Process N words at a time (default: 10)
"""

import json
import os
import sys
import time
import argparse
import random
import requests
from typing import List, Dict


class LLMDefinitionGenerator:
    def __init__(self, model: str = "llama2", ollama_url: str = "http://localhost:11434"):
        self.model = model
        self.ollama_url = ollama_url
        self.output_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'llm_false_definitions.json'
        )

    def load_existing_definitions(self) -> Dict:
        """Load existing definitions if file exists."""
        if os.path.exists(self.output_file):
            with open(self.output_file, 'r') as f:
                return json.load(f)
        return {}

    def save_definitions(self, definitions: Dict):
        """Save definitions to JSON file."""
        with open(self.output_file, 'w') as f:
            json.dump(definitions, f, indent=2)

    def generate_false_definitions(self, word: str, correct_definition: str) -> List[str]:
        """Generate 3 false but plausible definitions using LLM."""
        prompt = f"""Generate 3 plausible but incorrect definitions for the word '{word}'.

The CORRECT definition is: {correct_definition}

Your task is to create 3 FALSE definitions that:
1. Sound convincing and academic
2. Are similar in style and length to the correct definition
3. Are completely wrong but could fool someone who doesn't know the word
4. Use proper grammar and vocabulary

Output ONLY the 3 false definitions, numbered 1-3, with no additional text.

Example format:
1. [First false definition]
2. [Second false definition]
3. [Third false definition]
"""

        try:
            response = requests.post(
                f'{self.ollama_url}/api/generate',
                json={
                    'model': self.model,
                    'prompt': prompt,
                    'stream': False,
                    'options': {
                        'temperature': 0.8,
                        'top_p': 0.9
                    }
                },
                timeout=30
            )

            if response.status_code == 200:
                text = response.json().get('response', '')
                return self.parse_definitions(text)
            else:
                print(f"Error: API returned status {response.status_code}")
                return []

        except requests.exceptions.ConnectionError:
            print("Error: Cannot connect to Ollama. Make sure it's running on http://localhost:11434")
            return []
        except Exception as e:
            print(f"Error generating definitions for '{word}': {e}")
            return []

    def parse_definitions(self, text: str) -> List[str]:
        """Parse numbered definitions from LLM response."""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        definitions = []

        for line in lines:
            # Remove numbering (1. or 1) or - or *)
            cleaned = line
            if len(line) > 0 and line[0].isdigit():
                # Find the first non-digit, non-punctuation character
                for i, char in enumerate(line):
                    if char.isalpha() or char == '"':
                        cleaned = line[i:].strip()
                        break

            # Remove leading dashes or asterisks
            cleaned = cleaned.lstrip('-*').strip()

            if cleaned and len(cleaned) > 20:  # Minimum length check
                definitions.append(cleaned)

        return definitions[:3]  # Return only first 3

    def test_connection(self) -> bool:
        """Test connection to Ollama."""
        try:
            response = requests.get(f'{self.ollama_url}/api/tags', timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m['name'] for m in models]

                if self.model not in model_names and f"{self.model}:latest" not in model_names:
                    print(f"Warning: Model '{self.model}' not found.")
                    print(f"Available models: {', '.join(model_names)}")
                    print(f"\nTo install the model, run: ollama pull {self.model}")
                    return False

                print(f"✓ Connected to Ollama")
                print(f"✓ Using model: {self.model}")
                return True
        except:
            print("✗ Cannot connect to Ollama")
            print("\nMake sure Ollama is running:")
            print("1. Download from https://ollama.ai")
            print("2. Install Ollama")
            print("3. Run: ollama serve")
            print(f"4. Pull a model: ollama pull {self.model}")
            return False

        return False


def load_words():
    """Load words from frequency list."""
    words_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'data',
        'words_by_frequency.json'
    )

    with open(words_file, 'r') as f:
        return json.load(f)


def get_word_definition(word: str) -> str:
    """Get word definition from dictionary API."""
    try:
        response = requests.get(
            f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()[0]
            meanings = data.get('meanings', [])
            if meanings and meanings[0].get('definitions'):
                return meanings[0]['definitions'][0].get('definition', '')
    except:
        pass

    return None


def main():
    parser = argparse.ArgumentParser(description='Generate LLM false definitions for vocabulary words')
    parser.add_argument('--words', type=str, help='Comma-separated list of words')
    parser.add_argument('--count', type=int, default=100, help='Number of random words to process')
    parser.add_argument('--model', type=str, default='llama2', help='Ollama model to use')
    parser.add_argument('--batch-size', type=int, default=10, help='Words per batch')
    parser.add_argument('--start-from', type=int, default=0, help='Start from word index')

    args = parser.parse_args()

    # Initialize generator
    generator = LLMDefinitionGenerator(model=args.model)

    # Test connection
    if not generator.test_connection():
        sys.exit(1)

    # Load existing definitions
    all_definitions = generator.load_existing_definitions()
    print(f"\nLoaded {len(all_definitions)} existing definitions")

    # Determine which words to process
    if args.words:
        words_to_process = [w.strip() for w in args.words.split(',')]
    else:
        all_words = load_words()
        # Select words from a range (e.g., 100-1000 for medium difficulty)
        word_range = all_words[args.start_from:args.start_from + args.count]
        words_to_process = random.sample(word_range, min(args.count, len(word_range)))

    print(f"\nProcessing {len(words_to_process)} words...")
    print(f"Batch size: {args.batch_size}")
    print()

    # Process words
    processed = 0
    errors = 0
    skipped = 0

    for i, word in enumerate(words_to_process):
        # Skip if already have definitions
        if word in all_definitions:
            skipped += 1
            continue

        print(f"[{i+1}/{len(words_to_process)}] {word}...", end=' ')

        # Get correct definition
        correct_def = get_word_definition(word)
        if not correct_def:
            print("(no definition found, skipping)")
            errors += 1
            continue

        # Generate false definitions
        false_defs = generator.generate_false_definitions(word, correct_def)

        if len(false_defs) >= 3:
            all_definitions[word] = false_defs
            processed += 1
            print("✓")
        else:
            print(f"✗ (only got {len(false_defs)} definitions)")
            errors += 1

        # Save periodically
        if processed % args.batch_size == 0:
            generator.save_definitions(all_definitions)
            print(f"\n→ Saved {len(all_definitions)} total definitions\n")

        # Small delay to avoid overwhelming the API
        time.sleep(0.5)

    # Final save
    generator.save_definitions(all_definitions)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total definitions in database: {len(all_definitions)}")
    print(f"Newly processed: {processed}")
    print(f"Skipped (already exist): {skipped}")
    print(f"Errors: {errors}")
    print(f"\nDefinitions saved to: {generator.output_file}")
    print("=" * 60)


if __name__ == "__main__":
    main()
