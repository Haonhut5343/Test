/**
 * Popup Script: handles database status checking, interactive query testing (Phase 3 Checkpoint),
 * and user preferences.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const dbTiming = document.getElementById('dbTiming');
  const wordInput = document.getElementById('wordInput');
  const lookupBtn = document.getElementById('lookupBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const resultContent = document.getElementById('resultContent');
  const noResultContent = document.getElementById('noResultContent');
  const resultWord = document.getElementById('resultWord');
  const lemmaBadge = document.getElementById('lemmaBadge');
  const pronunciationsList = document.getElementById('pronunciationsList');
  const definitionsList = document.getElementById('definitionsList');
  const toggleSubtitle = document.getElementById('toggleSubtitle');
  const toggleAutoPause = document.getElementById('toggleAutoPause');
  const toggleSelectionLookup = document.getElementById('toggleSelectionLookup');
  const subtitleSizeSlider = document.getElementById('subtitleSizeSlider');
  const subtitleSizeVal = document.getElementById('subtitleSizeVal');
  const chips = document.querySelectorAll('.chip');
  const openFlashcardsBtn = document.getElementById('openFlashcardsBtn');
  const popupFlashcardCount = document.getElementById('popupFlashcardCount');
  const popupStarBtn = document.getElementById('popupStarBtn');
  let currentPopupResult = null;

  // PDF Reader button click & active tab detection
  const openPdfReaderBtn = document.getElementById('openPdfReaderBtn');
  const pdfReaderBtnText = document.getElementById('pdfReaderBtnText');
  let activeTabPdfUrl = null;

  try {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        if (activeTab && activeTab.url) {
          const url = activeTab.url.toLowerCase();
          if (url.endsWith('.pdf') || url.includes('.pdf?') || url.includes('.pdf#')) {
            activeTabPdfUrl = activeTab.url;
            if (pdfReaderBtnText) {
              pdfReaderBtnText.textContent = '⚡ Đọc PDF Này';
            }
            if (openPdfReaderBtn) {
              openPdfReaderBtn.title = 'Mở file PDF đang xem bằng SubDict Reader để bôi đen tra từ';
            }
          }
        }
      });
    }
  } catch (e) {}

  openPdfReaderBtn?.addEventListener('click', () => {
    if (activeTabPdfUrl) {
      chrome.tabs.create({ url: chrome.runtime.getURL(`PdfViewer/viewer.html?file=${encodeURIComponent(activeTabPdfUrl)}`) });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('PdfViewer/viewer.html') });
    }
  });

  // Flashcards button click
  openFlashcardsBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('Flashcards/flashcards.html') });
  });

  function updateFlashcardCount() {
    chrome.storage?.local?.get(['flashcards'], (items) => {
      const count = (items.flashcards || []).length;
      if (popupFlashcardCount) {
        popupFlashcardCount.textContent = `${count} từ`;
      }
    });
  }

  updateFlashcardCount();
  chrome.storage?.onChanged?.addListener((changes) => {
    if (changes.flashcards) {
      updateFlashcardCount();
    }
  });

  // Load saved settings
  chrome.storage?.local?.get(['enableSubtitle', 'autoPause', 'enableSelectionLookup', 'subtitleFontSize'], (items) => {
    if (items.enableSubtitle !== undefined) toggleSubtitle.checked = items.enableSubtitle;
    if (items.autoPause !== undefined) toggleAutoPause.checked = items.autoPause;
    if (items.enableSelectionLookup !== undefined) toggleSelectionLookup.checked = items.enableSelectionLookup;
    
    const size = (items.subtitleFontSize !== undefined && items.subtitleFontSize >= 50) ? items.subtitleFontSize : 100;
    subtitleSizeSlider.value = size;
    subtitleSizeVal.textContent = size === 100 ? '100% (Mặc định)' : `${size}%`;
  });

  toggleSubtitle.addEventListener('change', () => {
    chrome.storage?.local?.set({ enableSubtitle: toggleSubtitle.checked });
  });

  toggleAutoPause.addEventListener('change', () => {
    chrome.storage?.local?.set({ autoPause: toggleAutoPause.checked });
  });

  toggleSelectionLookup.addEventListener('change', () => {
    chrome.storage?.local?.set({ enableSelectionLookup: toggleSelectionLookup.checked });
  });

  subtitleSizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    subtitleSizeVal.textContent = size === 100 ? '100% (Mặc định)' : `${size}%`;
    chrome.storage?.local?.set({ subtitleFontSize: size });
  });

  // Check and initialize Database via background
  async function checkDbStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
      if (response && response.isReady) {
        setStatusReady(response.loadTimeMs, response.dbSizeBytes);
      } else {
        // Trigger initialization
        statusBadge.textContent = 'Đang nạp DB...';
        statusBadge.className = 'status-badge status-loading';
        const initRes = await chrome.runtime.sendMessage({ action: 'INIT_DB' });
        if (initRes && initRes.isReady) {
          setStatusReady(initRes.loadTimeMs, initRes.dbSizeBytes);
        } else {
          setStatusError(initRes?.error || 'Không thể mở SQLite DB');
        }
      }
    } catch (err) {
      console.warn('[Popup] Error checking DB status:', err);
      // Fallback: try INIT_DB
      try {
        const initRes = await chrome.runtime.sendMessage({ action: 'INIT_DB' });
        if (initRes && initRes.isReady) {
          setStatusReady(initRes.loadTimeMs, initRes.dbSizeBytes);
        } else {
          setStatusError(initRes?.error || err.message);
        }
      } catch (e) {
        setStatusError(e.message);
      }
    }
  }

  function setStatusReady(timeMs, sizeBytes) {
    statusBadge.textContent = 'Offline Sẵn Sàng';
    statusBadge.className = 'status-badge status-ready';
    const mb = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '42.2 MB';
    dbTiming.textContent = `Nạp trong ${timeMs || 0}ms (${mb})`;
  }

  function setStatusError(errorMsg) {
    statusBadge.textContent = 'Lỗi DB';
    statusBadge.className = 'status-badge status-error';
    dbTiming.textContent = `Lỗi: ${errorMsg}`;
  }

  // Lookup function
  async function doLookup(text) {
    const term = text.trim();
    if (!term) return;

    loadingSpinner.classList.remove('hidden');
    resultContent.classList.add('hidden');
    noResultContent.classList.add('hidden');

    const startTime = performance.now();

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'LOOKUP',
        text: term
      });

      loadingSpinner.classList.add('hidden');
      const elapsed = Math.round(performance.now() - startTime);

      if (response && response.success && response.result && response.result.found) {
        renderResult(response.result, elapsed);
      } else {
        noResultContent.classList.remove('hidden');
      }
    } catch (err) {
      loadingSpinner.classList.add('hidden');
      noResultContent.textContent = `Lỗi tra từ: ${err.message}`;
      noResultContent.classList.remove('hidden');
    }
  }

  function renderResult(result, elapsedMs) {
    resultWord.textContent = result.word;

    // Lemma badge
    if (result.isLemmaFallback && result.lemma) {
      lemmaBadge.textContent = `Gốc: ${result.lemma}`;
      lemmaBadge.classList.remove('hidden');
    } else {
      lemmaBadge.classList.add('hidden');
    }

    // Pronunciations
    pronunciationsList.innerHTML = '';
    if (result.pronunciations && result.pronunciations.length > 0) {
      result.pronunciations.forEach(p => {
        const pill = document.createElement('span');
        pill.className = 'ipa-pill';
        if (p.region) {
          pill.innerHTML = `<span class="region-tag">${escapeHtml(p.region)}</span>${escapeHtml(p.ipa)}`;
        } else {
          pill.textContent = p.ipa;
        }
        pronunciationsList.appendChild(pill);
      });
    }

    // Group definitions by POS
    definitionsList.innerHTML = '';
    const posGroups = {};
    (result.definitions || []).forEach(def => {
      const posKey = def.posLabel || def.pos || 'Khác';
      if (!posGroups[posKey]) posGroups[posKey] = [];
      posGroups[posKey].push(def);
    });

    for (const [posLabel, defs] of Object.entries(posGroups)) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'pos-group';

      const header = document.createElement('span');
      header.className = 'pos-header';
      header.textContent = posLabel;
      groupDiv.appendChild(header);

      defs.forEach(d => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'def-item';

        const defText = document.createElement('div');
        defText.className = 'def-text';
        defText.textContent = d.definition;
        itemDiv.appendChild(defText);

        if (d.example) {
          const exText = document.createElement('div');
          exText.className = 'def-example';
          exText.textContent = `"${d.example}"`;
          itemDiv.appendChild(exText);
        }

        groupDiv.appendChild(itemDiv);
      });

      definitionsList.appendChild(groupDiv);
    }

    resultContent.classList.remove('hidden');

    currentPopupResult = result;
    checkPopupWordSaved(result.word);
  }

  async function checkPopupWordSaved(word) {
    if (!popupStarBtn || !word) return;
    try {
      const res = await chrome.runtime.sendMessage({ action: 'CHECK_FLASHCARD', word });
      if (res?.isSaved) {
        popupStarBtn.className = 'popup-star-btn saved';
        popupStarBtn.textContent = '★ Đã lưu';
        popupStarBtn.title = 'Đã lưu trong Flashcard (Bấm để xóa)';
      } else {
        popupStarBtn.className = 'popup-star-btn';
        popupStarBtn.textContent = '☆ Lưu từ';
        popupStarBtn.title = 'Thêm vào Flashcard';
      }
    } catch (err) {}
  }

  popupStarBtn?.addEventListener('click', async () => {
    if (!currentPopupResult) return;
    const isSaved = popupStarBtn.classList.contains('saved');
    if (isSaved) {
      await chrome.runtime.sendMessage({ action: 'REMOVE_FLASHCARD', word: currentPopupResult.word });
      popupStarBtn.className = 'popup-star-btn';
      popupStarBtn.textContent = '☆ Lưu từ';
      popupStarBtn.title = 'Thêm vào Flashcard';
    } else {
      const card = {
        word: currentPopupResult.word,
        ipa: currentPopupResult.pronunciations?.[0]?.ipa || '',
        region: currentPopupResult.pronunciations?.[0]?.region || null,
        pos: currentPopupResult.definitions?.[0]?.posLabel || currentPopupResult.definitions?.[0]?.pos || '',
        definitions: currentPopupResult.definitions || [],
        lemma: currentPopupResult.isLemmaFallback ? currentPopupResult.lemma : null
      };
      await chrome.runtime.sendMessage({ action: 'SAVE_FLASHCARD', card });
      popupStarBtn.className = 'popup-star-btn saved';
      popupStarBtn.textContent = '★ Đã lưu';
      popupStarBtn.title = 'Đã lưu trong Flashcard (Bấm để xóa)';
    }
    updateFlashcardCount();
  });

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Event handlers
  lookupBtn.addEventListener('click', () => doLookup(wordInput.value));
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLookup(wordInput.value);
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const word = chip.dataset.word;
      wordInput.value = word;
      doLookup(word);
    });
  });

  // Initial check & lookup word from URL or default 'hello'
  const urlParams = new URLSearchParams(window.location.search);
  const paramWord = urlParams.get('word');
  const initialWord = (paramWord && paramWord.trim()) ? paramWord.trim() : 'hello';
  wordInput.value = initialWord;

  if (isWindowMode) {
    document.body.classList.add('subdict-window-mode');
    // Auto-close window when user clicks elsewhere / loses focus (quá trình lùi ra sau Edge)
    window.addEventListener('blur', () => {
      setTimeout(() => {
        window.close();
      }, 120);
    });
  }

  await checkDbStatus();
  doLookup(initialWord);
  if (paramWord) {
    wordInput.select();
  }
});
