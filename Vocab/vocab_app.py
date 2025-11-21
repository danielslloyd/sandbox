#!/usr/bin/env python3
"""
Vocabulary Learning Application
A comprehensive tool for vocabulary building with adaptive difficulty,
spaced repetition, and flashcard modes.
"""

import json
import os
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import requests


class WordDatabase:
    """Manages word data including definitions, etymology, and false definitions."""

    def __init__(self, words_file: str = "words_by_frequency.json"):
        self.words_file = os.path.join(os.path.dirname(__file__), words_file)
        self.words = self._load_words()
        self.cache_file = os.path.join(os.path.dirname(__file__), "word_cache.json")
        self.cache = self._load_cache()

    def _load_words(self) -> List[str]:
        """Load words sorted by frequency."""
        if os.path.exists(self.words_file):
            with open(self.words_file, 'r') as f:
                return json.load(f)
        return []

    def _load_cache(self) -> Dict:
        """Load cached word data (definitions, etymology)."""
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_cache(self):
        """Save word data cache."""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)

    def get_word_data(self, word: str) -> Optional[Dict]:
        """Get definition and etymology for a word."""
        if word in self.cache:
            return self.cache[word]

        # Try Free Dictionary API
        try:
            response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}", timeout=5)
            if response.status_code == 200:
                data = response.json()[0]

                # Extract definition
                definitions = []
                for meaning in data.get('meanings', []):
                    for definition in meaning.get('definitions', []):
                        definitions.append({
                            'part_of_speech': meaning.get('partOfSpeech', 'unknown'),
                            'definition': definition.get('definition', ''),
                            'example': definition.get('example', '')
                        })

                # Extract etymology
                etymology = data.get('origin', 'Etymology not available')

                word_data = {
                    'word': word,
                    'definitions': definitions,
                    'etymology': etymology,
                    'phonetic': data.get('phonetic', '')
                }

                self.cache[word] = word_data
                self._save_cache()
                return word_data
        except Exception as e:
            print(f"Error fetching data for '{word}': {e}")

        return None

    def generate_false_definitions(self, word: str, correct_def: str, use_llm: bool = False) -> List[str]:
        """Generate 3 false but plausible definitions."""
        if use_llm:
            return self._generate_llm_false_definitions(word, correct_def)
        else:
            return self._generate_simple_false_definitions(word, correct_def)

    def _generate_simple_false_definitions(self, word: str, correct_def: str) -> List[str]:
        """Generate simple false definitions using templates."""
        # Get random words for substitution
        random_words = random.sample(self.words[:1000], min(10, len(self.words)))

        templates = [
            f"The act of {random.choice(['creating', 'destroying', 'modifying', 'organizing'])} {random.choice(random_words)}",
            f"A person who {random.choice(['studies', 'collects', 'avoids', 'creates'])} {random.choice(random_words)}",
            f"Relating to or characteristic of {random.choice(random_words)}",
            f"The state of being {random.choice(['extremely', 'moderately', 'slightly'])} {random.choice(['confused', 'happy', 'tired', 'energetic'])}",
            f"A tool used for {random.choice(['measuring', 'cutting', 'joining', 'separating'])} {random.choice(random_words)}",
            f"The process of {random.choice(['transforming', 'analyzing', 'combining'])} something into {random.choice(random_words)}",
        ]

        false_defs = random.sample(templates, 3)
        return false_defs

    def _generate_llm_false_definitions(self, word: str, correct_def: str) -> List[str]:
        """Generate false definitions using local LLM (optional - Ollama integration)."""
        try:
            # Try to use Ollama API if available
            response = requests.post(
                'http://localhost:11434/api/generate',
                json={
                    'model': 'llama2',  # or another model
                    'prompt': f"Generate 3 plausible but incorrect definitions for the word '{word}'. The correct definition is: {correct_def}. Make them sound convincing and similar in style. Output only the 3 definitions, numbered 1-3.",
                    'stream': False
                },
                timeout=10
            )

            if response.status_code == 200:
                text = response.json().get('response', '')
                # Parse the numbered definitions
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                defs = []
                for line in lines:
                    # Remove numbering
                    if line[0].isdigit() and '.' in line[:3]:
                        defs.append(line.split('.', 1)[1].strip())
                    elif line[0].isdigit() and ')' in line[:3]:
                        defs.append(line.split(')', 1)[1].strip())

                if len(defs) >= 3:
                    return defs[:3]
        except Exception as e:
            print(f"LLM generation failed, falling back to simple generation: {e}")

        # Fallback to simple generation
        return self._generate_simple_false_definitions(word, correct_def)


