/**
 * SubDict PDF Reader Script
 * - Uses PDF.js to render PDF pages with 100% native HTML TextLayer
 * - Mouse selection triggers instant offline dictionary lookup (0ms)
 * - Click outside immediately closes tooltip
 * - Alt + S / Alt + D to save/remove Flashcard
 * - Supports drag-and-drop, local files, and online PDF URLs
 */

(function () {
  'use strict';

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  }

  // State
  let currentPdf = null;
  let totalPages = 0;
  let currentPage = 1;
  let currentScale = 1.25;
  let currentScaleMode = 'page-width';
  let renderedPages = new Map(); // pageNum -> { page, rendered: bool }

  // Tooltip & Flashcard State
  let tooltip = null;
  let isSelectionLookupActive = false;
  let currentLookupResult = null;
  let isCurrentWordSaved = false;
  let savedFlashcardsSet = new Set();
  const localLookupCache = new Map();

  // UI Elements
  const dropZone = document.getElementById('dropZone');
  const viewerContainer = document.getElementById('viewerContainer');
  const pdfViewer = document.getElementById('pdfViewer');
  const fileInput = document.getElementById('pdfFileInput');
  const openUrlBtn = document.getElementById('openUrlBtn');
  const urlInputBar = document.getElementById('urlInputBar');
  const pdfUrlInput = document.getElementById('pdfUrlInput');
  const loadUrlBtn = document.getElementById('loadUrlBtn');
  const cancelUrlBtn = document.getElementById('cancelUrlBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageNumberInput = document.getElementById('pageNumberInput');
  const totalPagesText = document.getElementById('totalPagesText');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const scaleSelect = document.getElementById('scaleSelect');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const openFlashcardsBtn = document.getElementById('openFlashcardsBtn');

  // Flashcards storage sync
  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['flashcards'], (items) => {
        const list = items.flashcards || [];
        savedFlashcardsSet = new Set(list.map(it => (it.word || '').toLowerCase()));
      });
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.flashcards) {
          const list = changes.flashcards.newValue || [];
          savedFlashcardsSet = new Set(list.map(it => (it.word || '').toLowerCase()));
          updateStarButtonState();
        }
      });
    }
  } catch (err) {}

  openFlashcardsBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('Flashcards/flashcards.html') });
  });

  // -------------------------------------------------------------
  // Tooltip Rendering & Positioning
  // -------------------------------------------------------------
  function createTooltip() {
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.id = 'subdict-tooltip';
    document.body.appendChild(tooltip);

    tooltip.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    return tooltip;
  }

  function showTooltipToast(msg) {
    if (!tooltip) return;
    let toast = tooltip.querySelector('.subdict-tt-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'subdict-tt-toast';
      tooltip.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2200);
  }

  function updateStarButtonState() {
    if (!tooltip) return;
    const btn = tooltip.querySelector('#subdictStarBtn');
    if (!btn) return;
    if (isCurrentWordSaved) {
      btn.className = 'subdict-tt-star-btn saved';
      btn.innerHTML = '★ Đã lưu <span style="font-size:10px;opacity:0.8;margin-left:2px;">(Alt+S)</span>';
      btn.title = 'Đã lưu trong Flashcard (Alt + S để xóa)';
    } else {
      btn.className = 'subdict-tt-star-btn';
      btn.innerHTML = '☆ Lưu từ <span style="font-size:10px;opacity:0.8;margin-left:2px;">(Alt+S)</span>';
      btn.title = 'Thêm vào Flashcard (Alt + S hoặc Alt + D)';
    }
  }

  async function toggleFlashcard(result) {
    if (!result || !result.word) return;

    if (isCurrentWordSaved) {
      try {
        await chrome.runtime.sendMessage({ action: 'REMOVE_FLASHCARD', word: result.word });
        isCurrentWordSaved = false;
        updateStarButtonState();
        showTooltipToast('Đã xóa khỏi Flashcard');
      } catch (err) {
        showTooltipToast('Lỗi: ' + err.message);
      }
    } else {
      let allDefs = [...(result.definitions || [])];
      if (result.rootDefinitions && result.rootDefinitions.length > 0) {
        allDefs = allDefs.concat(result.rootDefinitions);
      }

      const card = {
        word: result.word,
        ipa: result.pronunciations?.[0]?.ipa || '',
        region: result.pronunciations?.[0]?.region || null,
        pos: result.definitions?.[0]?.posLabel || result.definitions?.[0]?.pos || '',
        definitions: allDefs,
        lemma: result.lemma || null,
        sourceUrl: window.location.href,
        sourceTitle: document.title || 'SubDict PDF Reader'
      };

      try {
        const res = await chrome.runtime.sendMessage({ action: 'SAVE_FLASHCARD', card });
        if (res?.success) {
          isCurrentWordSaved = true;
          updateStarButtonState();
          showTooltipToast('⭐ Đã thêm vào Flashcard!');
        }
      } catch (err) {
        showTooltipToast('Lỗi: ' + err.message);
      }
    }
  }

  function renderTooltipContent(result) {
    if (!tooltip) return;
    currentLookupResult = result;
    isCurrentWordSaved = savedFlashcardsSet.has((result?.word || '').toLowerCase());

    if (!result || !result.found) {
      tooltip.innerHTML = `
        <div class="subdict-tt-header">
          <div class="subdict-tt-top-line">
            <span class="subdict-tt-word">${escapeHtml(result?.query || 'Không tìm thấy')}</span>
          </div>
        </div>
        <div class="subdict-tt-body">
          <div class="subdict-tt-meaning">Không có trong từ điển offline.</div>
        </div>
      `;
      return;
    }

    const lemmaHtml = result.lemma && result.lemma.toLowerCase() !== result.word.toLowerCase()
      ? `<span class="subdict-tt-lemma">Gốc: ${escapeHtml(result.lemma)}</span>`
      : '';

    let ipaHtml = '';
    if (result.pronunciations && result.pronunciations.length > 0) {
      ipaHtml = `<div class="subdict-tt-ipa-group">` +
        result.pronunciations.map(p => `
          <span class="subdict-tt-ipa">
            ${p.region ? `<span class="subdict-tt-region">${escapeHtml(p.region)}</span>` : ''}${escapeHtml(p.ipa)}
          </span>
        `).join('') +
        `</div>`;
    }

    const posGroups = {};
    (result.definitions || []).forEach(def => {
      const key = def.posLabel || def.pos || 'Khác';
      if (!posGroups[key]) posGroups[key] = [];
      posGroups[key].push(def);
    });

    let defsHtml = '<div class="subdict-tt-body">';
    for (const [posLabel, items] of Object.entries(posGroups)) {
      defsHtml += `
        <div class="subdict-tt-pos-group">
          <span class="subdict-tt-pos">${escapeHtml(posLabel)} (${items.length})</span>
          ${items.map(it => `
            <div class="subdict-tt-def-item">
              <span class="subdict-tt-meaning">${escapeHtml(it.definition)}</span>
              ${it.example ? `<span class="subdict-tt-example">"${escapeHtml(it.example)}"</span>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (result.rootDefinitions && result.rootDefinitions.length > 0) {
      const rootPosGroups = {};
      result.rootDefinitions.forEach(def => {
        const key = def.posLabel || def.pos || 'Khác';
        if (!rootPosGroups[key]) rootPosGroups[key] = [];
        rootPosGroups[key].push(def);
      });

      defsHtml += `
        <div class="subdict-tt-root-section">
          <div class="subdict-tt-root-header">
            <span class="subdict-tt-root-badge">Từ gốc</span>
            <span class="subdict-tt-root-name">${escapeHtml(result.lemma || result.rootWord)}</span>
          </div>
      `;

      for (const [posLabel, items] of Object.entries(rootPosGroups)) {
        defsHtml += `
          <div class="subdict-tt-pos-group">
            <span class="subdict-tt-pos">${escapeHtml(posLabel)} (${items.length})</span>
            ${items.map(it => `
              <div class="subdict-tt-def-item">
                <span class="subdict-tt-meaning">${escapeHtml(it.definition)}</span>
                ${it.example ? `<span class="subdict-tt-example">"${escapeHtml(it.example)}"</span>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      defsHtml += `</div>`;
    }
    defsHtml += '</div>';

    tooltip.innerHTML = `
      <div class="subdict-tt-header">
        <div class="subdict-tt-top-line">
          <span class="subdict-tt-word">${escapeHtml(result.word)}</span>
          ${lemmaHtml}
          ${ipaHtml}
          <button id="subdictStarBtn" class="subdict-tt-star-btn">☆ Lưu từ</button>
        </div>
      </div>
      ${defsHtml}
    `;

    updateStarButtonState();

    const starBtn = tooltip.querySelector('#subdictStarBtn');
    starBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFlashcard(result);
    });
  }

  function positionTooltip(rect) {
    if (!tooltip) return;
    const tooltipWidth = 460;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const approxHeight = tooltip.offsetHeight > 50 ? tooltip.offsetHeight : 220;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let top;
    if (spaceAbove >= approxHeight + 15) {
      top = rect.top - approxHeight - 10;
    } else if (spaceBelow >= approxHeight + 15) {
      top = rect.bottom + 10;
    } else {
      top = spaceAbove >= spaceBelow ? Math.max(10, rect.top - approxHeight - 10) : rect.bottom + 10;
    }

    top = Math.max(10, Math.min(viewportHeight - approxHeight - 10, top));

    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    left = Math.max(12, Math.min(viewportWidth - tooltipWidth - 12, left));

    tooltip.style.position = 'fixed';
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.style.bottom = 'auto';
    tooltip.style.transform = 'none';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // -------------------------------------------------------------
  // Text Selection & Mouse Listeners
  // -------------------------------------------------------------
  function setupSelectionListeners() {
    document.addEventListener('mouseup', (e) => {
      if (tooltip?.contains(e.target)) return;

      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';

        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (text && wordCount >= 1 && wordCount <= 6 && text.length <= 60) {
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              isSelectionLookupActive = true;
              showSelectionPopup(text, rect);
              return;
            }
          } catch (err) {}
        }

        // If clicked elsewhere with no selection, close tooltip
        if (!tooltip?.contains(e.target) && isSelectionLookupActive) {
          tooltip?.classList.remove('visible');
          isSelectionLookupActive = false;
        }
      }, 30);
    });

    document.addEventListener('mousedown', (e) => {
      if (tooltip && !tooltip.contains(e.target)) {
        const sel = window.getSelection();
        if (!sel || !sel.toString().trim()) {
          tooltip.classList.remove('visible');
          isSelectionLookupActive = false;
        }
      }
    });

    // Keyboard shortcut (Alt + S / Alt + D to save flashcard)
    window.addEventListener('keydown', (e) => {
      if (!tooltip || !tooltip.classList.contains('visible') || !currentLookupResult || !currentLookupResult.found) {
        return;
      }

      const isAltS = e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S');
      const isAltD = e.altKey && (e.code === 'KeyD' || e.key === 'd' || e.key === 'D');
      if (isAltS || isAltD) {
        e.preventDefault();
        e.stopPropagation();
        toggleFlashcard(currentLookupResult);
      }
    }, true);
  }

  async function showSelectionPopup(text, rect) {
    createTooltip();

    const normalized = text.trim().toLowerCase().replace(/^[^\w\s'-]+|[^\w\s'-]+$/g, '');

    // Fast Path (0ms local cache)
    if (localLookupCache.has(normalized)) {
      renderTooltipContent(localLookupCache.get(normalized));
      positionTooltip(rect);
      tooltip.classList.add('visible');
      return;
    }

    tooltip.innerHTML = `
      <div class="subdict-tt-header">
        <div class="subdict-tt-top-line">
          <span class="subdict-tt-word">${escapeHtml(text)}</span>
        </div>
      </div>
      <div class="subdict-tt-body">
        <div class="subdict-tt-meaning">Đang tra cứu từ điển offline...</div>
      </div>
    `;
    positionTooltip(rect);
    tooltip.classList.add('visible');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'LOOKUP',
        text
      });

      if (response && response.success) {
        localLookupCache.set(normalized, response.result);
        renderTooltipContent(response.result);
        positionTooltip(rect);
      }
    } catch (err) {
      tooltip.innerHTML = `<div class="subdict-tt-meaning">Lỗi tra cứu: ${escapeHtml(err.message)}</div>`;
    }
  }

  // -------------------------------------------------------------
  // PDF Rendering Pipeline (Continuous Scroll + Lazy Load)
  // -------------------------------------------------------------
  async function loadPdfDocument(source) {
    showLoading('Đang phân tích tài liệu PDF...');
    dropZone.classList.add('hidden');
    pdfViewer.innerHTML = '';
    renderedPages.clear();

    try {
      const loadingTask = pdfjsLib.getDocument(source);
      currentPdf = await loadingTask.promise;
      totalPages = currentPdf.numPages;
      totalPagesText.textContent = totalPages;
      pageNumberInput.max = totalPages;
      pageNumberInput.value = 1;

      // Create page skeleton elements
      for (let i = 1; i <= totalPages; i++) {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page';
        pageContainer.id = `page-${i}`;
        pageContainer.dataset.pageNumber = i;
        pageContainer.innerHTML = `
          <canvas></canvas>
          <div class="textLayer"></div>
        `;
        pdfViewer.appendChild(pageContainer);
      }

      await renderAllVisiblePages();
      setupPageIntersectionObserver();
      hideLoading();

    } catch (err) {
      hideLoading();
      alert(`Không thể mở file PDF: ${err.message}`);
      dropZone.classList.remove('hidden');
    }
  }

  function calculateScale(page) {
    if (currentScaleMode === 'page-width') {
      const unscaledViewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerContainer.clientWidth - 48;
      return Math.max(0.6, Math.min(3.0, containerWidth / unscaledViewport.width));
    } else if (currentScaleMode === 'auto') {
      const unscaledViewport = page.getViewport({ scale: 1 });
      const containerWidth = viewerContainer.clientWidth - 48;
      const containerHeight = viewerContainer.clientHeight - 64;
      const scaleW = containerWidth / unscaledViewport.width;
      const scaleH = containerHeight / unscaledViewport.height;
      return Math.min(scaleW, scaleH);
    }
    return currentScale;
  }

  async function renderPage(pageNum) {
    if (!currentPdf || pageNum < 1 || pageNum > totalPages) return;
    const pageContainer = document.getElementById(`page-${pageNum}`);
    if (!pageContainer) return;

    if (renderedPages.has(pageNum) && renderedPages.get(pageNum).scale === currentScale) {
      return;
    }

    const page = await currentPdf.getPage(pageNum);
    const scale = calculateScale(page);
    currentScale = scale;

    const viewport = page.getViewport({ scale });
    pageContainer.style.width = `${Math.floor(viewport.width)}px`;
    pageContainer.style.height = `${Math.floor(viewport.height)}px`;

    // 1. Render Canvas
    const canvas = pageContainer.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // 2. Render Text Layer (HTML)
    const textLayerDiv = pageContainer.querySelector('.textLayer');
    textLayerDiv.innerHTML = '';
    textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
    textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

    const textContent = await page.getTextContent();
    pdfjsLib.renderTextLayer({
      textContent: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: []
    });

    renderedPages.set(pageNum, { page, scale });
  }

  async function renderAllVisiblePages() {
    const scrollY = viewerContainer.scrollTop;
    const viewHeight = viewerContainer.clientHeight;

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      await renderPage(i);
    }
  }

  function setupPageIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
        if (entry.isIntersecting) {
          renderPage(pageNum);
          currentPage = pageNum;
          pageNumberInput.value = pageNum;
        }
      });
    }, {
      root: viewerContainer,
      rootMargin: '300px 0px'
    });

    document.querySelectorAll('.pdfViewer .page').forEach(el => observer.observe(el));
  }

  function scrollToPage(pageNum) {
    const pageEl = document.getElementById(`page-${pageNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      currentPage = pageNum;
      pageNumberInput.value = pageNum;
    }
  }

  // -------------------------------------------------------------
  // Zoom & Scale Handler
  // -------------------------------------------------------------
  async function applyScaleChange() {
    if (!currentPdf) return;
    renderedPages.clear();
    showLoading('Đang điều chỉnh tỷ lệ...');

    // Re-render currently visible pages
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 2); i++) {
      await renderPage(i);
    }
    hideLoading();
  }

  // -------------------------------------------------------------
  // File & URL Loaders
  // -------------------------------------------------------------
  function loadLocalFile(file) {
    if (!file || file.type !== 'application/pdf') {
      alert('Vui lòng chọn file có định dạng PDF (.pdf)!');
      return;
    }
    document.title = `${file.name} - SubDict PDF Reader`;
    const reader = new FileReader();
    reader.onload = function () {
      const typedArray = new Uint8Array(this.result);
      loadPdfDocument({ data: typedArray });
    };
    reader.readAsArrayBuffer(file);
  }

  async function loadRemoteUrl(url) {
    if (!url) return;
    showLoading('Đang tải file PDF từ liên kết...');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const fileName = url.split('/').pop().split('?')[0] || 'Tài liệu PDF';
      document.title = `${decodeURIComponent(fileName)} - SubDict PDF Reader`;
      loadPdfDocument({ data: new Uint8Array(arrayBuffer) });
    } catch (err) {
      hideLoading();
      alert(`Không thể tải file PDF từ URL này: ${err.message}`);
    }
  }

  function showLoading(msg) {
    loadingText.textContent = msg || 'Đang nạp dữ liệu...';
    loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }

  // -------------------------------------------------------------
  // Event Bindings
  // -------------------------------------------------------------
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadLocalFile(e.target.files[0]);
    }
  });

  // Drag & Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    viewerContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    viewerContainer.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  viewerContainer.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      loadLocalFile(files[0]);
    }
  });

  // URL prompt
  openUrlBtn.addEventListener('click', () => {
    urlInputBar.classList.toggle('hidden');
    if (!urlInputBar.classList.contains('hidden')) {
      pdfUrlInput.focus();
    }
  });

  cancelUrlBtn.addEventListener('click', () => {
    urlInputBar.classList.add('hidden');
  });

  loadUrlBtn.addEventListener('click', () => {
    const url = pdfUrlInput.value.trim();
    if (url) {
      urlInputBar.classList.add('hidden');
      loadRemoteUrl(url);
    }
  });

  pdfUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      loadUrlBtn.click();
    }
  });

  // Navigation
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) scrollToPage(currentPage - 1);
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) scrollToPage(currentPage + 1);
  });

  pageNumberInput.addEventListener('change', () => {
    let p = parseInt(pageNumberInput.value, 10);
    p = Math.max(1, Math.min(totalPages, p));
    scrollToPage(p);
  });

  // Zoom
  zoomInBtn.addEventListener('click', () => {
    currentScaleMode = 'custom';
    currentScale = Math.min(3.0, currentScale + 0.15);
    applyScaleChange();
  });

  zoomOutBtn.addEventListener('click', () => {
    currentScaleMode = 'custom';
    currentScale = Math.max(0.6, currentScale - 0.15);
    applyScaleChange();
  });

  scaleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'auto' || val === 'page-width') {
      currentScaleMode = val;
    } else {
      currentScaleMode = 'custom';
      currentScale = parseFloat(val);
    }
    applyScaleChange();
  });

  // Check URL parameter: ?file=...
  const urlParams = new URLSearchParams(window.location.search);
  const initialFile = urlParams.get('file');
  if (initialFile) {
    loadRemoteUrl(initialFile);
  }

  // Setup text selection & shortcut listeners
  setupSelectionListeners();

})();
