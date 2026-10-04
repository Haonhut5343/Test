/**
 * Dictionary Engine using sql.js (WebAssembly SQLite)
 * Handles offline lookup of English-Vietnamese definitions, pronunciations,
 * multi-word phrases, and inflection fallback.
 */

class DictionaryEngine {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.isReady = false;
        this.loadTimeMs = 0;
        this.cache = new Map(); // Query cache for fast response
        this.wordExistsStmt = null;
        this.exactLookupStmt = null;
    }

    /**
     * Initialize sql.js and load the SQLite database
     * @param {Object} options
     * @param {string} options.wasmUrl - URL to sql-wasm.wasm
     * @param {string} [options.dbUrl] - URL to fetch dictionary_en_vi.db
     * @param {Uint8Array} [options.dbBuffer] - Preloaded buffer
     */
    async init({ wasmUrl, dbUrl, dbBuffer }) {
        const startTime = Date.now();

        // 1. Initialize sql.js
        if (typeof initSqlJs !== 'function') {
            throw new Error('initSqlJs is not defined. Ensure sql-wasm.js is loaded first.');
        }

        this.SQL = await initSqlJs({
            locateFile: () => wasmUrl
        });

        // 2. Load database buffer
        let buffer = dbBuffer;
        if (!buffer && dbUrl) {
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch database: HTTP ${response.status} ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = new Uint8Array(arrayBuffer);
        }

        if (!buffer) {
            throw new Error('No database buffer or URL provided to DictionaryEngine');
        }

        // 3. Open SQLite Database
        this.db = new this.SQL.Database(buffer);
        this.loadTimeMs = Date.now() - startTime;
        this.isReady = true;

        // 4. Prepare reusable statements
        this.exactLookupStmt = this.db.prepare(`
            SELECT 
                w.id AS word_id,
                w.word,
                p.ipa,
                p.region,
                d.id AS definition_id,
                d.definition,
                d.pos,
                d.sub_pos,
                wd.example
            FROM words w
            LEFT JOIN pronunciations p ON w.id = p.word_id
            LEFT JOIN word_definitions wd ON w.id = wd.word_id
            LEFT JOIN definitions d ON wd.definition_id = d.id
            WHERE w.word = :word AND w.lang_code = 'en'
        `);

        this.wordExistsStmt = this.db.prepare(`
            SELECT id, word FROM words WHERE word = :word AND lang_code = 'en' LIMIT 1
        `);

        return {
            ready: true,
            loadTimeMs: this.loadTimeMs,
            dbSizeBytes: buffer.byteLength
        };
    }

    /**
     * Fast check if a word or phrase exists in the dictionary
     * @param {string} text
     * @returns {boolean}
     */
    hasWord(text) {
        if (!this.isReady || !text) return false;
        const normalized = text.trim().toLowerCase();
        
        if (this.cache.has(normalized)) {
            const cached = this.cache.get(normalized);
            return cached.found;
        }

        this.wordExistsStmt.bind({ ':word': normalized });
        const exists = this.wordExistsStmt.step();
        this.wordExistsStmt.reset();
        return exists;
    }

    /**
     * Query exact word or phrase from database
     * @param {string} text
     * @returns {Array<Object>} rows
     */
    queryRows(text) {
        if (!this.isReady) return [];
        this.exactLookupStmt.bind({ ':word': text });
        const rows = [];
        while (this.exactLookupStmt.step()) {
            rows.push(this.exactLookupStmt.getAsObject());
        }
        this.exactLookupStmt.reset();
        return rows;
    }

    /**
     * Map POS abbreviation to human readable label
     * @param {string} pos
     * @returns {string}
     */
    static getPosLabel(pos) {
        const map = {
            'N': 'Noun (Danh từ)',
            'V': 'Verb (Động từ)',
            'A': 'Adjective (Tính từ)',
            'ADV': 'Adverb (Trạng từ)',
            'P': 'Preposition (Giới từ)',
            'PRON': 'Pronoun (Đại từ)',
            'CONJ': 'Conjunction (Liên từ)',
            'INTERJ': 'Interjection (Thán từ)',
            'O': 'Other (Khác / Thành ngữ)',
            'PHRASE': 'Phrase (Cụm từ)'
        };
        return map[pos?.toUpperCase()] || pos || 'Nghĩa';
    }

    /**
     * Validate that an IPA string is a clean phonetic representation without HTML or noise
     * @param {string} ipa
     * @returns {boolean}
     */
    static isValidIpa(ipa) {
        if (!ipa || typeof ipa !== 'string') return false;
        const trimmed = ipa.trim();
        if (!trimmed.startsWith('/') || !trimmed.endsWith('/') || trimmed.length < 3 || trimmed.length > 40) return false;
        if (/[<>&;=]/.test(trimmed)) return false;
        if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(trimmed)) return false;
        if ((trimmed.match(/\//g) || []).length !== 2) return false;
        return true;
    }

    /**
     * Format raw database rows into clean structured output
     * @param {string} query
     * @param {string} matchedWord
     * @param {Array<Object>} rows
     * @param {string|null} fallbackLemma
     */
    formatResult(query, matchedWord, rows, fallbackLemma = null, rootRows = []) {
        if (!rows || rows.length === 0) {
            return {
                found: false,
                query,
                word: query,
                pronunciations: [],
                definitions: []
            };
        }

        // Deduplicate pronunciations
        const pronMap = new Map();
        for (const row of rows) {
            if (row.ipa && DictionaryEngine.isValidIpa(row.ipa)) {
                const key = `${row.ipa}_${row.region || ''}`;
                if (!pronMap.has(key)) {
                    pronMap.set(key, {
                        ipa: row.ipa,
                        region: row.region ? row.region.toUpperCase() : null
                    });
                }
            }
        }

        // If this word has no IPA, inherit from rootRows if available
        if (pronMap.size === 0 && rootRows && rootRows.length > 0) {
            for (const row of rootRows) {
                if (row.ipa && DictionaryEngine.isValidIpa(row.ipa)) {
                    const key = `${row.ipa}_${row.region || ''}`;
                    if (!pronMap.has(key)) {
                        pronMap.set(key, {
                            ipa: row.ipa,
                            region: row.region ? row.region.toUpperCase() : null
                        });
                    }
                }
            }
        }

        // Deduplicate definitions
        const defMap = new Map();
        for (const row of rows) {
            if (row.definition) {
                const key = `${row.pos}_${row.definition}`;
                if (!defMap.has(key)) {
                    defMap.set(key, {
                        pos: row.pos,
                        posLabel: DictionaryEngine.getPosLabel(row.pos),
                        sub_pos: row.sub_pos,
                        definition: row.definition,
                        example: row.example || null
                    });
                }
            }
        }

        // Deduplicate root word definitions
        const rootDefMap = new Map();
        if (rootRows && rootRows.length > 0) {
            for (const row of rootRows) {
                if (row.definition) {
                    const key = `${row.pos}_${row.definition}`;
                    if (!rootDefMap.has(key) && !defMap.has(key)) {
                        rootDefMap.set(key, {
                            pos: row.pos,
                            posLabel: DictionaryEngine.getPosLabel(row.pos),
                            sub_pos: row.sub_pos,
                            definition: row.definition,
                            example: row.example || null
                        });
                    }
                }
            }
        }

        return {
            found: true,
            query,
            word: matchedWord,
            isLemmaFallback: Boolean(fallbackLemma),
            lemma: fallbackLemma,
            rootWord: fallbackLemma,
            pronunciations: Array.from(pronMap.values()),
            definitions: Array.from(defMap.values()),
            rootDefinitions: Array.from(rootDefMap.values())
        };
    }

    /**
     * Extract referral root word from grammatical definition strings
     * E.g. "Dạng quá khứ đơn và phân từ quá khứ của square" -> "square"
     * E.g. "cấp so sánh của good" -> "good"
     * E.g. "số nhiều của man" -> "man"
     * @param {string} word - The current queried word
     * @param {Array<Object>} rows - Database rows for this word
     * @returns {string|null} - Valid root word in DB or null
     */
    extractReferralRootWord(word, rows) {
        if (!rows || rows.length === 0) return null;

        const referralRegex = /(?:dạng\s+)?(?:quá\s+khứ|phân\s+từ|hiện\s+tại|thời\s+hiện\s+tại|ngôi\s+thứ|số\s+nhiều|so\s+sánh|cấp\s+so\s+sánh|nguyên\s+mẫu|viết\s+tắt|biến\s+thể|danh\s+động\s+từ)[^.:;]*?\bcủa\s+(?:từ\s+)?([a-zA-Z][a-zA-Z0-9'’-]*)/i;

        const lowerWord = word.toLowerCase();

        for (const row of rows) {
            if (!row.definition) continue;
            const match = row.definition.match(referralRegex);
            if (match && match[1]) {
                const candidate = match[1].toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
                if (candidate && candidate !== lowerWord && this.hasWord(candidate)) {
                    return candidate;
                }
            }
        }
        return null;
    }

    /**
     * Generate common English inflection candidate lemmas
     * Exact lookup is ALWAYS performed first, this is only a fallback.
     * @param {string} word
     * @returns {Array<string>}
     */
    getLemmaCandidates(word) {
        const w = word.toLowerCase();
        const candidates = new Set();

        // 1. -ing suffix
        if (w.endsWith('ing') && w.length > 4) {
            const base = w.slice(0, -3);
            candidates.add(base);          // looking -> look
            candidates.add(base + 'e');     // making -> make, dancing -> dance
            if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
                candidates.add(base.slice(0, -1)); // running -> run, swimming -> swim
            }
            if (w.endsWith('ying') && w.length > 4) {
                candidates.add(w.slice(0, -4) + 'ie'); // lying -> lie, dying -> die
            }
        }

        // 2. -ed suffix
        if (w.endsWith('ed') && w.length > 3) {
            const base = w.slice(0, -2);
            candidates.add(base);          // looked -> look
            candidates.add(w.slice(0, -1)); // loved -> love
            if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
                candidates.add(base.slice(0, -1)); // stopped -> stop
            }
            if (w.endsWith('ied') && w.length > 4) {
                candidates.add(w.slice(0, -3) + 'y'); // studied -> study
            }
        }

        // 3. -s / -es / -ies suffix
        if (w.endsWith('ies') && w.length > 4) {
            candidates.add(w.slice(0, -3) + 'y'); // flies -> fly, tries -> try
        } else if (w.endsWith('es') && w.length > 3) {
            candidates.add(w.slice(0, -2));       // watches -> watch, boxes -> box
            candidates.add(w.slice(0, -1));       // takes -> take
        } else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 2) {
            candidates.add(w.slice(0, -1));       // runs -> run, books -> book
        }

        // 4. -ly adverb suffix
        if (w.endsWith('ly') && w.length > 4) {
            candidates.add(w.slice(0, -2));       // quickly -> quick
            if (w.endsWith('ily') && w.length > 4) {
                candidates.add(w.slice(0, -3) + 'y'); // happily -> happy
            }
        }

        // 5. -er / -est comparatives
        if (w.endsWith('er') && w.length > 3) {
            candidates.add(w.slice(0, -2));       // faster -> fast
            candidates.add(w.slice(0, -1));       // nicer -> nice
        }
        if (w.endsWith('est') && w.length > 4) {
            candidates.add(w.slice(0, -3));       // fastest -> fast
            candidates.add(w.slice(0, -2));       // nicest -> nice
        }

        return Array.from(candidates);
    }

    /**
     * Primary lookup method:
     * 1. Exact match (case-insensitive)
     * 2. Lemma / inflection fallback
     * 3. Result caching for speed
     * @param {string} text
     * @returns {Object} Structured dictionary result
     */
    lookup(text) {
        if (!this.isReady || !text) {
            return { found: false, query: text, word: text, pronunciations: [], definitions: [] };
        }

        // Normalize text
        const cleaned = text.trim().toLowerCase().replace(/^[^\w\s]+|[^\w\s]+$/g, '');
        if (!cleaned) {
            return { found: false, query: text, word: text, pronunciations: [], definitions: [] };
        }

        // Check memory cache
        if (this.cache.has(cleaned)) {
            return this.cache.get(cleaned);
        }

        // 1. Exact match
        let rows = this.queryRows(cleaned);
        if (rows.length > 0) {
            // Check if definition is a referral to a root word (e.g. squared -> square)
            let detectedRoot = this.extractReferralRootWord(cleaned, rows);
            let rootRows = [];
            if (detectedRoot) {
                rootRows = this.queryRows(detectedRoot);
            }

            // If this word has no valid pronunciations, inherit IPA from lemma candidate (e.g. scripts -> script)
            const hasPron = rows.some(r => r.ipa && DictionaryEngine.isValidIpa(r.ipa));
            if (!hasPron && !cleaned.includes(' ')) {
                const candidates = this.getLemmaCandidates(cleaned);
                for (const cand of candidates) {
                    const candRows = this.queryRows(cand);
                    if (candRows.some(r => r.ipa && DictionaryEngine.isValidIpa(r.ipa))) {
                        rootRows = rootRows.concat(candRows);
                        if (!detectedRoot) detectedRoot = cand;
                        break;
                    }
                }
            }

            const result = this.formatResult(text, cleaned, rows, detectedRoot, rootRows);
            this.cache.set(cleaned, result);
            return result;
        }

        // 2. Lemma fallback (only for single words or uninflected phrases)
        if (!cleaned.includes(' ')) {
            const candidates = this.getLemmaCandidates(cleaned);
            for (const lemma of candidates) {
                rows = this.queryRows(lemma);
                if (rows.length > 0) {
                    const result = this.formatResult(text, cleaned, rows, lemma, []);
                    this.cache.set(cleaned, result);
                    return result;
                }
            }
        }

        // Not found
        const notFound = {
            found: false,
            query: text,
            word: cleaned,
            pronunciations: [],
            definitions: []
        };
        this.cache.set(cleaned, notFound);
        return notFound;
    }

    /**
     * Parse sentence tokens and greedily match longest phrases first
     * @param {Array<string>} words
     * @param {number} maxPhraseLength
     * @returns {Array<Object>} matched segments
     */
    matchPhrasesInTokens(tokens, maxPhraseLength = 5) {
        const segments = [];
        let i = 0;

        while (i < tokens.length) {
            let matched = false;

            // Try phrase lengths from maxPhraseLength down to 2
            const currentMax = Math.min(maxPhraseLength, tokens.length - i);
            for (let len = currentMax; len >= 2; len--) {
                const phraseSlice = tokens.slice(i, i + len);
                const phraseText = phraseSlice.map(t => t.text.toLowerCase().replace(/[^\w]/g, '')).filter(Boolean).join(' ');
                
                if (phraseText && this.hasWord(phraseText)) {
                    segments.push({
                        type: 'phrase',
                        text: phraseSlice.map(t => t.text).join(' '),
                        lookupKey: phraseText,
                        tokens: phraseSlice,
                        startIndex: i,
                        endIndex: i + len - 1
                    });
                    i += len;
                    matched = true;
                    break;
                }
            }

            // If no phrase found, check single token
            if (!matched) {
                const token = tokens[i];
                const cleanWord = token.text.toLowerCase().replace(/[^\w]/g, '');
                const hasMatch = cleanWord ? (this.hasWord(cleanWord) || this.lookup(cleanWord).found) : false;

                segments.push({
                    type: 'word',
                    text: token.text,
                    lookupKey: cleanWord,
                    isRecognized: hasMatch,
                    tokens: [token],
                    startIndex: i,
                    endIndex: i
                });
                i += 1;
            }
        }

        return segments;
    }

    /**
     * Close database and free resources
     */
    close() {
        if (this.exactLookupStmt) {
            try { this.exactLookupStmt.free(); } catch (e) {}
        }
        if (this.wordExistsStmt) {
            try { this.wordExistsStmt.free(); } catch (e) {}
        }
        if (this.db) {
            try { this.db.close(); } catch (e) {}
        }
        this.isReady = false;
        this.cache.clear();
    }
}

// Support both Browser / Extension and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DictionaryEngine;
}
if (typeof window !== 'undefined') {
    window.DictionaryEngine = DictionaryEngine;
}
if (typeof self !== 'undefined') {
    self.DictionaryEngine = DictionaryEngine;
}
