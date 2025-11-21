/**
 * Adaptive Vocabulary Frontier Estimator
 * Uses Bayesian-style statistical inference to estimate user's vocabulary frontier
 */

export class VocabFrontierEstimator {
    constructor(totalWords = 3500) {
        this.totalWords = totalWords;

        // Initialize with 12th-grade level assumption
        // 12th grade typically knows ~15,000-20,000 words
        // In our sorted list, that's roughly index 1800-2200
        this.mean = 2000;  // Current estimate of frontier
        this.variance = 500 * 500;  // Uncertainty (std dev = 500)

        // Track history for better inference
        this.responses = [];  // [{wordIndex, correct, timestamp}]
        this.consecutiveCorrect = 0;
        this.consecutiveIncorrect = 0;

        // Learning rate parameters
        this.learningRate = 0.3;  // How quickly we update beliefs
        this.explorationRate = 0.2;  // How much we explore vs exploit
    }

    /**
     * Get the next word index to test based on current frontier estimate
     * Uses Thompson sampling to balance exploration and exploitation
     */
    getNextWordIndex() {
        // Sample from our belief distribution (Gaussian)
        const sample = this.sampleFromBelief();

        // Add exploration noise
        const exploration = (Math.random() - 0.5) * Math.sqrt(this.variance) * this.explorationRate;

        // Target the frontier with some exploration
        let targetIndex = Math.floor(sample + exploration);

        // If we're getting lots of correct answers, push higher
        if (this.consecutiveCorrect >= 3) {
            targetIndex += Math.floor(Math.sqrt(this.variance) * 0.5);
        }

        // If we're getting lots of wrong answers, pull lower
        if (this.consecutiveIncorrect >= 3) {
            targetIndex -= Math.floor(Math.sqrt(this.variance) * 0.5);
        }

        // Clamp to valid range
        targetIndex = Math.max(0, Math.min(this.totalWords - 1, targetIndex));

        return targetIndex;
    }

    /**
     * Sample from our current belief distribution (Gaussian)
     */
    sampleFromBelief() {
        // Box-Muller transform for Gaussian sampling
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        return this.mean + z * Math.sqrt(this.variance);
    }

    /**
     * Update beliefs based on user's response
     * Uses Bayesian update with logistic model
     * @param {number} wordIndex - Index of the word tested
     * @param {boolean} correct - Whether user got it correct
     */
    updateBelief(wordIndex, correct) {
        // Record response
        this.responses.push({
            wordIndex,
            correct,
            timestamp: Date.now()
        });

        // Update consecutive counters
        if (correct) {
            this.consecutiveCorrect++;
            this.consecutiveIncorrect = 0;
        } else {
            this.consecutiveIncorrect++;
            this.consecutiveCorrect = 0;
        }

        // Calculate prediction error
        // If we got it right, our frontier estimate should be below this word
        // If we got it wrong, our frontier estimate should be above this word
        const distanceFromMean = wordIndex - this.mean;

        // Use a logistic-style update
        // P(correct | wordIndex) ≈ sigmoid((mean - wordIndex) / scale)
        const scale = Math.sqrt(this.variance);
        const expectedProb = this.logistic(-distanceFromMean / scale);
        const actualOutcome = correct ? 1 : 0;
        const predictionError = actualOutcome - expectedProb;

        // Update mean (shift frontier estimate)
        const meanUpdate = this.learningRate * predictionError * scale;
        this.mean += meanUpdate;

        // Update variance (reduce uncertainty with more data)
        // Variance should decrease as we get more confident
        const varianceReduction = Math.abs(predictionError) * this.learningRate * 100;
        this.variance = Math.max(100 * 100, this.variance - varianceReduction);

        // Also update based on distance from frontier
        if (correct && wordIndex > this.mean) {
            // They know words beyond our estimate - boost mean
            this.mean += (wordIndex - this.mean) * this.learningRate * 0.5;
        } else if (!correct && wordIndex < this.mean) {
            // They don't know words below our estimate - lower mean
            this.mean -= (this.mean - wordIndex) * this.learningRate * 0.5;
        }

        // Clamp mean to valid range
        this.mean = Math.max(100, Math.min(this.totalWords - 100, this.mean));

        // Recalculate variance based on recent performance spread
        if (this.responses.length >= 5) {
            this.updateVarianceFromHistory();
        }
    }

