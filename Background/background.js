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

// Setup Context Menu for PDF & Web selection lookup
function setupContextMenu() {
    if (!chrome.contextMenus) return;
    try {
        chrome.contextMenus.removeAll(() => {
            // 1. Text Selection Lookup
            chrome.contextMenus.create({
                id: 'subdict_lookup_selection',
                title: 'Tra từ điển SubDict: "%s"',
                contexts: ['selection']
            }, () => {
                if (chrome.runtime.lastError) {}
            });

            // 2. Open PDF Links in SubDict PDF Reader
            chrome.contextMenus.create({
                id: 'subdict_open_pdf_link',
                title: '📖 Mở bằng SubDict PDF Reader',
                contexts: ['link'],
                targetUrlPatterns: ['*://*/*.pdf*', '*://*/*pdf*']
            }, () => {
                if (chrome.runtime.lastError) {}
            });
        });
    } catch (e) {
        console.warn('[Background] Setup context menu error:', e);
    }
}

// Pre-warm engine on install or startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Background] Extension installed, pre-warming dictionary database...');
    setupContextMenu();
    getOrInitEngine().catch(e => console.warn('[Background] Pre-warm failed:', e));
});

chrome.runtime.onStartup.addListener(() => {
    console.log('[Background] Browser started, pre-warming dictionary database...');
    setupContextMenu();
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

    // --- PDF READER ACTIONS ---
    if (action === 'OPEN_PDF_VIEWER') {
        const fileUrl = message.fileUrl;
        const url = fileUrl
            ? chrome.runtime.getURL(`PdfViewer/viewer.html?file=${encodeURIComponent(fileUrl)}`)
            : chrome.runtime.getURL('PdfViewer/viewer.html');
        chrome.tabs.create({ url });
        sendResponse({ success: true });
        return false;
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

// Context Menu selection click handler (supports PDFs and web pages)
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        // Open PDF Link directly in SubDict PDF Reader
        if (info.menuItemId === 'subdict_open_pdf_link') {
            const fileUrl = info.linkUrl;
            if (fileUrl) {
                const viewerUrl = chrome.runtime.getURL(`PdfViewer/viewer.html?file=${encodeURIComponent(fileUrl)}`);
                chrome.tabs.create({ url: viewerUrl });
            }
            return;
        }

        if (info.menuItemId === 'subdict_lookup_selection') {
            const rawText = (info.selectionText || '').trim();
            if (!rawText) return;

            // Instant dictionary lookup
            let result = null;
            try {
                const eng = await getOrInitEngine();
                result = eng.lookup(rawText);
            } catch (err) {
                console.error('[Background] Context lookup error:', err);
            }

            // Attempt delivery to content script on active tab
            let delivered = false;
            if (tab && tab.id) {
                try {
                    const res = await chrome.tabs.sendMessage(tab.id, {
                        action: 'SHOW_CONTEXT_LOOKUP',
                        text: rawText,
                        result: result
                    });
                    if (res && res.success) {
                        delivered = true;
                    }
                } catch (e) {
                    // Content script not present (e.g. PDF viewer, chrome internal pages)
                    delivered = false;
                }
            }

            // Fallback for PDF viewers, chrome:// pages, or restricted pages:
            // Open lightweight mini popup window with the exact word lookup
            if (!delivered) {
                const popupUrl = chrome.runtime.getURL(`Popup/popup.html?word=${encodeURIComponent(rawText)}&mode=popup`);
                const width = 450;
                const height = 560;
                const left = Math.max(80, (tab?.width ? tab.width - width - 60 : 300));
                const top = 100;

                chrome.windows.create({
                    url: popupUrl,
                    type: 'popup',
                    width,
                    height,
                    left,
                    top,
                    focused: true
                });
            }
        }
    });
}

