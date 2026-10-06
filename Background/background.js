/**
 * Background Service Worker (Manifest V3)
 * Loads sql.js and dictionary_en_vi.db to serve offline lookups to Content Scripts and Popup.
 */

// Import sql.js and dictionary engine
importScripts('../Lib/sql-wasm.js', '../Lib/dictionary.js');

let engine = null;
let initPromise = null;
let statusInfo = {
    isReady: false,
    error: null,
    loadTimeMs: 0,
    dbSizeBytes: 0
};

/**
 * Initialize Dictionary Engine
 */
async function getOrInitEngine() {
    if (engine && engine.isReady) {
        return engine;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log('[Background] Initializing DictionaryEngine...');
            const startTime = Date.now();

            const wasmUrl = chrome.runtime.getURL('Lib/sql-wasm.wasm');
            const dbUrl = chrome.runtime.getURL('Database/dictionary_en_vi.db');

            console.log('[Background] Fetching database file...');
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();

            engine = new DictionaryEngine();
            const initRes = await engine.init({
                wasmUrl,
                dbBuffer: new Uint8Array(buffer)
            });

            statusInfo = {
                isReady: true,
                error: null,
                loadTimeMs: Date.now() - startTime,
                dbSizeBytes: buffer.byteLength
            };

            console.log(`[Background] DictionaryEngine ready in ${statusInfo.loadTimeMs}ms (${(statusInfo.dbSizeBytes / (1024*1024)).toFixed(2)} MB)`);
            return engine;
        } catch (err) {
            console.error('[Background] Failed to initialize DictionaryEngine:', err);
            statusInfo = {
                isReady: false,
                error: err.message,
                loadTimeMs: 0,
                dbSizeBytes: 0
            };
            engine = null;
            initPromise = null;
            throw err;
        }
    })();

    return initPromise;
}

// Pre-warm engine on install or startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Background] Extension installed, pre-warming dictionary database...');
    getOrInitEngine().catch(e => console.warn('[Background] Pre-warm failed:', e));
});

chrome.runtime.onStartup.addListener(() => {
    console.log('[Background] Browser started, pre-warming dictionary database...');
    getOrInitEngine().catch(e => console.warn('[Background] Pre-warm failed:', e));
});

// 1. Keep-Alive Port connection from content scripts (prevents SW idle termination)
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'subdict_keepalive') {
        port.onMessage.addListener(() => {});
        // Keep engine ready while any tab is connected
        if (!engine || !engine.isReady) {
            getOrInitEngine().catch(() => {});
        }
    }
});

// 2. Keep-Alive Alarm (fires every 20 seconds to prevent service worker unloading)
try {
    chrome.alarms.create('subdict_keepalive_alarm', { periodInMinutes: 0.35 });
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'subdict_keepalive_alarm') {
            getOrInitEngine().catch(() => {});
        }
    });
} catch (e) {}

// 3. Pre-warm whenever user interacts with tabs (switches tab, opens tab)
if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(() => {
        if (!engine || !engine.isReady) {
            getOrInitEngine().catch(() => {});
        }
    });
}
if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === 'loading') {
            if (!engine || !engine.isReady) {
                getOrInitEngine().catch(() => {});
            }
        }
    });
}