    /**
     * Update variance based on recent response history
     * Higher variance if responses are inconsistent
     */
    updateVarianceFromHistory() {
        const recentResponses = this.responses.slice(-10);  // Last 10 responses

        // Calculate spread of correct vs incorrect responses
        const correctIndices = recentResponses.filter(r => r.correct).map(r => r.wordIndex);
        const incorrectIndices = recentResponses.filter(r => !r.correct).map(r => r.wordIndex);

        if (correctIndices.length > 0 && incorrectIndices.length > 0) {
            const maxCorrect = Math.max(...correctIndices);
            const minIncorrect = Math.min(...incorrectIndices);

            // If there's overlap (knowing hard words but not knowing easier ones),
            // increase variance
            if (maxCorrect > minIncorrect) {
                const overlap = maxCorrect - minIncorrect;
                this.variance = Math.max(this.variance, overlap * overlap);
            } else {
                // Clear frontier - reduce variance
                const gap = minIncorrect - maxCorrect;
                if (gap < Math.sqrt(this.variance)) {
                    this.variance *= 0.95;  // Slowly reduce
                }
            }
        }
    }

    /**
     * Logistic function for probability calculation
     */
    logistic(x) {
        return 1 / (1 + Math.exp(-x));
    }

    /**
     * Get probability that user knows a word at given index
     * @param {number} wordIndex
     * @returns {number} Probability between 0 and 1
     */
    getProbabilityKnown(wordIndex) {
        const distance = this.mean - wordIndex;
        const scale = Math.sqrt(this.variance);
        return this.logistic(distance / scale);
    }

    /**
     * Get the frontier range (words with ~40-60% probability of knowing)
     * @returns {Object} {min, max, center}
     */
    getFrontierRange() {
        const stdDev = Math.sqrt(this.variance);

        return {
            min: Math.floor(this.mean - stdDev),
            max: Math.floor(this.mean + stdDev),
            center: Math.floor(this.mean),
            uncertainty: Math.floor(stdDev)
        };
    }

    /**
     * Get statistics about current estimate
     * @returns {Object}
     */
    getStatistics() {
        const frontier = this.getFrontierRange();
        const recentResponses = this.responses.slice(-10);
        const recentAccuracy = recentResponses.length > 0
            ? (recentResponses.filter(r => r.correct).length / recentResponses.length * 100).toFixed(1)
            : 0;

        return {
            estimatedLevel: Math.floor(this.mean),
            confidence: Math.floor(100 / (1 + this.variance / 10000)),  // 0-100 scale
            frontierMin: frontier.min,
            frontierMax: frontier.max,
            uncertainty: frontier.uncertainty,
            totalResponses: this.responses.length,
            recentAccuracy: parseFloat(recentAccuracy),
            consecutiveCorrect: this.consecutiveCorrect,
            consecutiveIncorrect: this.consecutiveIncorrect
        };
    }

    /**
     * Check if we should recommend stopping the quiz
     * (high confidence in estimate)
     * @returns {boolean}
     */
    shouldRecommendStop() {
        // Recommend stopping if:
        // 1. We have at least 15 responses
        // 2. Variance is low (confident in estimate)
        // 3. Recent accuracy is around 50-70% (at the frontier)

        if (this.responses.length < 15) return false;

        const stats = this.getStatistics();
        const varianceThreshold = 300 * 300;
        const isConfident = this.variance < varianceThreshold;
        const recentAccuracy = stats.recentAccuracy;
        const atFrontier = recentAccuracy >= 40 && recentAccuracy <= 75;

        return isConfident && atFrontier;
    }

    /**
     * Export state for saving
     * @returns {Object}
     */
    export() {
        return {
            mean: this.mean,
            variance: this.variance,
            responses: this.responses,
            consecutiveCorrect: this.consecutiveCorrect,
            consecutiveIncorrect: this.consecutiveIncorrect
        };
    }

    /**
     * Import state from saved data
     * @param {Object} state
     */
    import(state) {
        this.mean = state.mean || this.mean;
        this.variance = state.variance || this.variance;
        this.responses = state.responses || [];
        this.consecutiveCorrect = state.consecutiveCorrect || 0;
        this.consecutiveIncorrect = state.consecutiveIncorrect || 0;
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.mean = 2000;
        this.variance = 500 * 500;
        this.responses = [];
        this.consecutiveCorrect = 0;
        this.consecutiveIncorrect = 0;
    }
}