class SpacedRepetition:
    """Implements spaced repetition algorithm (simplified SM-2)."""

    @staticmethod
    def calculate_next_review(ease_factor: float, interval: int, correct: bool) -> Tuple[float, int, datetime]:
        """Calculate next review date and updated parameters."""
        if correct:
            new_ease = max(1.3, ease_factor + 0.1)
            new_interval = max(1, int(interval * new_ease))
        else:
            new_ease = max(1.3, ease_factor - 0.2)
            new_interval = 1  # Reset to 1 day if incorrect

        next_review = datetime.now() + timedelta(days=new_interval)
        return new_ease, new_interval, next_review


class UserProgress:
    """Manages user-specific progress and statistics."""

    def __init__(self, data_file: str = "user_data.json"):
        self.data_file = os.path.join(os.path.dirname(__file__), data_file)
        self.users = self._load_data()

    def _load_data(self) -> Dict:
        """Load user data from file."""
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_data(self):
        """Save user data to file."""
        with open(self.data_file, 'w') as f:
            json.dump(self.users, f, indent=2)

    def get_or_create_user(self, username: str) -> Dict:
        """Get existing user or create new one."""
        if username not in self.users:
            self.users[username] = {
                'username': username,
                'created_at': datetime.now().isoformat(),
                'vocabulary_level': 0,  # Estimated vocabulary size
                'words_learned': {},  # word -> {ease_factor, interval, next_review, attempts, correct_count}
                'current_difficulty_range': [0, 100],  # Index range in word list
                'quiz_history': []
            }
            self._save_data()
        return self.users[username]

    def update_word_progress(self, username: str, word: str, correct: bool):
        """Update progress for a specific word."""
        user = self.get_or_create_user(username)

        if word not in user['words_learned']:
            user['words_learned'][word] = {
                'ease_factor': 2.5,
                'interval': 1,
                'next_review': datetime.now().isoformat(),
                'attempts': 0,
                'correct_count': 0,
                'first_seen': datetime.now().isoformat()
            }

        word_data = user['words_learned'][word]
        word_data['attempts'] += 1
        if correct:
            word_data['correct_count'] += 1

        # Update spaced repetition parameters
        ease, interval, next_review = SpacedRepetition.calculate_next_review(
            word_data['ease_factor'],
            word_data['interval'],
            correct
        )

        word_data['ease_factor'] = ease
        word_data['interval'] = interval
        word_data['next_review'] = next_review.isoformat()
        word_data['last_reviewed'] = datetime.now().isoformat()

        self._save_data()

    def get_words_for_review(self, username: str) -> List[str]:
        """Get words that are due for review."""
        user = self.get_or_create_user(username)
        now = datetime.now()

        due_words = []
        for word, data in user['words_learned'].items():
            next_review = datetime.fromisoformat(data['next_review'])
            if next_review <= now:
                due_words.append(word)

        return due_words

    def get_recently_wrong_words(self, username: str, limit: int = 20) -> List[str]:
        """Get words recently gotten wrong for flashcard mode."""
        user = self.get_or_create_user(username)

        # Get words with low success rate
        wrong_words = []
        for word, data in user['words_learned'].items():
            if data['attempts'] > 0:
                success_rate = data['correct_count'] / data['attempts']
                if success_rate < 0.7:  # Less than 70% success
                    wrong_words.append((word, success_rate, data.get('last_reviewed', '')))

        # Sort by last reviewed (most recent first)
        wrong_words.sort(key=lambda x: x[2], reverse=True)
        return [w[0] for w in wrong_words[:limit]]


