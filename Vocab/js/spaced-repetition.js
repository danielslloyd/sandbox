/**
 * Spaced Repetition Algorithm (SM-2 inspired)
 */

export class SpacedRepetition {
    /**
     * Calculate next review parameters
     * @param {number} easeFactor - Current ease factor (1.3 - 4.0)
     * @param {number} interval - Current interval in days
     * @param {boolean} correct - Whether the answer was correct
     * @returns {Object} - New ease factor, interval, and next review date
     */
    static calculateNextReview(easeFactor, interval, correct) {
        let newEase, newInterval;

        if (correct) {
            // Increase ease factor and interval for correct answers
            newEase = Math.max(1.3, easeFactor + 0.1);
            newInterval = Math.max(1, Math.floor(interval * newEase));
        } else {
            // Decrease ease factor and reset interval for incorrect answers
            newEase = Math.max(1.3, easeFactor - 0.2);
            newInterval = 1; // Reset to 1 day
        }

        // Cap ease factor at 4.0
        newEase = Math.min(4.0, newEase);

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        return {
            easeFactor: newEase,
            interval: newInterval,
            nextReview: nextReview.toISOString()
        };
    }

    /**
     * Check if a word is due for review
     * @param {string} nextReviewDate - ISO date string
     * @returns {boolean}
     */
    static isDue(nextReviewDate) {
        const now = new Date();
        const reviewDate = new Date(nextReviewDate);
        return reviewDate <= now;
    }

    /**
     * Get initial parameters for a new word
     * @returns {Object}
     */
    static getInitialParameters() {
        return {
            easeFactor: 2.5,
            interval: 1,
            nextReview: new Date().toISOString(),
            attempts: 0,
            correctCount: 0,
            firstSeen: new Date().toISOString(),
            lastReviewed: new Date().toISOString()
        };
    }
}
