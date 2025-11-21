/**
 * Word Database - Manages words, definitions, and API calls
 */

export class WordDatabase {
    constructor() {
        this.words = [];
        this.cache = this.loadCache();
        this.llmDefinitions = {};
        this.cacheKey = 'vocabWordCache';
    }

    /**
     * Load words from JSON file
     */
    async loadWords() {
        try {
            const response = await fetch('data/words_by_frequency.json');
            this.words = await response.json();
            return this.words;
        } catch (error) {
            console.error('Error loading words:', error);
            return [];
        }
    }

    /**
     * Load LLM-generated false definitions
     */
    async loadLLMDefinitions() {
        try {
            const response = await fetch('data/llm_false_definitions.json');
            if (response.ok) {
                this.llmDefinitions = await response.json();
            }
        } catch (error) {
            // LLM definitions are optional, ignore errors
            console.log('LLM definitions not available');
        }
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const cache = localStorage.getItem(this.cacheKey);
            return cache ? JSON.parse(cache) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache() {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    /**
     * Get word data from API or cache
     * @param {string} word
     * @returns {Promise<Object>}
     */
    async getWordData(word) {
        // Check cache first
        if (this.cache[word]) {
            return this.cache[word];
        }

        try {
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
            );

            if (!response.ok) {
                throw new Error('Word not found');
            }

            const data = await response.json();
            const entry = data[0];

            // Extract definitions
            const definitions = [];
            for (const meaning of entry.meanings || []) {
                for (const definition of meaning.definitions || []) {
                    definitions.push({
                        partOfSpeech: meaning.partOfSpeech || 'unknown',
                        definition: definition.definition || '',
                        example: definition.example || ''
                    });
                }
            }

            // Create word data object
            const wordData = {
                word: word,
                definitions: definitions,
                etymology: entry.origin || 'Etymology not available',
                phonetic: entry.phonetic || entry.phonetics?.[0]?.text || ''
            };

            // Cache it
            this.cache[word] = wordData;
            this.saveCache();

            return wordData;
        } catch (error) {
            console.error(`Error fetching data for '${word}':`, error);
            return null;
        }
    }

    /**
     * Generate false definitions
     * @param {string} word
     * @param {string} correctDef
     * @returns {Array<string>}
     */
    generateFalseDefinitions(word, correctDef) {
        // Check if we have LLM-generated definitions for this word
        if (this.llmDefinitions[word]) {
            return this.llmDefinitions[word].slice(0, 3);
        }

        // Otherwise use template-based generation
        return this.generateSimpleFalseDefinitions(word, correctDef);
    }

    /**
     * Generate simple template-based false definitions
     * @param {string} word
     * @param {string} correctDef
     * @returns {Array<string>}
     */
    generateSimpleFalseDefinitions(word, correctDef) {
        // Get random words for substitution
        const randomWords = this.getRandomWords(10);

        const templates = [
            `The act of ${this.randomChoice(['creating', 'destroying', 'modifying', 'organizing', 'arranging'])} ${this.randomChoice(randomWords)}`,
            `A person who ${this.randomChoice(['studies', 'collects', 'avoids', 'creates', 'examines'])} ${this.randomChoice(randomWords)}`,
            `Relating to or characteristic of ${this.randomChoice(randomWords)}`,
            `The state of being ${this.randomChoice(['extremely', 'moderately', 'slightly', 'particularly'])} ${this.randomChoice(['confused', 'happy', 'tired', 'energetic', 'motivated'])}`,
            `A tool used for ${this.randomChoice(['measuring', 'cutting', 'joining', 'separating', 'analyzing'])} ${this.randomChoice(randomWords)}`,
            `The process of ${this.randomChoice(['transforming', 'analyzing', 'combining', 'dividing'])} something into ${this.randomChoice(randomWords)}`,
            `An ancient practice involving ${this.randomChoice(randomWords)} and ${this.randomChoice(['meditation', 'ritual', 'celebration', 'ceremony'])}`,
            `The scientific study of ${this.randomChoice(randomWords)} in relation to ${this.randomChoice(['nature', 'society', 'culture', 'history'])}`,
            `A condition characterized by excessive ${this.randomChoice(randomWords)}`,
            `The philosophical concept that ${this.randomChoice(randomWords)} determines ${this.randomChoice(['reality', 'truth', 'morality', 'existence'])}`
        ];

        // Shuffle and take 3
        return this.shuffleArray(templates).slice(0, 3);
    }

    /**
     * Get random words from the list
     * @param {number} count
     * @returns {Array<string>}
     */
    getRandomWords(count) {
        const maxIndex = Math.min(1000, this.words.length);
        const randomWords = [];
        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * maxIndex);
            randomWords.push(this.words[index]);
        }
        return randomWords;
    }

    /**
     * Random choice from array
     * @param {Array} array
     * @returns {*}
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Shuffle array
     * @param {Array} array
     * @returns {Array}
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * Get random word from difficulty range
     * @param {number} minIndex
     * @param {number} maxIndex
     * @returns {string}
     */
    getRandomWord(minIndex, maxIndex) {
        const min = Math.max(0, minIndex);
        const max = Math.min(maxIndex, this.words.length - 1);
        const index = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.words[index];
    }

    /**
     * Get word by index
     * @param {number} index
     * @returns {string}
     */
    getWordByIndex(index) {
        return this.words[index] || this.words[0];
    }

    /**
     * Get total word count
     * @returns {number}
     */
    getWordCount() {
        return this.words.length;
    }
}
