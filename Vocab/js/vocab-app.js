/**
 * Vocabulary Learning Application - Main Controller
 */

import { WordDatabase } from './word-database.js';
import { UserProgress } from './user-progress.js';
import { SpacedRepetition } from './spaced-repetition.js';
import { VocabFrontierEstimator } from './frontier-estimator.js';

class VocabApp {
    constructor() {
        this.wordDB = new WordDatabase();
        this.userProgress = new UserProgress();
        this.currentUser = null;
        this.currentScreen = 'login';

        // Quiz state
        this.quizState = {
            frontierEstimator: null,
            currentQuestion: 0,
            score: 0,
            totalAttempts: 0,
            startTime: null
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
        document.getElementById('stop-quiz-btn').addEventListener('click', () => this.stopQuiz());

        // Review screen
        document.getElementById('review-next-btn').addEventListener('click', () => this.nextReviewWord());

        // Flashcard screen
        document.getElementById('flip-card-btn').addEventListener('click', () => this.flipFlashcard());
        document.getElementById('flashcard-correct-btn').addEventListener('click', () => this.handleFlashcardResponse(true));
        document.getElementById('flashcard-wrong-btn').addEventListener('click', () => this.handleFlashcardResponse(false));

        // Settings
        document.getElementById('reset-progress-btn').addEventListener('click', () => this.handleResetProgress());
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
     * Start adaptive quiz with frontier estimation
     */
    async startAdaptiveQuiz() {
        // Initialize frontier estimator
        this.quizState = {
            frontierEstimator: new VocabFrontierEstimator(this.wordDB.getWordCount()),
            currentQuestion: 0,
            score: 0,
            totalAttempts: 0,
            startTime: Date.now()
        };

        this.showScreen('quiz');
        await this.loadNextQuizQuestion();
    }

    /**
     * Load next quiz question using frontier estimator
     */
    async loadNextQuizQuestion() {
        this.quizState.currentQuestion++;

        // Get stats for display
        const stats = this.quizState.frontierEstimator.getStatistics();

        // Update progress display
        document.getElementById('quiz-question-number').textContent =
            `Question ${this.quizState.currentQuestion}`;
        document.getElementById('quiz-score').textContent =
            `Score: ${this.quizState.score}/${this.quizState.totalAttempts}`;
        document.getElementById('quiz-frontier').textContent =
            `Frontier: ~${stats.estimatedLevel} (±${stats.uncertainty})`;

        // Get next word from frontier estimator
        const wordIndex = this.quizState.frontierEstimator.getNextWordIndex();
        const word = this.wordDB.getWordByIndex(wordIndex);

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
            btn.addEventListener('click', () => this.handleQuizAnswer(index, correctIndex, word, wordData, wordIndex));
            optionsDiv.appendChild(btn);
        });

        // Hide feedback and etymology
        document.getElementById('quiz-feedback').classList.add('hidden');
        document.getElementById('quiz-etymology').classList.add('hidden');
        document.getElementById('next-question-btn').classList.add('hidden');

        // Check if we should recommend stopping
        if (this.quizState.frontierEstimator.shouldRecommendStop()) {
            document.getElementById('stop-quiz-btn').textContent = '✓ Good job! Stop & See Results';
            document.getElementById('stop-quiz-btn').classList.add('btn-success');
            document.getElementById('stop-quiz-btn').classList.remove('btn-secondary');
        }
    }

    /**
     * Handle quiz answer with frontier estimation update
     */
    handleQuizAnswer(selectedIndex, correctIndex, word, wordData, wordIndex) {
        const correct = selectedIndex === correctIndex;

        // Update score and attempts
        this.quizState.totalAttempts++;
        if (correct) {
            this.quizState.score++;
        }

        // Update frontier estimator
        this.quizState.frontierEstimator.updateBelief(wordIndex, correct);

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

        // Update user progress for spaced repetition
        this.userProgress.updateWordProgress(this.currentUser, word, correct);

        // Show next button
        document.getElementById('next-question-btn').classList.remove('hidden');
    }

    /**
     * Next question
     */
    nextQuestion() {
        this.loadNextQuizQuestion();
    }

    /**
     * Stop quiz and show results
     */
    stopQuiz() {
        this.showQuizResults();
    }