// Handle incoming messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const action = message?.action;

    if (action === 'PING') {
        sendResponse({ status: 'ok', isReady: statusInfo.isReady });
        return false;
    }

    if (action === 'GET_STATUS') {
        sendResponse(statusInfo);
        return false;
    }

    if (action === 'INIT_DB') {
        getOrInitEngine()
            .then(() => sendResponse(statusInfo))
            .catch(err => sendResponse({ isReady: false, error: err.message }));
        return true; // Keep channel open for async response
    }

    if (action === 'LOOKUP') {
        getOrInitEngine()
            .then(eng => {
                const result = eng.lookup(message.text);
                sendResponse({ success: true, result });
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (action === 'MATCH_PHRASES') {
        getOrInitEngine()
            .then(eng => {
                const segments = eng.matchPhrasesInTokens(message.tokens || [], message.maxPhraseLength || 5);
                const definitionsMap = {};
                for (const seg of segments) {
                    if (seg.lookupKey && !definitionsMap[seg.lookupKey]) {
                        definitionsMap[seg.lookupKey] = eng.lookup(seg.lookupKey);
                    }
                }
                sendResponse({ success: true, segments, definitionsMap });
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (action === 'BATCH_LOOKUP') {
        getOrInitEngine()
            .then(eng => {
                const results = {};
                for (const word of (message.words || [])) {
                    results[word] = eng.lookup(word);
                }
                sendResponse({ success: true, results });
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // --- FLASHCARD ACTIONS ---
    if (action === 'OPEN_FLASHCARDS_PAGE') {
        const url = chrome.runtime.getURL('Flashcards/flashcards.html');
        chrome.tabs.create({ url });
        sendResponse({ success: true });
        return false;
    }

    if (action === 'GET_FLASHCARDS') {
        chrome.storage.local.get(['flashcards'], (items) => {
            sendResponse({ success: true, flashcards: items.flashcards || [] });
        });
        return true;
    }

    if (action === 'CHECK_FLASHCARD') {
        const word = (message.word || '').trim().toLowerCase();
        chrome.storage.local.get(['flashcards'], (items) => {
            const list = items.flashcards || [];
            const found = list.find(c => c.cleanWord === word);
            sendResponse({ isSaved: Boolean(found), card: found || null });
        });
        return true;
    }

    if (action === 'SAVE_FLASHCARD') {
        const card = message.card;
        if (!card || !card.word) {
            sendResponse({ success: false, error: 'Thiếu dữ liệu từ vựng' });
            return false;
        }
        chrome.storage.local.get(['flashcards'], (items) => {
            let list = items.flashcards || [];
            const cleanWord = card.word.trim().toLowerCase();
            const existingIndex = list.findIndex(c => c.cleanWord === cleanWord);

            const newCard = {
                id: card.id || `fc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                word: card.word.trim(),
                cleanWord,
                ipa: card.ipa || '',
                region: card.region || null,
                lemma: card.lemma || null,
                pos: card.pos || '',
                definitions: card.definitions || [],
                status: card.status || 'learning',
                reviewCount: card.reviewCount || 0,
                lastReviewed: card.lastReviewed || null,
                addedAt: card.addedAt || Date.now(),
                sourceUrl: card.sourceUrl || '',
                sourceTitle: card.sourceTitle || ''
            };

            if (existingIndex >= 0) {
                list[existingIndex] = { ...list[existingIndex], ...newCard };
            } else {
                list.unshift(newCard);
            }

            chrome.storage.local.set({ flashcards: list }, () => {
                sendResponse({ success: true, count: list.length, card: newCard });
            });
        });
        return true;
    }

    if (action === 'REMOVE_FLASHCARD') {
        const word = (message.word || '').trim().toLowerCase();
        chrome.storage.local.get(['flashcards'], (items) => {
            let list = items.flashcards || [];
            list = list.filter(c => c.cleanWord !== word && c.id !== message.id);
            chrome.storage.local.set({ flashcards: list }, () => {
                sendResponse({ success: true, count: list.length });
            });
        });
        return true;
    }

    if (action === 'UPDATE_FLASHCARD_STATUS') {
        const { id, status } = message;
        chrome.storage.local.get(['flashcards'], (items) => {
            const list = items.flashcards || [];
            const card = list.find(c => c.id === id);
            if (card) {
                card.status = status;
                card.reviewCount = (card.reviewCount || 0) + 1;
                card.lastReviewed = Date.now();
                chrome.storage.local.set({ flashcards: list }, () => {
                    sendResponse({ success: true, card });
                });
            } else {
                sendResponse({ success: false, error: 'Không tìm thấy thẻ' });
            }
        });
        return true;
    }

    return false;
});
