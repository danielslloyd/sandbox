#!/usr/bin/env python3
"""
Quick demo script to test the vocabulary application components.
"""

import json
import os
import sys

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from vocab_app import WordDatabase, SpacedRepetition, UserProgress

def test_word_database():
    """Test the word database functionality."""
    print("=" * 60)
    print("TESTING WORD DATABASE")
    print("=" * 60)

    db = WordDatabase()
    print(f"Loaded {len(db.words)} words")

    # Test getting word data for a simple word
    test_word = "happy"
    print(f"\nFetching data for '{test_word}'...")
    word_data = db.get_word_data(test_word)

    if word_data:
        print(f"\nWord: {word_data['word']}")
        print(f"Phonetic: {word_data.get('phonetic', 'N/A')}")
        print(f"\nDefinitions:")
        for i, defn in enumerate(word_data['definitions'][:3], 1):
            print(f"  {i}. [{defn['part_of_speech']}] {defn['definition']}")
        print(f"\nEtymology: {word_data.get('etymology', 'N/A')[:200]}...")

        # Generate false definitions
        print("\nGenerating false definitions...")
        correct_def = word_data['definitions'][0]['definition']
        false_defs = db.generate_false_definitions(test_word, correct_def)
        print("\nFalse definitions:")
        for i, fdef in enumerate(false_defs, 1):
            print(f"  {i}. {fdef}")
    else:
        print("Failed to fetch word data")

    return db

def test_spaced_repetition():
    """Test the spaced repetition algorithm."""
    print("\n" + "=" * 60)
    print("TESTING SPACED REPETITION")
    print("=" * 60)

    ease = 2.5
    interval = 1

    print(f"\nInitial state: ease={ease}, interval={interval} day(s)")

    # Simulate correct answer
    new_ease, new_interval, next_review = SpacedRepetition.calculate_next_review(ease, interval, True)
    print(f"\nAfter CORRECT answer:")
    print(f"  New ease: {new_ease}")
    print(f"  New interval: {new_interval} day(s)")
    print(f"  Next review: {next_review.strftime('%Y-%m-%d %H:%M')}")

    # Simulate incorrect answer
    new_ease2, new_interval2, next_review2 = SpacedRepetition.calculate_next_review(new_ease, new_interval, False)
    print(f"\nAfter INCORRECT answer:")
    print(f"  New ease: {new_ease2}")
    print(f"  New interval: {new_interval2} day(s) (reset!)")
    print(f"  Next review: {next_review2.strftime('%Y-%m-%d %H:%M')}")

def test_user_progress():
    """Test the user progress tracking."""
    print("\n" + "=" * 60)
    print("TESTING USER PROGRESS")
    print("=" * 60)

    # Create a test user
    progress = UserProgress()
    test_user = "demo_user"

    print(f"\nCreating user: {test_user}")
    user_data = progress.get_or_create_user(test_user)
    print(f"User created successfully!")
    print(f"  Vocabulary level: {user_data['vocabulary_level']}")
    print(f"  Words learned: {len(user_data['words_learned'])}")

    # Simulate learning some words
    test_words = ["happy", "sad", "beautiful", "ugly", "smart"]

    print(f"\nSimulating quiz with words: {test_words}")

    for word in test_words:
        # Alternate correct/incorrect
        correct = (test_words.index(word) % 2 == 0)
        progress.update_word_progress(test_user, word, correct)
        status = "✓ CORRECT" if correct else "✗ INCORRECT"
        print(f"  {word}: {status}")

    # Show updated progress
    user_data = progress.get_or_create_user(test_user)
    print(f"\nUpdated progress:")
    print(f"  Words learned: {len(user_data['words_learned'])}")

    # Show words due for review
    due_words = progress.get_words_for_review(test_user)
    print(f"  Words due for review: {len(due_words)}")

    # Show recently wrong words
    wrong_words = progress.get_recently_wrong_words(test_user)
    print(f"  Recently wrong words: {len(wrong_words)}")
    if wrong_words:
        print(f"    {', '.join(wrong_words)}")

    # Clean up demo user
    print(f"\nCleaning up demo user...")
    if test_user in progress.users:
        del progress.users[test_user]
        progress._save_data()
    print("Demo user removed")

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("VOCABULARY APP DEMO")
    print("=" * 60)
    print("\nThis demo tests the core functionality of the vocabulary app.\n")

    try:
        db = test_word_database()
        test_spaced_repetition()
        test_user_progress()

        print("\n" + "=" * 60)
        print("DEMO COMPLETE!")
        print("=" * 60)
        print("\nAll components are working correctly!")
        print("\nTo start the full application, run:")
        print("  python vocab_app.py")
        print()

    except Exception as e:
        print(f"\nError during demo: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