    /**
     * Show quiz results with frontier analysis
     */
    showQuizResults() {
        // Get frontier statistics
        const stats = this.quizState.frontierEstimator.getStatistics();
        const frontier = this.quizState.frontierEstimator.getFrontierRange();

        // Calculate quiz duration
        const duration = Math.floor((Date.now() - this.quizState.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        // Update user's vocabulary level
        this.userProgress.updateVocabularyLevel(this.currentUser, stats.estimatedLevel);
        this.userProgress.updateDifficultyRange(this.currentUser, [frontier.min, frontier.max]);

        // Add to history
        this.userProgress.addQuizToHistory(this.currentUser, {
            score: this.quizState.score,
            total: this.quizState.totalAttempts,
            vocabLevel: stats.estimatedLevel,
            frontierRange: frontier,
            confidence: stats.confidence,
            duration: duration
        });

        // Hide quiz content and frontier info
        document.getElementById('quiz-content').classList.add('hidden');
        document.getElementById('quiz-frontier-info').classList.add('hidden');

        // Show results
        const resultsDiv = document.getElementById('quiz-results');
        resultsDiv.classList.remove('hidden');

        const percentage = ((this.quizState.score / this.quizState.totalAttempts) * 100).toFixed(1);

        const statsDiv = document.getElementById('quiz-final-stats');
        statsDiv.innerHTML = `
            <div class="result-section">
                <h3>📊 Performance</h3>
                <div class="result-stat">Questions Answered: <strong>${this.quizState.totalAttempts}</strong></div>
                <div class="result-stat">Correct: <strong>${this.quizState.score}</strong></div>
                <div class="result-stat">Accuracy: <strong>${percentage}%</strong></div>
                <div class="result-stat">Time: <strong>${minutes}:${seconds.toString().padStart(2, '0')}</strong></div>
            </div>

            <div class="result-section">
                <h3>🎯 Vocabulary Frontier Analysis</h3>
                <div class="result-stat">Estimated Frontier: <strong>${stats.estimatedLevel}</strong></div>
                <div class="result-stat">Frontier Range: <strong>${frontier.min} - ${frontier.max}</strong></div>
                <div class="result-stat">Uncertainty: <strong>±${frontier.uncertainty} words</strong></div>
                <div class="result-stat">Confidence: <strong>${stats.confidence}%</strong></div>
            </div>

            <div class="result-section">
                <h3>📈 Interpretation</h3>
                <div class="interpretation">
                    ${this.getInterpretation(stats.estimatedLevel, stats.confidence, percentage)}
                </div>
            </div>
        `;
    }

    /**
     * Get interpretation of quiz results
     */
    getInterpretation(level, confidence, accuracy) {
        let interpretation = `<p>Your vocabulary frontier is at approximately <strong>word ${level}</strong> in our frequency-sorted list.</p>`;

        if (level < 500) {
            interpretation += `<p>🌱 <strong>Foundational Level:</strong> You're building your core vocabulary. Focus on the most common words.</p>`;
        } else if (level < 1500) {
            interpretation += `<p>📚 <strong>Intermediate Level:</strong> You have a solid foundation! You know the most common words and are expanding into everyday vocabulary.</p>`;
        } else if (level < 2500) {
            interpretation += `<p>🎓 <strong>Advanced Level:</strong> Excellent! You have a strong vocabulary covering most common and many specialized words.</p>`;
        } else {
            interpretation += `<p>🏆 <strong>Expert Level:</strong> Outstanding! You have mastery over advanced and specialized vocabulary.</p>`;
        }

        if (confidence > 70) {
            interpretation += `<p>✅ <strong>High Confidence:</strong> We have a reliable estimate of your frontier (${confidence}% confidence).</p>`;
        } else if (confidence > 40) {
            interpretation += `<p>⚠️ <strong>Moderate Confidence:</strong> Continue the quiz or take another one to refine the estimate (${confidence}% confidence).</p>`;
        } else {
            interpretation += `<p>📊 <strong>Low Confidence:</strong> Take a longer quiz to get a more accurate frontier estimate (${confidence}% confidence).</p>`;
        }

        if (accuracy >= 40 && accuracy <= 70) {
            interpretation += `<p>🎯 <strong>Optimal Challenge:</strong> Your accuracy of ${accuracy}% shows we're testing at your true frontier!</p>`;
        } else if (accuracy > 70) {
            interpretation += `<p>⬆️ <strong>Room to Grow:</strong> Your high accuracy (${accuracy}%) suggests you could challenge yourself with harder words.</p>`;
        } else {
            interpretation += `<p>⬇️ <strong>Building Foundation:</strong> Focus on words in your current range to build confidence.</p>`;
        }

        return interpretation;
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

            // Reset quiz UI
            if (screenName === 'quiz') {
                document.getElementById('quiz-content').classList.remove('hidden');
                document.getElementById('quiz-results').classList.add('hidden');
                document.getElementById('quiz-frontier-info').classList.remove('hidden');

                // Reset stop button
                const stopBtn = document.getElementById('stop-quiz-btn');
                stopBtn.textContent = 'Stop Quiz & See Results';
                stopBtn.classList.remove('btn-success');
                stopBtn.classList.add('btn-secondary');
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
