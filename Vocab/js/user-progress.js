/**
 * User Progress Management using localStorage
 */

import { SpacedRepetition } from './spaced-repetition.js';

export class UserProgress {
    constructor() {
        this.storageKey = 'vocabAppUsers';
        this.settingsKey = 'vocabAppSettings';
        this.users = this.loadData();
        this.currentUser = null;
    }

    /**
     * Load all users from localStorage
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading user data:', error);
            return {};
        }
    }

    /**
     * Save users to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    /**
     * Get or create a user
     * @param {string} username
     * @returns {Object} User data
     */
    getOrCreateUser(username) {
        if (!this.users[username]) {
            this.users[username] = {
                username: username,
                createdAt: new Date().toISOString(),
                vocabularyLevel: 0,
                wordsLearned: {},
                currentDifficultyRange: [0, 100],
                quizHistory: []
            };
            this.saveData();
        }
        this.currentUser = username;
        return this.users[username];
    }

    /**
     * Update progress for a word
     * @param {string} username
     * @param {string} word
     * @param {boolean} correct
     */
    updateWordProgress(username, word, correct) {
        const user = this.getOrCreateUser(username);

        if (!user.wordsLearned[word]) {
            user.wordsLearned[word] = SpacedRepetition.getInitialParameters();
        }

        const wordData = user.wordsLearned[word];
        wordData.attempts++;
        if (correct) {
            wordData.correctCount++;
        }

        // Update spaced repetition parameters
        const srData = SpacedRepetition.calculateNextReview(
            wordData.easeFactor,
            wordData.interval,
            correct
        );

        wordData.easeFactor = srData.easeFactor;
        wordData.interval = srData.interval;
        wordData.nextReview = srData.nextReview;
        wordData.lastReviewed = new Date().toISOString();

        this.saveData();
    }

    /**
     * Get words due for review
     * @param {string} username
     * @returns {Array} Array of words
     */
    getWordsForReview(username) {
        const user = this.getOrCreateUser(username);
        const dueWords = [];

        for (const [word, data] of Object.entries(user.wordsLearned)) {
            if (SpacedRepetition.isDue(data.nextReview)) {
                dueWords.push(word);
            }
        }

        return dueWords;
    }

    /**
     * Get recently wrong words for flashcards
     * @param {string} username
     * @param {number} limit
     * @returns {Array} Array of words
     */
    getRecentlyWrongWords(username, limit = 20) {
        const user = this.getOrCreateUser(username);
        const wrongWords = [];

        for (const [word, data] of Object.entries(user.wordsLearned)) {
            if (data.attempts > 0) {
                const successRate = data.correctCount / data.attempts;
                if (successRate < 0.7) {
                    wrongWords.push({
                        word,
                        successRate,
                        lastReviewed: data.lastReviewed
                    });
                }
            }
        }

        // Sort by last reviewed (most recent first)
        wrongWords.sort((a, b) =>
            new Date(b.lastReviewed) - new Date(a.lastReviewed)
        );

        return wrongWords.slice(0, limit).map(w => w.word);
    }

    /**
     * Update difficulty range
     * @param {string} username
     * @param {Array} range - [min, max]
     */
    updateDifficultyRange(username, range) {
        const user = this.getOrCreateUser(username);
        user.currentDifficultyRange = range;
        this.saveData();
    }

    /**
     * Update vocabulary level
     * @param {string} username
     * @param {number} level
     */
    updateVocabularyLevel(username, level) {
        const user = this.getOrCreateUser(username);
        user.vocabularyLevel = level;
        this.saveData();
    }

    /**
     * Add quiz to history
     * @param {string} username
     * @param {Object} quizData
     */
    addQuizToHistory(username, quizData) {
        const user = this.getOrCreateUser(username);
        user.quizHistory.push({
            ...quizData,
            date: new Date().toISOString()
        });
        this.saveData();
    }

    /**
     * Get user statistics
     * @param {string} username
     * @returns {Object}
     */
    getStatistics(username) {
        const user = this.getOrCreateUser(username);
        const wordsLearned = Object.keys(user.wordsLearned).length;

        let totalAttempts = 0;
        let totalCorrect = 0;

        for (const data of Object.values(user.wordsLearned)) {
            totalAttempts += data.attempts;
            totalCorrect += data.correctCount;
        }

        const accuracy = totalAttempts > 0
            ? ((totalCorrect / totalAttempts) * 100).toFixed(1)
            : 0;

        const dueWords = this.getWordsForReview(username);

        return {
            wordsLearned,
            vocabularyLevel: user.vocabularyLevel,
            totalAttempts,
            totalCorrect,
            accuracy,
            dueForReview: dueWords.length,
            createdAt: user.createdAt,
            quizzesTaken: user.quizHistory.length
        };
    }

    /**
     * Reset user progress
     * @param {string} username
     */
    resetProgress(username) {
        if (this.users[username]) {
            delete this.users[username];
            this.saveData();
        }
    }

    /**
     * Get app settings
     * @returns {Object}
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : {
                questionsPerQuiz: 10
            };
        } catch (error) {
            return { questionsPerQuiz: 10 };
        }
    }

    /**
     * Save app settings
     * @param {Object} settings
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
}
