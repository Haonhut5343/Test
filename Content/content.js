/**
 * Content Script:
 * 1. YouTube Subtitles:
 *    - Positions popup strictly ABOVE the entire subtitle box (nằm trên khung phụ đề),
 *      aligned horizontally with the specific hovered word, and clamped safely inside player boundaries.
 *    - Pauses video immediately when the mouse enters the subtitle container (khung phụ đề).
 *    - Mouse wheel roll directly on the word / caption box scrolls the popup definitions without moving mouse into popup or affecting outside!
 * 2. Web Selection (Outside YouTube):
 *    - Positions popup dynamically above or below the selection depending on screen space.
 *    - Clamps horizontally and vertically to guarantee popup NEVER overflows off-screen.
 */

(function () {
  'use strict';

  console.log('[SubDict] Content script loaded on:', window.location.href);

  const isYouTube = window.location.hostname.includes('youtube.com');

  let settings = {
    enableSubtitle: true,
    autoPause: true,
    enableSelectionLookup: true,
    subtitleFontSize: 100
  };

  // UI Elements & State
  let tooltip = null;
  let activeHoveredElem = null;
  let hoveredWord = null;
  let videoPausedByUs = false;
  let hideTooltipTimeout = null;
  let wordSwitchTimeout = null;
  let isSelectionLookupActive = false;
  let currentLookupResult = null;
  let isCurrentWordSaved = false;

  // Ultra-Fast In-Memory Local Cache (0ms response)
  const localLookupCache = new Map();
  let savedFlashcardsSet = new Set();

  // Load saved flashcards initially & keep in sync without message latency
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

  // Keep-Alive connection to background Service Worker (prevents MV3 SW idle termination)
  let keepAlivePort = null;
  function connectKeepAlivePort() {
    try {
      if (chrome.runtime && chrome.runtime.connect) {
        keepAlivePort = chrome.runtime.connect({ name: 'subdict_keepalive' });
        keepAlivePort.onDisconnect.addListener(() => {
          keepAlivePort = null;
          setTimeout(connectKeepAlivePort, 1500);
        });
      }
    } catch (err) {
      setTimeout(connectKeepAlivePort, 3000);
    }
  }
  connectKeepAlivePort();

  // -------------------------------------------------------------
  // Flashcard Helpers
  // -------------------------------------------------------------
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

  function checkWordInFlashcards(word) {
    if (!word) return;
    isCurrentWordSaved = savedFlashcardsSet.has(word.toLowerCase());
    updateStarButtonState();
  }

  function updateStarButtonState() {
    if (!tooltip) return;
    const btn = tooltip.querySelector('#subdictStarBtn');
    if (!btn) return;
    const hint = isYouTube ? ' <span style="font-size:10px;opacity:0.8;margin-left:2px;">(Alt+S)</span>' : '';
    if (isCurrentWordSaved) {
      btn.className = 'subdict-tt-star-btn saved';
      btn.innerHTML = '★ Đã lưu' + hint;
      btn.title = 'Đã lưu trong Flashcard (Alt + S để xóa)';
    } else {
      btn.className = 'subdict-tt-star-btn';
      btn.innerHTML = '☆ Lưu từ' + hint;
      btn.title = 'Thêm vào Flashcard (Alt + S hoặc Alt + D)';
    }
  }

  async function toggleFlashcard(result) {
    if (!result || !result.word) return;

    if (isCurrentWordSaved) {
      // Remove
      try {
        await chrome.runtime.sendMessage({ action: 'REMOVE_FLASHCARD', word: result.word });
        isCurrentWordSaved = false;
        updateStarButtonState();
        showTooltipToast('Đã xóa khỏi Flashcard');
      } catch (err) {
        showTooltipToast('Lỗi: ' + err.message);
      }
    } else {
      // Save
      // Combine definitions with rootDefinitions for complete study info
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
        sourceTitle: document.title || 'YouTube / Web'
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

  // -------------------------------------------------------------
  // Dynamic Subtitle Size Styling
  // -------------------------------------------------------------
  function applySubtitleFontSize(percent) {
    let styleTag = document.getElementById('subdict-subtitle-style');

    // 100% means default native YouTube scaling. Remove any override style tag.
    if (!percent || percent === 100) {
      if (styleTag) {
        styleTag.remove();
      }
      return;
    }

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'subdict-subtitle-style';
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      .caption-window,
      .ytp-caption-window-container {
        font-size: ${percent}% !important;
      }
      .ytp-caption-segment,
      .subdict-word,
      .subdict-phrase {
        font-size: inherit !important;
      }
    `;
  }

  // Load preferences
  chrome.storage?.local?.get(['enableSubtitle', 'autoPause', 'enableSelectionLookup', 'subtitleFontSize'], (items) => {
    if (items.enableSubtitle !== undefined) settings.enableSubtitle = items.enableSubtitle;
    if (items.autoPause !== undefined) settings.autoPause = items.autoPause;
    if (items.enableSelectionLookup !== undefined) settings.enableSelectionLookup = items.enableSelectionLookup;
    if (items.subtitleFontSize !== undefined) {
      settings.subtitleFontSize = items.subtitleFontSize >= 50 ? items.subtitleFontSize : 100;
    }

    if (isYouTube) {
      applySubtitleFontSize(settings.subtitleFontSize);
    }
  });

  chrome.storage?.onChanged?.addListener((changes) => {
    if (changes.enableSubtitle) settings.enableSubtitle = changes.enableSubtitle.newValue;
    if (changes.autoPause) settings.autoPause = changes.autoPause.newValue;
    if (changes.enableSelectionLookup) settings.enableSelectionLookup = changes.enableSelectionLookup.newValue;
    if (changes.subtitleFontSize && isYouTube) {
      const val = changes.subtitleFontSize.newValue;
      settings.subtitleFontSize = val >= 50 ? val : 100;
      applySubtitleFontSize(settings.subtitleFontSize);
    }
  });

  function createTooltip() {
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.id = 'subdict-tooltip';

    // On YouTube, attach inside player container for full screen support and clean positioning
    const player = isYouTube ? (document.querySelector('#movie_player') || document.querySelector('.html5-video-player')) : null;
    if (player) {
      player.appendChild(tooltip);
    } else {
      document.body.appendChild(tooltip);
    }

    // Keep tooltip open and video paused when user moves cursor inside tooltip (Web only; on YouTube tooltip is a HUD overlay)
    tooltip.addEventListener('mouseenter', () => {
      if (isYouTube) return;
      if (hideTooltipTimeout) {
        clearTimeout(hideTooltipTimeout);
        hideTooltipTimeout = null;
      }
      if (wordSwitchTimeout) {
        clearTimeout(wordSwitchTimeout);
        wordSwitchTimeout = null;
      }
    });

    tooltip.addEventListener('mouseleave', () => {
      if (isYouTube) return;
      if (!isSelectionLookupActive) {
        scheduleHideTooltip(220);
      }
    });

    return tooltip;
  }

  function getYouTubeVideo() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function pauseVideo() {
    const video = getYouTubeVideo();
    if (video && !video.paused && settings.autoPause) {
      video.pause();
      videoPausedByUs = true;
    }
  }

  function resumeVideo() {
    const video = getYouTubeVideo();
    if (video && video.paused && videoPausedByUs && settings.autoPause) {
      video.play().catch(() => {});
      videoPausedByUs = false;
    }
  }

  function scheduleHideTooltip(delay = 220) {
    if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = setTimeout(() => {
      if (tooltip) {
        tooltip.classList.remove('visible');
      }
      activeHoveredElem = null;
      hoveredWord = null;
      isSelectionLookupActive = false;
      resumeVideo();
    }, delay);
  }

  /**
   * Render ALL definitions inside the floating tooltip.
   * Word, IPA, Region, and Lemma are on the SAME top row.
   */
  function renderTooltipContent(result) {
    if (!tooltip) return;
    currentLookupResult = result;
    isCurrentWordSaved = false;

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

    // Group definitions by POS - SHOW ALL DEFINITIONS
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

    // Render Root Word definitions if available (e.g. squared -> square)
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
          ${ipaHtml}
          ${lemmaHtml}
          <button class="subdict-tt-star-btn" id="subdictStarBtn" title="Thêm vào Flashcard (Alt + S hoặc Alt + D)">
            ☆ Lưu từ${isYouTube ? ' <span style="font-size:10px;opacity:0.8;margin-left:2px;">(Alt+S)</span>' : ''}
          </button>
        </div>
      </div>
      ${defsHtml}
    `;

    const starBtn = tooltip.querySelector('#subdictStarBtn');
    if (starBtn) {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFlashcard(currentLookupResult);
      });
    }

    // Check if word is already saved in Flashcard
    checkWordInFlashcards(result.word);
  }

  /**
   * Position tooltip on YouTube:
   * STRICTLY ABOVE the entire subtitle box (nằm trên khung phụ đề),
   * aligned horizontally with the specific hovered word, and clamped within player.
   */
  function positionTooltipOnYouTubeWord(elem) {
    createTooltip();

    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (!player || !elem) return;

    if (!player.contains(tooltip)) {
      player.appendChild(tooltip);
    }

    tooltip.classList.add('subdict-youtube-positioned');

    const playerRect = player.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();
    const tooltipWidth = 460;

    // 1. Horizontally: Center over the specific hovered word
    const wordCenterRel = elemRect.left - playerRect.left + (elemRect.width / 2);
    let left = wordCenterRel - (tooltipWidth / 2);

    // Clamp horizontally inside player with 12px padding
    const minLeft = 12;
    const maxLeft = playerRect.width - tooltipWidth - 12;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    // 2. Vertically: NẰM TRÊN KHUNG PHỤ ĐỀ (above the entire subtitle box)
    const captionWindow = elem.closest('.caption-window') || 
                          elem.closest('.ytp-caption-window-container') || 
                          player.querySelector('.caption-window') || 
                          player.querySelector('.ytp-caption-window-container');

    let bottomOffset;
    if (captionWindow) {
      const captionRect = captionWindow.getBoundingClientRect();
      const topEdge = Math.min(captionRect.top, elemRect.top);
      bottomOffset = playerRect.bottom - topEdge + 10;
    } else {
      bottomOffset = playerRect.bottom - elemRect.top + 10;
    }

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.bottom = `${Math.max(75, Math.round(bottomOffset))}px`;
    tooltip.style.top = 'auto';
    tooltip.style.transform = 'none';
  }

  /**
   * Position tooltip for Web text selection (outside YouTube):
   * Dynamically places ABOVE or BELOW depending on available viewport space,
   * and clamps left/right/top/bottom so it NEVER overflows off-screen!
   */
  function positionTooltipForWebSelection(rect) {
    createTooltip();
    tooltip.classList.remove('subdict-youtube-positioned');

    const tooltipWidth = 460;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const approxHeight = tooltip.offsetHeight > 50 ? tooltip.offsetHeight : 210;

    // Available vertical space above and below the selection
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    let top;
    if (spaceAbove >= approxHeight + 15) {
      // Plenty of room above: position above
      top = rect.top + scrollY - approxHeight - 10;
    } else if (spaceBelow >= approxHeight + 15) {
      // Not enough room above, but enough room below: position below
      top = rect.bottom + scrollY + 10;
    } else {
      // Pick whichever side has more room
      if (spaceAbove >= spaceBelow) {
        top = Math.max(scrollY + 10, rect.top + scrollY - approxHeight - 10);
      } else {
        top = rect.bottom + scrollY + 10;
      }
    }

    // Clamp vertically within viewport
    const minTop = scrollY + 8;
    const maxTop = scrollY + viewportHeight - approxHeight - 8;
    top = Math.max(minTop, Math.min(maxTop, top));

    // Center horizontally over the selection
    let left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);

    // Clamp horizontally within viewport
    const minLeft = scrollX + 12;
    const maxLeft = scrollX + viewportWidth - tooltipWidth - 12;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    tooltip.style.bottom = 'auto';
    tooltip.style.transform = 'none';
  }

  // -------------------------------------------------------------
  // FEATURE: Wheel Scroll Forwarding (Roll trực tiếp trên từ hoặc khung phụ đề)
  // -------------------------------------------------------------
  function setupWheelForwarding() {
    window.addEventListener('wheel', (e) => {
      if (!tooltip || !tooltip.classList.contains('visible')) return;

      const body = tooltip.querySelector('.subdict-tt-body');
      if (!body) return;

      // Check if mouse is over active word, or inside caption window, or inside tooltip (web only)
      const isOverWord = (activeHoveredElem && (activeHoveredElem === e.target || (activeHoveredElem.contains && activeHoveredElem.contains(e.target)))) ||
                         Boolean(e.target.closest && e.target.closest('.subdict-word, .subdict-phrase'));
      const isOverCaption = Boolean(e.target.closest && e.target.closest('.ytp-caption-segment, .caption-window, .ytp-caption-window-container'));
      const isOverTooltip = !isYouTube && Boolean(tooltip.contains && tooltip.contains(e.target));

      if (isOverWord || isOverCaption || isOverTooltip) {
        // ALWAYS block external page scroll, video volume changes, etc.
        e.preventDefault();
        e.stopPropagation();

        if (body.scrollHeight > body.clientHeight) {
          // Directly scroll definitions container
          body.scrollTop += e.deltaY;
        }
      }
    }, { passive: false, capture: true });
  }

  // -------------------------------------------------------------
  // FEATURE: Pause Video When Mouse Enters Caption Box (Khung phụ đề)
  // -------------------------------------------------------------
  function setupCaptionWindowHoverPause() {
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (!player || player.dataset.subdictCaptionListening === 'true') return;
    player.dataset.subdictCaptionListening = 'true';

    // Pause video immediately when mouse enters any part of subtitle container
    player.addEventListener('mouseover', (e) => {
      const isCaption = e.target.closest && e.target.closest('.ytp-caption-segment, .caption-window');
      if (isCaption) {
        pauseVideo();
        if (hideTooltipTimeout) {
          clearTimeout(hideTooltipTimeout);
          hideTooltipTimeout = null;
        }
      }
    });

    player.addEventListener('mouseout', (e) => {
      const fromCaption = e.target.closest && e.target.closest('.ytp-caption-segment, .caption-window');
      const toCaption = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.ytp-caption-segment, .caption-window');
      const toTooltip = !isYouTube && tooltip && (e.relatedTarget === tooltip || tooltip.contains(e.relatedTarget));

      // When mouse leaves the subtitle container (and not entering tooltip on web), schedule resume
      if (fromCaption && !toCaption && !toTooltip) {
        scheduleHideTooltip(220);
      }
    });
  }

  // -------------------------------------------------------------
  // FEATURE 1: Web Text Selection Lookup (Trực tiếp hiện popup khi tô đen)
  // -------------------------------------------------------------
  function setupSelectionLookup() {
    document.addEventListener('mouseup', (e) => {
      if (!settings.enableSelectionLookup) return;
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
              showDirectSelectionPopup(text, rect);
              return;
            }
          } catch (err) {}
        }

        if (!tooltip?.contains(e.target) && isSelectionLookupActive) {
          tooltip?.classList.remove('visible');
          isSelectionLookupActive = false;
        }
      }, 50);
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
  }

  async function showDirectSelectionPopup(text, rect) {
    createTooltip();

    const normalized = text.trim().toLowerCase().replace(/^[^\w\s'-]+|[^\w\s'-]+$/g, '');

    // 1. Fast Path: If cached locally, render INSTANTLY (0ms)
    if (localLookupCache.has(normalized)) {
      const cached = localLookupCache.get(normalized);
      renderTooltipContent(cached);
      positionTooltipForWebSelection(rect);
      tooltip.classList.add('visible');
      return;
    }

    // 2. Fetch from warm background service worker
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

    positionTooltipForWebSelection(rect);
    tooltip.classList.add('visible');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'LOOKUP',
        text
      });

      if (response && response.success) {
        localLookupCache.set(normalized, response.result);
        renderTooltipContent(response.result);
        positionTooltipForWebSelection(rect);
      }
    } catch (err) {
      tooltip.innerHTML = `<div class="subdict-tt-meaning">Lỗi tra cứu: ${escapeHtml(err.message)}</div>`;
    }
  }

  // -------------------------------------------------------------
  // FEATURE 2: YouTube Subtitles Observer & Word Hover
  // -------------------------------------------------------------
  function onWordHover(elem, text) {
    if (hideTooltipTimeout) {
      clearTimeout(hideTooltipTimeout);
      hideTooltipTimeout = null;
    }

    // If mouse is already on the active word, no need to re-trigger
    if (activeHoveredElem === elem && tooltip && tooltip.classList.contains('visible')) {
      return;
    }

    const normalized = text.trim().toLowerCase().replace(/^[^\w\s'-]+|[^\w\s'-]+$/g, '');
    const isAlreadyOpen = tooltip && tooltip.classList.contains('visible');
    const isCached = localLookupCache.has(normalized);

    // Ultra-responsive debounce: 10ms if cached, 25ms if uncached
    const delay = isCached ? 10 : (isAlreadyOpen ? 30 : 20);

    if (wordSwitchTimeout) clearTimeout(wordSwitchTimeout);

    wordSwitchTimeout = setTimeout(async () => {
      activeHoveredElem = elem;
      hoveredWord = text;

      // Immediately pause video
      pauseVideo();

      // Position popup strictly above the subtitle box, aligned with this word
      positionTooltipOnYouTubeWord(elem);

      // Fast Path: Cached word renders IMMEDIATELY with zero delay
      if (isCached) {
        renderTooltipContent(localLookupCache.get(normalized));
        positionTooltipOnYouTubeWord(elem);
        tooltip.classList.add('visible');
        return;
      }

      if (!isAlreadyOpen) {
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
        tooltip.classList.add('visible');
      }

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'LOOKUP',
          text
        });

        if (hoveredWord === text && response && response.success) {
          localLookupCache.set(normalized, response.result);
          renderTooltipContent(response.result);
          positionTooltipOnYouTubeWord(elem);
        }
      } catch (err) {
        if (hoveredWord === text) {
          tooltip.innerHTML = `<div class="subdict-tt-meaning">Lỗi tra cứu: ${escapeHtml(err.message)}</div>`;
        }
      }
    }, delay);
  }

  function onWordLeave() {
    if (wordSwitchTimeout) {
      clearTimeout(wordSwitchTimeout);
      wordSwitchTimeout = null;
    }
    scheduleHideTooltip(220);
  }

  async function processCaptionSegment(segment) {
    if (!settings.enableSubtitle) return;

    const rawText = (segment.textContent || '').trim();
    if (!rawText) return;

    // Check if the current rawText matches what we already processed for this segment
    if (segment.dataset.subdictProcessedText === rawText) return;
    if (segment.dataset.subdictProcessing === 'true') return;
    segment.dataset.subdictProcessing = 'true';

    // Tokenize text into words preserving delimiters
    const tokens = [];
    const regex = /([a-zA-Z0-9'’-]+)|([^a-zA-Z0-9'’-]+)/g;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match[1]) {
        tokens.push({ type: 'word', text: match[1] });
      } else if (match[2]) {
        tokens.push({ type: 'punct', text: match[2] });
      }
    }

    const wordTokens = tokens.filter(t => t.type === 'word');
    if (wordTokens.length === 0) {
      segment.dataset.subdictProcessing = 'false';
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'MATCH_PHRASES',
        tokens: wordTokens,
        maxPhraseLength: 5
      });

      if (!response || !response.success || !response.segments) {
        segment.dataset.subdictProcessing = 'false';
        return;
      }

      // Ultra-Fast Pre-caching: store definitions for all words/phrases in this subtitle segment (0ms hover)
      if (response.definitionsMap) {
        for (const [key, defResult] of Object.entries(response.definitionsMap)) {
          if (defResult) {
            localLookupCache.set(key.toLowerCase(), defResult);
          }
        }
      }

      const frag = document.createDocumentFragment();
      let wordIdx = 0;
      let segIdx = 0;
      const segments = response.segments;
      let activePhraseSpan = null;
      let activePhraseEnd = -1;

      for (const tok of tokens) {
        if (tok.type === 'punct') {
          if (activePhraseSpan) {
            activePhraseSpan.appendChild(document.createTextNode(tok.text));
          } else {
            frag.appendChild(document.createTextNode(tok.text));
          }
          continue;
        }

        const currentSeg = segments[segIdx];
        if (currentSeg && currentSeg.type === 'phrase') {
          if (wordIdx === currentSeg.startIndex) {
            activePhraseSpan = document.createElement('span');
            activePhraseSpan.className = 'subdict-phrase';
            activePhraseSpan.dataset.phrase = currentSeg.lookupKey;
            activePhraseEnd = currentSeg.endIndex;

            // Hover on entire phrase
            activePhraseSpan.addEventListener('mouseenter', () => onWordHover(activePhraseSpan, currentSeg.lookupKey));
            activePhraseSpan.addEventListener('mouseleave', onWordLeave);

            frag.appendChild(activePhraseSpan);
          }

          if (activePhraseSpan) {
            activePhraseSpan.appendChild(document.createTextNode(tok.text));
          }

          if (wordIdx === activePhraseEnd) {
            activePhraseSpan = null;
            activePhraseEnd = -1;
            segIdx++;
          }
          wordIdx++;
        } else {
          activePhraseSpan = null;
          // Single word - attach hover to EVERY word
          const wordSpan = document.createElement('span');
          const isRec = currentSeg?.isRecognized;
          wordSpan.className = `subdict-word ${isRec ? 'subdict-recognized' : ''}`;
          wordSpan.textContent = tok.text;
          wordSpan.dataset.word = currentSeg?.lookupKey || tok.text.toLowerCase();

          // ANY word hovered directly shows popup + pauses video
          wordSpan.addEventListener('mouseenter', () => onWordHover(wordSpan, wordSpan.dataset.word));
          wordSpan.addEventListener('mouseleave', onWordLeave);

          frag.appendChild(wordSpan);
          wordIdx++;
          segIdx++;
        }
      }

      // Mark the text as processed before replacing to prevent observer loops
      segment.dataset.subdictProcessedText = rawText;
      segment.textContent = '';
      segment.appendChild(frag);

    } catch (err) {
      console.warn('[SubDict] Failed to process subtitle segment:', err);
    } finally {
      segment.dataset.subdictProcessing = 'false';
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function setupSubtitleObserver() {
    const observer = new MutationObserver(() => {
      if (!settings.enableSubtitle) return;

      setupCaptionWindowHoverPause();

      const segments = document.querySelectorAll('.ytp-caption-segment');
      segments.forEach(seg => {
        if (seg.dataset.subdictProcessedText !== seg.textContent.trim()) {
          processCaptionSegment(seg);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // -------------------------------------------------------------
  // FEATURE: Flashcard Shortcut Listener (Alt + S, Alt + D, Ctrl + Shift + D, Ctrl + D)
  // -------------------------------------------------------------
  function setupFlashcardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Must have tooltip open and a valid result
      if (!tooltip || !tooltip.classList.contains('visible') || !currentLookupResult || !currentLookupResult.found) {
        return;
      }

      // Check Alt + S, Alt + D, Ctrl + Shift + D, Ctrl + Shift + S, or Ctrl + D
      const isAltS = e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S');
      const isAltD = e.altKey && (e.code === 'KeyD' || e.key === 'd' || e.key === 'D');
      const isCtrlShiftD = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'KeyD' || e.key === 'd' || e.key === 'D');
      const isCtrlShiftS = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S');
      const isCtrlD = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.code === 'KeyD' || e.key === 'd' || e.key === 'D');

      if (isAltS || isAltD || isCtrlShiftD || isCtrlShiftS || isCtrlD) {
        e.preventDefault();
        e.stopPropagation();
        toggleFlashcard(currentLookupResult);
      }
    }, true);
  }

  // Initialize features
  setupWheelForwarding();
  setupSelectionLookup();
  setupFlashcardShortcuts();

  if (isYouTube) {
    setupSubtitleObserver();
    setupCaptionWindowHoverPause();
    applySubtitleFontSize(settings.subtitleFontSize);
  }

})();