class VocabApp:
    """Main application controller."""

    def __init__(self):
        self.word_db = WordDatabase()
        self.user_progress = UserProgress()
        self.current_user = None

    def start(self):
        """Start the application."""
        print("=" * 60)
        print("VOCABULARY LEARNING APPLICATION")
        print("=" * 60)
        print()

        username = input("Enter your username: ").strip()
        if not username:
            username = "guest"

        self.current_user = username
        user_data = self.user_progress.get_or_create_user(username)

        print(f"\nWelcome, {username}!")
        print(f"Words learned: {len(user_data['words_learned'])}")
        print(f"Estimated vocabulary level: {user_data['vocabulary_level']}")
        print()

        self.main_menu()

    def main_menu(self):
        """Display main menu."""
        while True:
            print("\n" + "=" * 60)
            print("MAIN MENU")
            print("=" * 60)
            print("1. Adaptive Quiz (Vocabulary Assessment)")
            print("2. Review Mode (Spaced Repetition)")
            print("3. Flashcard Mode (Recently Learned/Wrong)")
            print("4. View Progress")
            print("5. Settings")
            print("6. Exit")
            print()

            choice = input("Select an option (1-6): ").strip()

            if choice == '1':
                self.adaptive_quiz()
            elif choice == '2':
                self.review_mode()
            elif choice == '3':
                self.flashcard_mode()
            elif choice == '4':
                self.view_progress()
            elif choice == '5':
                self.settings()
            elif choice == '6':
                print("\nGoodbye! Keep learning!")
                break
            else:
                print("Invalid option. Please try again.")

    def adaptive_quiz(self, num_questions: int = 10):
        """Run adaptive quiz to assess vocabulary level."""
        user_data = self.user_progress.get_or_create_user(self.current_user)
        difficulty_range = user_data['current_difficulty_range']

        print("\n" + "=" * 60)
        print("ADAPTIVE QUIZ MODE")
        print("=" * 60)
        print("This quiz will adapt to your level to estimate your vocabulary size.")
        print(f"Starting difficulty: Words {difficulty_range[0]}-{difficulty_range[1]}")
        print()

        correct_count = 0

        for i in range(num_questions):
            # Select word from current difficulty range
            word_index = random.randint(difficulty_range[0], min(difficulty_range[1], len(self.word_db.words) - 1))
            word = self.word_db.words[word_index]

            # Get word data
            word_data = self.word_db.get_word_data(word)
            if not word_data or not word_data['definitions']:
                continue

            correct_def = word_data['definitions'][0]['definition']
            false_defs = self.word_db.generate_false_definitions(word, correct_def, use_llm=False)

            # Create quiz question
            all_options = [correct_def] + false_defs
            random.shuffle(all_options)
            correct_index = all_options.index(correct_def)

            print(f"\nQuestion {i+1}/{num_questions}")
            print(f"Word: {word.upper()}")
            if word_data['phonetic']:
                print(f"Pronunciation: {word_data['phonetic']}")
            print("\nWhat is the definition?")

            for idx, option in enumerate(all_options, 1):
                print(f"{idx}. {option}")

            answer = input("\nYour answer (1-4): ").strip()

            try:
                answer_idx = int(answer) - 1
                if answer_idx == correct_index:
                    print("✓ Correct!")
                    correct_count += 1
                    self.user_progress.update_word_progress(self.current_user, word, True)

                    # Make it harder
                    difficulty_range[0] = min(len(self.word_db.words) - 100, difficulty_range[0] + 50)
                    difficulty_range[1] = min(len(self.word_db.words) - 1, difficulty_range[1] + 50)
                else:
                    print(f"✗ Incorrect. The correct answer was: {correct_def}")
                    self.user_progress.update_word_progress(self.current_user, word, False)

                    # Make it easier
                    difficulty_range[0] = max(0, difficulty_range[0] - 30)
                    difficulty_range[1] = max(100, difficulty_range[1] - 30)

                # Show etymology
                if word_data['etymology']:
                    show_etym = input("Show etymology? (y/n): ").strip().lower()
                    if show_etym == 'y':
                        print(f"\nEtymology: {word_data['etymology']}")

            except (ValueError, IndexError):
                print("Invalid input. Skipping question.")

        # Update user's difficulty range
        user_data['current_difficulty_range'] = difficulty_range
        user_data['vocabulary_level'] = (difficulty_range[0] + difficulty_range[1]) // 2
        self.user_progress._save_data()

        print(f"\n{'=' * 60}")
        print(f"Quiz complete! Score: {correct_count}/{num_questions}")
        print(f"Updated vocabulary level: {user_data['vocabulary_level']}")
        print(f"{'=' * 60}")

    def review_mode(self):
        """Review words using spaced repetition."""
        due_words = self.user_progress.get_words_for_review(self.current_user)

        print("\n" + "=" * 60)
        print("REVIEW MODE (Spaced Repetition)")
        print("=" * 60)

        if not due_words:
            print("No words due for review! Great job!")
            return

        print(f"You have {len(due_words)} words due for review.")
        print()

        for word in due_words:
            word_data = self.word_db.get_word_data(word)
            if not word_data:
                continue

            correct_def = word_data['definitions'][0]['definition']
            false_defs = self.word_db.generate_false_definitions(word, correct_def)

            all_options = [correct_def] + false_defs
            random.shuffle(all_options)
            correct_index = all_options.index(correct_def)

            print(f"\nWord: {word.upper()}")
            print("\nSelect the correct definition:")

            for idx, option in enumerate(all_options, 1):
                print(f"{idx}. {option}")

            answer = input("\nYour answer (1-4, or 'q' to quit): ").strip()

            if answer.lower() == 'q':
                break

            try:
                answer_idx = int(answer) - 1
                correct = (answer_idx == correct_index)

                if correct:
                    print("✓ Correct!")
                else:
                    print(f"✗ Incorrect. The correct answer was: {correct_def}")

                self.user_progress.update_word_progress(self.current_user, word, correct)

            except (ValueError, IndexError):
                print("Invalid input. Skipping word.")

        print("\nReview session complete!")

    def flashcard_mode(self):
        """Flashcard mode for recently learned/wrong words."""
        wrong_words = self.user_progress.get_recently_wrong_words(self.current_user)

        print("\n" + "=" * 60)
        print("FLASHCARD MODE")
        print("=" * 60)

        if not wrong_words:
            print("No words to review! Try the adaptive quiz first.")
            return

        print(f"Reviewing {len(wrong_words)} words you've struggled with.")
        print("Press Enter to flip card, 'n' for next, 'q' to quit.")
        print()

        for word in wrong_words:
            word_data = self.word_db.get_word_data(word)
            if not word_data:
                continue

            print(f"\n{'=' * 60}")
            print(f"WORD: {word.upper()}")
            if word_data['phonetic']:
                print(f"Pronunciation: {word_data['phonetic']}")
            print(f"{'=' * 60}")

            action = input("\nPress Enter to reveal definition (or 'n' to skip, 'q' to quit): ").strip().lower()

            if action == 'q':
                break
            elif action == 'n':
                continue

            print(f"\nDefinition: {word_data['definitions'][0]['definition']}")

            if word_data['etymology']:
                print(f"\nEtymology: {word_data['etymology']}")

            # Ask if they knew it
            knew_it = input("\nDid you know this word? (y/n): ").strip().lower()
            if knew_it == 'y':
                self.user_progress.update_word_progress(self.current_user, word, True)
            else:
                self.user_progress.update_word_progress(self.current_user, word, False)

        print("\nFlashcard session complete!")

    def view_progress(self):
        """Display user progress statistics."""
        user_data = self.user_progress.get_or_create_user(self.current_user)

        print("\n" + "=" * 60)
        print("YOUR PROGRESS")
        print("=" * 60)
        print(f"Username: {user_data['username']}")
        print(f"Member since: {user_data['created_at'][:10]}")
        print(f"Vocabulary level: {user_data['vocabulary_level']}")
        print(f"Total words encountered: {len(user_data['words_learned'])}")

        # Calculate statistics
        if user_data['words_learned']:
            total_attempts = sum(w['attempts'] for w in user_data['words_learned'].values())
            total_correct = sum(w['correct_count'] for w in user_data['words_learned'].values())
            accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

            print(f"Total attempts: {total_attempts}")
            print(f"Overall accuracy: {accuracy:.1f}%")

            # Words due for review
            due_words = self.user_progress.get_words_for_review(self.current_user)
            print(f"Words due for review: {len(due_words)}")

        print("=" * 60)

    def settings(self):
        """Application settings."""
        print("\n" + "=" * 60)
        print("SETTINGS")
        print("=" * 60)
        print("1. Change username")
        print("2. Reset progress")
        print("3. Enable LLM for false definitions (requires Ollama)")
        print("4. Back to main menu")
        print()

        choice = input("Select option: ").strip()

        if choice == '1':
            new_username = input("Enter new username: ").strip()
            if new_username:
                self.current_user = new_username
                print(f"Username changed to: {new_username}")
        elif choice == '2':
            confirm = input("Are you sure you want to reset all progress? (yes/no): ").strip().lower()
            if confirm == 'yes':
                if self.current_user in self.user_progress.users:
                    del self.user_progress.users[self.current_user]
                    self.user_progress._save_data()
                    print("Progress reset!")
        elif choice == '3':
            print("LLM support requires Ollama running locally on port 11434.")
            print("Visit https://ollama.ai to download and install.")


if __name__ == "__main__":
    app = VocabApp()
    app.start()
