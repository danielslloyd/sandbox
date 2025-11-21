/**
 * Vocabulary Learning Application - Main Controller
 */

import { WordDatabase } from './word-database.js';
import { UserProgress } from './user-progress.js';
import { SpacedRepetition } from './spaced-repetition.js';

class VocabApp {
    constructor() {
        this.wordDB = new WordDatabase();
        this.userProgress = new UserProgress();
        this.currentUser = null;
        this.currentScreen = 'login';

        // Quiz state
        this.quizState = {
            questions: [],
            currentQuestion: 0,
            score: 0,
            difficultyRange: [0, 100]
        };

        // Review state
        this.reviewState = {
            words: [],
            currentIndex: 0
        };

        // Flashcard state
        this.flashcardState = {
            words: [],
            currentIndex: 0
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Load words
        await this.wordDB.loadWords();
        await this.wordDB.loadLLMDefinitions();

        // Set up event listeners
        this.setupEventListeners();

        // Show login screen
        this.showScreen('login');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Change user button
        document.getElementById('change-user-btn').addEventListener('click', () => {
            this.currentUser = null;
            this.showScreen('login');
        });

        // Main menu buttons
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.handleMenuSelection(mode);
            });
        });

        // Back buttons
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => this.showMainMenu());
        });

        // Quiz screen
        document.getElementById('next-question-btn').addEventListener('click', () => this.nextQuestion());

        // Review screen
        document.getElementById('review-next-btn').addEventListener('click', () => this.nextReviewWord());

        // Flashcard screen
        document.getElementById('flip-card-btn').addEventListener('click', () => this.flipFlashcard());
        document.getElementById('flashcard-correct-btn').addEventListener('click', () => this.handleFlashcardResponse(true));
        document.getElementById('flashcard-wrong-btn').addEventListener('click', () => this.handleFlashcardResponse(false));

        // Settings
        document.getElementById('reset-progress-btn').addEventListener('click', () => this.handleResetProgress());
        document.getElementById('questions-per-quiz').addEventListener('change', (e) => {
            const settings = this.userProgress.getSettings();
            settings.questionsPerQuiz = parseInt(e.target.value);
            this.userProgress.saveSettings(settings);
        });
    }

    /**
     * Handle user login
     */
    handleLogin() {
        const username = document.getElementById('username-input').value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }

        this.currentUser = username;
        this.userProgress.getOrCreateUser(username);

        // Update UI
        document.getElementById('current-user').textContent = username;
        document.getElementById('username-input').value = '';

        // Show main menu
        this.showMainMenu();
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        this.updateUserStats();
        this.showScreen('main-menu');
    }

    /**
     * Update user statistics display
     */
    updateUserStats() {
        const stats = this.userProgress.getStatistics(this.currentUser);
        const statsDiv = document.getElementById('user-stats');

        statsDiv.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${stats.wordsLearned}</span>
                <span class="stat-label">Words Learned</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.vocabularyLevel}</span>
                <span class="stat-label">Vocabulary Level</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.accuracy}%</span>
                <span class="stat-label">Accuracy</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.dueForReview}</span>
                <span class="stat-label">Due for Review</span>
            </div>
        `;
    }

    /**
     * Handle main menu selection
     */
    handleMenuSelection(mode) {
        switch (mode) {
            case 'adaptive-quiz':
                this.startAdaptiveQuiz();
                break;
            case 'review':
                this.startReviewMode();
                break;
            case 'flashcard':
                this.startFlashcardMode();
                break;
            case 'progress':
                this.showProgress();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }

    /**
     * Start adaptive quiz
     */
    async startAdaptiveQuiz() {
        const userData = this.userProgress.users[this.currentUser];
        const settings = this.userProgress.getSettings();
        const numQuestions = settings.questionsPerQuiz;

        this.quizState = {
            questions: [],
            currentQuestion: 0,
            score: 0,
            difficultyRange: [...userData.currentDifficultyRange]
        };

        this.showScreen('quiz');
        await this.loadNextQuizQuestion();
    }

    /**
     * Load next quiz question
     */
    async loadNextQuizQuestion() {
        const settings = this.userProgress.getSettings();
        const numQuestions = settings.questionsPerQuiz;

        if (this.quizState.currentQuestion >= numQuestions) {
            this.showQuizResults();
            return;
        }

        // Update progress display
        document.getElementById('quiz-question-number').textContent =
            `Question ${this.quizState.currentQuestion + 1}/${numQuestions}`;
        document.getElementById('quiz-score').textContent =
            `Score: ${this.quizState.score}/${this.quizState.currentQuestion}`;

        // Get random word from current difficulty range
        const [min, max] = this.quizState.difficultyRange;
        const word = this.wordDB.getRandomWord(min, max);

        // Show loading
        document.getElementById('quiz-word').textContent = 'Loading...';
        document.getElementById('quiz-options').innerHTML = '<div class="loading">Loading</div>';

        // Get word data
        const wordData = await this.wordDB.getWordData(word);

        if (!wordData || !wordData.definitions || wordData.definitions.length === 0) {
            // Skip this word and try another
            await this.loadNextQuizQuestion();
            return;
        }

        // Display word
        document.getElementById('quiz-word').textContent = word.toUpperCase();
        document.getElementById('quiz-phonetic').textContent = wordData.phonetic;

        // Get correct definition
        const correctDef = wordData.definitions[0].definition;

        // Generate false definitions
        const falseDefs = this.wordDB.generateFalseDefinitions(word, correctDef);

        // Create options
        const options = [correctDef, ...falseDefs];
        const shuffledOptions = this.wordDB.shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(correctDef);

        // Display options
        const optionsDiv = document.getElementById('quiz-options');
        optionsDiv.innerHTML = '';

        shuffledOptions.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.handleQuizAnswer(index, correctIndex, word, wordData));
            optionsDiv.appendChild(btn);
        });

        // Hide feedback and etymology
        document.getElementById('quiz-feedback').classList.add('hidden');
        document.getElementById('quiz-etymology').classList.add('hidden');
        document.getElementById('next-question-btn').classList.add('hidden');

        // Store current question data
        this.quizState.currentWordData = { word, wordData, correctIndex };
    }

    /**
     * Handle quiz answer
     */
    handleQuizAnswer(selectedIndex, correctIndex, word, wordData) {
        const correct = selectedIndex === correctIndex;

        // Update score
        if (correct) {
            this.quizState.score++;
        }

        // Disable all option buttons
        const buttons = document.querySelectorAll('#quiz-options .option-btn');
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === correctIndex) {
                btn.classList.add('correct');
            } else if (index === selectedIndex && !correct) {
                btn.classList.add('incorrect');
            }
        });

        // Show feedback
        const feedbackDiv = document.getElementById('quiz-feedback');
        feedbackDiv.classList.remove('hidden');
        feedbackDiv.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
        feedbackDiv.textContent = correct ? '✓ Correct!' : `✗ Incorrect. The correct answer was: ${wordData.definitions[0].definition}`;

        // Show etymology
        if (wordData.etymology) {
            const etymDiv = document.getElementById('quiz-etymology');
            etymDiv.classList.remove('hidden');
            etymDiv.innerHTML = `<strong>Etymology:</strong> ${wordData.etymology}`;
        }

        // Update user progress
        this.userProgress.updateWordProgress(this.currentUser, word, correct);

        // Adjust difficulty
        if (correct) {
            this.quizState.difficultyRange[0] = Math.min(
                this.wordDB.getWordCount() - 100,
                this.quizState.difficultyRange[0] + 50
            );
            this.quizState.difficultyRange[1] = Math.min(
                this.wordDB.getWordCount() - 1,
                this.quizState.difficultyRange[1] + 50
            );
        } else {
            this.quizState.difficultyRange[0] = Math.max(0, this.quizState.difficultyRange[0] - 30);
            this.quizState.difficultyRange[1] = Math.max(100, this.quizState.difficultyRange[1] - 30);
        }

        // Show next button
        document.getElementById('next-question-btn').classList.remove('hidden');
    }

    /**
     * Next question
     */
    nextQuestion() {
        this.quizState.currentQuestion++;
        this.loadNextQuizQuestion();
    }

    /**
     * Show quiz results
     */
    showQuizResults() {
        const settings = this.userProgress.getSettings();
        const numQuestions = settings.questionsPerQuiz;

        // Update user's difficulty range and vocab level
        this.userProgress.updateDifficultyRange(this.currentUser, this.quizState.difficultyRange);
        const vocabLevel = Math.floor((this.quizState.difficultyRange[0] + this.quizState.difficultyRange[1]) / 2);
        this.userProgress.updateVocabularyLevel(this.currentUser, vocabLevel);

        // Add to history
        this.userProgress.addQuizToHistory(this.currentUser, {
            score: this.quizState.score,
            total: numQuestions,
            vocabLevel: vocabLevel
        });

        // Hide quiz content
        document.getElementById('quiz-content').classList.add('hidden');

        // Show results
        const resultsDiv = document.getElementById('quiz-results');
        resultsDiv.classList.remove('hidden');

        const percentage = ((this.quizState.score / numQuestions) * 100).toFixed(0);
        const statsDiv = document.getElementById('quiz-final-stats');
        statsDiv.innerHTML = `
            <div class="result-stat">Score: <strong>${this.quizState.score}/${numQuestions}</strong></div>
            <div class="result-stat">Percentage: <strong>${percentage}%</strong></div>
            <div class="result-stat">Updated Vocabulary Level: <strong>${vocabLevel}</strong></div>
            <div class="result-stat">Difficulty Range: <strong>${this.quizState.difficultyRange[0]}-${this.quizState.difficultyRange[1]}</strong></div>
        `;
    }

    /**
     * Start review mode
     */
    async startReviewMode() {
        const dueWords = this.userProgress.getWordsForReview(this.currentUser);

        this.reviewState = {
            words: dueWords,
            currentIndex: 0
        };

        this.showScreen('review');

        if (dueWords.length === 0) {
            document.getElementById('review-empty').classList.remove('hidden');
            document.getElementById('review-question').classList.add('hidden');
        } else {
            document.getElementById('review-empty').classList.add('hidden');
            document.getElementById('review-question').classList.remove('hidden');
            await this.loadNextReviewWord();
        }
    }

    /**
     * Load next review word
     */
    async loadNextReviewWord() {
        if (this.reviewState.currentIndex >= this.reviewState.words.length) {
            alert('Review complete! Great job!');
            this.showMainMenu();
            return;
        }

        // Update progress
        document.getElementById('review-progress-text').textContent =
            `Words remaining: ${this.reviewState.words.length - this.reviewState.currentIndex}`;

        const word = this.reviewState.words[this.reviewState.currentIndex];

        // Get word data
        document.getElementById('review-word').textContent = 'Loading...';
        const wordData = await this.wordDB.getWordData(word);

        if (!wordData || !wordData.definitions || wordData.definitions.length === 0) {
            this.reviewState.currentIndex++;
            await this.loadNextReviewWord();
            return;
        }

        // Display word
        document.getElementById('review-word').textContent = word.toUpperCase();
        document.getElementById('review-phonetic').textContent = wordData.phonetic;

        // Get correct definition
        const correctDef = wordData.definitions[0].definition;

        // Generate false definitions
        const falseDefs = this.wordDB.generateFalseDefinitions(word, correctDef);

        // Create options
        const options = [correctDef, ...falseDefs];
        const shuffledOptions = this.wordDB.shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(correctDef);

        // Display options
        const optionsDiv = document.getElementById('review-options');
        optionsDiv.innerHTML = '';

        shuffledOptions.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.handleReviewAnswer(index, correctIndex, word, wordData));
            optionsDiv.appendChild(btn);
        });

        // Hide feedback
        document.getElementById('review-feedback').classList.add('hidden');
        document.getElementById('review-next-btn').classList.add('hidden');
    }

    /**
     * Handle review answer
     */
    handleReviewAnswer(selectedIndex, correctIndex, word, wordData) {
        const correct = selectedIndex === correctIndex;

        // Disable all option buttons
        const buttons = document.querySelectorAll('#review-options .option-btn');
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === correctIndex) {
                btn.classList.add('correct');
            } else if (index === selectedIndex && !correct) {
                btn.classList.add('incorrect');
            }
        });

        // Show feedback
        const feedbackDiv = document.getElementById('review-feedback');
        feedbackDiv.classList.remove('hidden');
        feedbackDiv.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
        feedbackDiv.textContent = correct ? '✓ Correct!' : `✗ Incorrect. The correct answer was: ${wordData.definitions[0].definition}`;

        // Update user progress
        this.userProgress.updateWordProgress(this.currentUser, word, correct);

        // Show next button
        document.getElementById('review-next-btn').classList.remove('hidden');
    }

    /**
     * Next review word
     */
    nextReviewWord() {
        this.reviewState.currentIndex++;
        this.loadNextReviewWord();
    }

    /**
     * Start flashcard mode
     */
    async startFlashcardMode() {
        const wrongWords = this.userProgress.getRecentlyWrongWords(this.currentUser);

        this.flashcardState = {
            words: wrongWords,
            currentIndex: 0
        };

        this.showScreen('flashcard');

        if (wrongWords.length === 0) {
            document.getElementById('flashcard-empty').classList.remove('hidden');
            document.getElementById('flashcard-card').classList.add('hidden');
        } else {
            document.getElementById('flashcard-empty').classList.add('hidden');
            document.getElementById('flashcard-card').classList.remove('hidden');
            await this.loadNextFlashcard();
        }
    }

    /**
     * Load next flashcard
     */
    async loadNextFlashcard() {
        if (this.flashcardState.currentIndex >= this.flashcardState.words.length) {
            alert('Flashcard session complete!');
            this.showMainMenu();
            return;
        }

        // Update progress
        document.getElementById('flashcard-progress-text').textContent =
            `Card ${this.flashcardState.currentIndex + 1}/${this.flashcardState.words.length}`;

        const word = this.flashcardState.words[this.flashcardState.currentIndex];

        // Get word data
        const wordData = await this.wordDB.getWordData(word);

        if (!wordData || !wordData.definitions || wordData.definitions.length === 0) {
            this.flashcardState.currentIndex++;
            await this.loadNextFlashcard();
            return;
        }

        // Show front of card
        document.getElementById('flashcard-front').classList.remove('hidden');
        document.getElementById('flashcard-back').classList.add('hidden');

        document.getElementById('flashcard-word').textContent = word.toUpperCase();
        document.getElementById('flashcard-phonetic').textContent = wordData.phonetic;
        document.getElementById('flashcard-definition').textContent = wordData.definitions[0].definition;

        if (wordData.etymology) {
            document.getElementById('flashcard-etymology').innerHTML =
                `<strong>Etymology:</strong> ${wordData.etymology}`;
        } else {
            document.getElementById('flashcard-etymology').innerHTML = '';
        }

        // Store current word
        this.flashcardState.currentWord = word;
    }

    /**
     * Flip flashcard
     */
    flipFlashcard() {
        document.getElementById('flashcard-front').classList.add('hidden');
        document.getElementById('flashcard-back').classList.remove('hidden');
    }

    /**
     * Handle flashcard response
     */
    handleFlashcardResponse(correct) {
        this.userProgress.updateWordProgress(this.currentUser, this.flashcardState.currentWord, correct);
        this.flashcardState.currentIndex++;
        this.loadNextFlashcard();
    }

    /**
     * Show progress screen
     */
    showProgress() {
        const stats = this.userProgress.getStatistics(this.currentUser);
        const userData = this.userProgress.users[this.currentUser];

        const statsDiv = document.getElementById('progress-stats');
        statsDiv.innerHTML = `
            <div class="progress-section">
                <h3>Overview</h3>
                <div class="progress-item">
                    <span class="progress-label">Username:</span>
                    <span class="progress-value">${this.currentUser}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Member since:</span>
                    <span class="progress-value">${new Date(stats.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Vocabulary Level:</span>
                    <span class="progress-value">${stats.vocabularyLevel}</span>
                </div>
            </div>

            <div class="progress-section">
                <h3>Statistics</h3>
                <div class="progress-item">
                    <span class="progress-label">Words Learned:</span>
                    <span class="progress-value">${stats.wordsLearned}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Total Attempts:</span>
                    <span class="progress-value">${stats.totalAttempts}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Correct Answers:</span>
                    <span class="progress-value">${stats.totalCorrect}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Overall Accuracy:</span>
                    <span class="progress-value">${stats.accuracy}%</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Quizzes Taken:</span>
                    <span class="progress-value">${stats.quizzesTaken}</span>
                </div>
                <div class="progress-item">
                    <span class="progress-label">Words Due for Review:</span>
                    <span class="progress-value">${stats.dueForReview}</span>
                </div>
            </div>

            <div class="progress-section">
                <h3>Difficulty Range</h3>
                <div class="progress-item">
                    <span class="progress-label">Current Range:</span>
                    <span class="progress-value">${userData.currentDifficultyRange[0]} - ${userData.currentDifficultyRange[1]}</span>
                </div>
            </div>
        `;

        this.showScreen('progress');
    }

    /**
     * Show settings screen
     */
    showSettings() {
        const settings = this.userProgress.getSettings();
        document.getElementById('questions-per-quiz').value = settings.questionsPerQuiz;
        this.showScreen('settings');
    }

    /**
     * Handle reset progress
     */
    handleResetProgress() {
        if (confirm(`Are you sure you want to reset all progress for ${this.currentUser}? This cannot be undone.`)) {
            this.userProgress.resetProgress(this.currentUser);
            alert('Progress reset successfully!');
            this.showMainMenu();
        }
    }

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show selected screen
        const screen = document.getElementById(`${screenName}-screen`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenName;

            // Reset quiz results visibility
            if (screenName === 'quiz') {
                document.getElementById('quiz-content').classList.remove('hidden');
                document.getElementById('quiz-results').classList.add('hidden');
            }
        }

        // Hide header on login screen
        const header = document.getElementById('app-header');
        if (screenName === 'login') {
            header.style.display = 'none';
        } else {
            header.style.display = 'flex';
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocabApp();
});
