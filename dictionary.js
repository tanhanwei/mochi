// Common English words list - just most frequent 1000 words for performance
const commonEnglishWords = new Set([
    "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at","this",
    "but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what",
    "so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know",
    "take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come",
    "its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want",
    "because","any","these","give","day","most","us"
    // ... add more common words as needed
]);

// Basic proper name detection rules
const properNameRules = {
    startsWithCapital: (word) => /^[A-Z][a-z]+$/.test(word),
    hasInternalCaps: (word) => /^[A-Z][a-z]+[A-Z][a-z]+$/.test(word),
    isAcronym: (word) => /^[A-Z]{2,}$/.test(word)
};

// Cache for word lookups
const wordCache = new Map();

export async function isEnglishWord(word) {
    // Normalize the word
    word = word.trim().toLowerCase();
    
    // Check cache first
    if (wordCache.has(word)) {
        return wordCache.get(word);
    }

    // Check common words list first (fast)
    if (commonEnglishWords.has(word)) {
        wordCache.set(word, true);
        return true;
    }

    // Check if it's a number
    if (/^\d+$/.test(word)) {
        wordCache.set(word, true);
        return true;
    }

    try {
        // Use browser's built-in spell checker if available
        if (window.Intl && Intl.Segmenter) {
            const checker = new Intl.Segmenter('en', { granularity: 'word' });
            const segments = Array.from(checker.segment(word));
            if (segments.length === 1) {
                const result = true; // Word is valid if it's a single segment
                wordCache.set(word, result);
                return result;
            }
        }
    } catch (e) {
        console.warn('Spell checker not available:', e);
    }

    // Fallback to basic rules
    const isBasicWord = /^[a-z]+(-[a-z]+)*$/i.test(word) && word.length > 1;
    wordCache.set(word, isBasicWord);
    return isBasicWord;
}

export function isProperName(word) {
    return Object.values(properNameRules).some(rule => rule(word));
}

export function analyzeText(text) {
    const words = text.split(/\s+/);
    const nonEnglishWords = [];
    const properNames = [];

    for (const word of words) {
        if (word.length <= 1) continue;
        
        const cleanWord = word.replace(/[.,!?;:'"()[\]{}]/g, '');
        if (cleanWord.length <= 1) continue;

        if (isProperName(cleanWord)) {
            properNames.push(cleanWord);
        } else if (!isEnglishWord(cleanWord)) {
            nonEnglishWords.push(cleanWord);
        }
    }

    return {
        nonEnglishWords: [...new Set(nonEnglishWords)],
        properNames: [...new Set(properNames)]
    };
}
