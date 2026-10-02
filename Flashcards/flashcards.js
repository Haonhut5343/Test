/**
 * Flashcards Review & Management Script
 * Handles 3D flip card practice, spaced repetition status, list management, and offline TTS pronunciation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Header & Stats
  const totalCountEl = document.getElementById('totalCount');
  const learningCountEl = document.getElementById('learningCount');
  const masteredCountEl = document.getElementById('masteredCount');
  const addManualBtn = document.getElementById('addManualBtn');
  const exportBtn = document.getElementById('exportBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // DOM Elements - Study Mode
  const studyFilter = document.getElementById('studyFilter');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const studyProgressText = document.getElementById('studyProgressText');
  const studyProgressBar = document.getElementById('studyProgressBar');
  const studyEmptyState = document.getElementById('studyEmptyState');
  const studyEmptyDesc = document.getElementById('studyEmptyDesc');
  const emptyAddBtn = document.getElementById('emptyAddBtn');
  const studyCardContainer = document.getElementById('studyCardContainer');
  const flashcard = document.getElementById('flashcard');
  const frontStatusBadge = document.getElementById('frontStatusBadge');
  const frontPosBadge = document.getElementById('frontPosBadge');
  const frontWord = document.getElementById('frontWord');
  const frontIpa = document.getElementById('frontIpa');
  const frontAudioBtn = document.getElementById('frontAudioBtn');
  const frontLemma = document.getElementById('frontLemma');
  const backWord = document.getElementById('backWord');
  const backIpa = document.getElementById('backIpa');
  const backAudioBtn = document.getElementById('backAudioBtn');
  const backStatusBadge = document.getElementById('backStatusBadge');
  const backDefsList = document.getElementById('backDefsList');
  const studyActionButtons = document.getElementById('studyActionButtons');
  const btnNotRemembered = document.getElementById('btnNotRemembered');
  const btnFlipCard = document.getElementById('btnFlipCard');
  const btnRemembered = document.getElementById('btnRemembered');

  // Completion State
  const studyCompleteState = document.getElementById('studyCompleteState');
  const sumRemembered = document.getElementById('sumRemembered');
  const sumNotRemembered = document.getElementById('sumNotRemembered');
  const restartReviewBtn = document.getElementById('restartReviewBtn');
  const restartAllBtn = document.getElementById('restartAllBtn');

  // List View
  const listSearchInput = document.getElementById('listSearchInput');
  const listStatusFilter = document.getElementById('listStatusFilter');
  const listSortBy = document.getElementById('listSortBy');
  const vocabListContainer = document.getElementById('vocabListContainer');
  const listEmptyState = document.getElementById('listEmptyState');

  // Modal & Toast
  const manualModal = document.getElementById('manualModal');
  const manualForm = document.getElementById('manualForm');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const toast = document.getElementById('toast');

  // App State
  let allCards = [];
  let studyQueue = [];
  let currentIndex = 0;
  let isCardFlipped = false;
  let sessionResults = { remembered: 0, notRemembered: 0, unrememberedIds: [] };

  // ==========================================
  // INITIALIZATION & DATA LOADING
  // ==========================================
  async function loadCards() {
    chrome.storage.local.get(['flashcards'], (items) => {
      allCards = items.flashcards || [];
      updateStats();
      initStudySession();
      renderListView();
    });
  }

  function updateStats() {
    const total = allCards.length;
    const learning = allCards.filter(c => c.status !== 'mastered').length;
    const mastered = allCards.filter(c => c.status === 'mastered').length;

    totalCountEl.textContent = total;
    learningCountEl.textContent = learning;
    masteredCountEl.textContent = mastered;
  }

  // ==========================================
  // STUDY MODE
  // ==========================================
  function initStudySession(customList = null) {
    sessionResults = { remembered: 0, notRemembered: 0, unrememberedIds: [] };
    studyCompleteState.classList.add('hidden');

    if (customList) {
      studyQueue = [...customList];
    } else {
      const filter = studyFilter.value;
      if (filter === 'learning') {
        studyQueue = allCards.filter(c => c.status !== 'mastered');
      } else if (filter === 'mastered') {
        studyQueue = allCards.filter(c => c.status === 'mastered');
      } else {
        studyQueue = [...allCards];
      }
    }

    currentIndex = 0;

    if (studyQueue.length === 0) {
      studyEmptyState.classList.remove('hidden');
      studyCardContainer.classList.add('hidden');
      studyActionButtons.classList.add('hidden');
      studyProgressText.textContent = '0 / 0';
      studyProgressBar.style.width = '0%';
      if (allCards.length === 0) {
        studyEmptyDesc.innerHTML = 'Hãy thêm từ khi xem video YouTube hoặc bôi đen văn bản bằng phím tắt <strong>Alt + S</strong> hoặc bấm <strong>⭐ Lưu từ</strong>.';
      } else {
        studyEmptyDesc.textContent = 'Không có từ nào trong bộ lọc này. Hãy chuyển sang "Tất cả từ vựng" để ôn tập!';
      }
    } else {
      studyEmptyState.classList.add('hidden');
      studyCardContainer.classList.remove('hidden');
      studyActionButtons.classList.remove('hidden');
      renderCurrentCard();
    }
  }

  function renderCurrentCard() {
    if (currentIndex >= studyQueue.length) {
      showCompletion();
      return;
    }

    const card = studyQueue[currentIndex];
    isCardFlipped = false;
    flashcard.classList.remove('is-flipped');

    // Progress update
    const currentNum = currentIndex + 1;
    const totalNum = studyQueue.length;
    studyProgressText.textContent = `${currentNum} / ${totalNum}`;
    studyProgressBar.style.width = `${((currentIndex) / totalNum) * 100}%`;

    // Status badges
    const isMastered = card.status === 'mastered';
    const statusText = isMastered ? 'Đã thuộc' : 'Đang học';
    const statusClass = isMastered ? 'status-mastered' : 'status-learning';

    frontStatusBadge.textContent = statusText;
    frontStatusBadge.className = `status-badge ${statusClass}`;
    backStatusBadge.textContent = statusText;
    backStatusBadge.className = `status-badge ${statusClass}`;

    // POS badge
    frontPosBadge.textContent = card.pos || (card.definitions?.[0]?.posLabel || 'Word');

    // Word & IPA
    frontWord.textContent = card.word;
    backWord.textContent = card.word;
    frontIpa.textContent = card.ipa || '—';
    backIpa.textContent = card.ipa || '—';

    // Lemma if any
    if (card.lemma) {
      frontLemma.textContent = `Gốc: ${card.lemma}`;
      frontLemma.classList.remove('hidden');
    } else {
      frontLemma.classList.add('hidden');
    }

    // Definitions list on Back Face
    renderBackDefinitions(card);
  }

  function renderBackDefinitions(card) {
    backDefsList.innerHTML = '';

    if (!card.definitions || card.definitions.length === 0) {
      backDefsList.innerHTML = `<div class="back-meaning">Chưa có định nghĩa tiếng Việt.</div>`;
      return;
    }

    // Group by posLabel
    const groups = {};
    card.definitions.forEach(def => {
      const key = def.posLabel || def.pos || 'Nghĩa tiếng Việt';
      if (!groups[key]) groups[key] = [];
      groups[key].push(def);
    });

    for (const [posLabel, items] of Object.entries(groups)) {
      const groupEl = document.createElement('div');
      groupEl.className = 'back-def-group';

      let defsHtml = `<span class="back-pos">${escapeHtml(posLabel)}</span>`;
      items.forEach(it => {
        defsHtml += `
          <div class="back-def-item">
            <span class="back-meaning">${escapeHtml(it.definition)}</span>
            ${it.example ? `<span class="back-example">"${escapeHtml(it.example)}"</span>` : ''}
          </div>
        `;
      });
      groupEl.innerHTML = defsHtml;
      backDefsList.appendChild(groupEl);
    }
  }

  function flipCard() {
    isCardFlipped = !isCardFlipped;
    flashcard.classList.toggle('is-flipped', isCardFlipped);
  }

  async function answerCard(remembered) {
    if (currentIndex >= studyQueue.length) return;

    const card = studyQueue[currentIndex];
    const newStatus = remembered ? 'mastered' : 'learning';

    if (remembered) {
      sessionResults.remembered++;
    } else {
      sessionResults.notRemembered++;
      sessionResults.unrememberedIds.push(card.id);
    }

    // Update in allCards
    const found = allCards.find(c => c.id === card.id);
    if (found) {
      found.status = newStatus;
      found.reviewCount = (found.reviewCount || 0) + 1;
      found.lastReviewed = Date.now();
    }

    // Save to storage
    chrome.storage.local.set({ flashcards: allCards }, () => {
      updateStats();
    });

    // Move to next card
    currentIndex++;
    if (currentIndex >= studyQueue.length) {
      studyProgressBar.style.width = '100%';
      studyProgressText.textContent = `${studyQueue.length} / ${studyQueue.length}`;
      setTimeout(() => {
        showCompletion();
      }, 250);
    } else {
      renderCurrentCard();
    }
  }

  function showCompletion() {
    studyCardContainer.classList.add('hidden');
    studyActionButtons.classList.add('hidden');
    studyCompleteState.classList.remove('hidden');

    sumRemembered.textContent = sessionResults.remembered;
    sumNotRemembered.textContent = sessionResults.notRemembered;
  }

  // ==========================================
  // LIST VIEW
  // ==========================================
  function renderListView() {
    const search = (listSearchInput.value || '').trim().toLowerCase();
    const statusFilter = listStatusFilter.value;
    const sortBy = listSortBy.value;

    let filtered = allCards.filter(card => {
      // Status filter
      if (statusFilter === 'learning' && card.status === 'mastered') return false;
      if (statusFilter === 'mastered' && card.status !== 'mastered') return false;

      // Search filter
      if (search) {
        const wordMatch = card.word.toLowerCase().includes(search);
        const defMatch = (card.definitions || []).some(d => (d.definition || '').toLowerCase().includes(search));
        return wordMatch || defMatch;
      }
      return true;
    });

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    } else if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.word.localeCompare(b.word));
    }

    vocabListContainer.innerHTML = '';

    if (filtered.length === 0) {
      listEmptyState.classList.remove('hidden');
      return;
    }

    listEmptyState.classList.add('hidden');

    filtered.forEach(card => {
      const itemEl = document.createElement('div');
      itemEl.className = 'vocab-item';

      const isMastered = card.status === 'mastered';
      const statusClass = isMastered ? 'status-mastered' : 'status-learning';
      const statusText = isMastered ? 'Đã thuộc' : 'Đang học';

      // Summary definition text
      const meaningsText = (card.definitions || [])
        .map(d => d.definition)
        .slice(0, 3)
        .join('; ') || 'Chưa có định nghĩa.';

      const dateStr = card.addedAt ? new Date(card.addedAt).toLocaleDateString('vi-VN') : 'Mới';

      itemEl.innerHTML = `
        <div class="vocab-info">
          <div class="vocab-top">
            <span class="vocab-word">${escapeHtml(card.word)}</span>
            ${card.ipa ? `<span class="vocab-ipa">${escapeHtml(card.ipa)}</span>` : ''}
            <button class="btn-audio btn-speak-item" data-word="${escapeHtml(card.word)}" title="Phát âm">🔊</button>
          </div>
          <div class="vocab-meanings">${escapeHtml(meaningsText)}</div>
          <div class="vocab-meta">
            <span>Ngày lưu: ${dateStr}</span>
            <span>Đã ôn: ${card.reviewCount || 0} lần</span>
          </div>
        </div>

        <div class="vocab-actions">
          <button class="btn-toggle-status ${statusClass}" data-id="${card.id}" title="Bấm để chuyển trạng thái">
            ${statusText}
          </button>
          <button class="btn-delete" data-id="${card.id}" title="Xóa từ khỏi Flashcards">
            🗑️
          </button>
        </div>
      `;

      vocabListContainer.appendChild(itemEl);
    });

    // Attach list event listeners
    vocabListContainer.querySelectorAll('.btn-speak-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord(btn.dataset.word);
      });
    });

    vocabListContainer.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleCardStatus(btn.dataset.id);
      });
    });

    vocabListContainer.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteCard(btn.dataset.id);
      });
    });
  }

  function toggleCardStatus(id) {
    const card = allCards.find(c => c.id === id);
    if (!card) return;

    card.status = card.status === 'mastered' ? 'learning' : 'mastered';
    chrome.storage.local.set({ flashcards: allCards }, () => {
      updateStats();
      renderListView();
      showToast(card.status === 'mastered' ? 'Đã đánh dấu: Đã thuộc! 🏆' : 'Đã chuyển về: Đang học ⏳');
    });
  }

  function deleteCard(id) {
    const card = allCards.find(c => c.id === id);
    if (!card) return;

    if (confirm(`Bạn có chắc muốn xóa từ "${card.word}" khỏi Flashcards?`)) {
      allCards = allCards.filter(c => c.id !== id);
      chrome.storage.local.set({ flashcards: allCards }, () => {
        updateStats();
        renderListView();
        initStudySession();
        showToast(`Đã xóa "${card.word}".`);
      });
    }
  }

  // ==========================================
  // TEXT-TO-SPEECH (TTS) PRONUNCIATION
  // ==========================================
  function speakWord(text) {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  // ==========================================
  // EVENT LISTENERS - CONTROLS
  // ==========================================
  // Tab Switch
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(btn.dataset.tab);
      if (pane) pane.classList.add('active');

      if (btn.dataset.tab === 'listTab') {
        renderListView();
      }
    });
  });

  // Card Flip Click
  flashcard.addEventListener('click', (e) => {
    // Avoid flipping if audio button is clicked
    if (e.target.closest('.btn-audio')) return;
    flipCard();
  });

  btnFlipCard.addEventListener('click', flipCard);
  btnNotRemembered.addEventListener('click', () => answerCard(false));
  btnRemembered.addEventListener('click', () => answerCard(true));

  // Audio Buttons
  frontAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = studyQueue[currentIndex];
    if (card) speakWord(card.word);
  });

  backAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = studyQueue[currentIndex];
    if (card) speakWord(card.word);
  });

  // Filter change in study mode
  studyFilter.addEventListener('change', () => {
    initStudySession();
  });

  // Shuffle
  shuffleBtn.addEventListener('click', () => {
    for (let i = studyQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [studyQueue[i], studyQueue[j]] = [studyQueue[j], studyQueue[i]];
    }
    currentIndex = 0;
    renderCurrentCard();
    showToast('Đã trộn ngẫu nhiên thứ tự thẻ! 🔀');
  });

  // Restart buttons
  restartReviewBtn.addEventListener('click', () => {
    const unremembered = allCards.filter(c => sessionResults.unrememberedIds.includes(c.id));
    if (unremembered.length > 0) {
      initStudySession(unremembered);
    } else {
      initStudySession();
    }
  });

  restartAllBtn.addEventListener('click', () => {
    initStudySession();
  });

  // List view search & filters
  listSearchInput.addEventListener('input', renderListView);
  listStatusFilter.addEventListener('change', renderListView);
  listSortBy.addEventListener('change', renderListView);

  // Keyboard Shortcuts in Study Mode
  window.addEventListener('keydown', (e) => {
    const studyTab = document.getElementById('studyTab');
    if (!studyTab.classList.contains('active')) return;
    if (manualModal && !manualModal.classList.contains('hidden')) return;

    // Do not trigger if typing in an input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      flipCard();
    } else if (e.key === '1' || e.key === 'ArrowLeft') {
      e.preventDefault();
      answerCard(false);
    } else if (e.key === '2' || e.key === 'ArrowRight') {
      e.preventDefault();
      answerCard(true);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const card = studyQueue[currentIndex];
      if (card) speakWord(card.word);
    }
  });

  // ==========================================
  // MANUAL ADD WORD MODAL
  // ==========================================
  function openManualModal() {
    manualModal.classList.remove('hidden');
    document.getElementById('formWord').focus();
  }

  function closeManualModal() {
    manualModal.classList.add('hidden');
    manualForm.reset();
  }

  addManualBtn.addEventListener('click', openManualModal);
  emptyAddBtn?.addEventListener('click', openManualModal);
  closeModalBtn.addEventListener('click', closeManualModal);
  cancelModalBtn.addEventListener('click', closeManualModal);

  manualForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const word = document.getElementById('formWord').value.trim();
    const ipa = document.getElementById('formIpa').value.trim();
    const pos = document.getElementById('formPos').value.trim() || 'Word';
    const def = document.getElementById('formDef').value.trim();
    const example = document.getElementById('formExample').value.trim();

    if (!word || !def) return;

    const newCard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      word,
      cleanWord: word.toLowerCase(),
      ipa: ipa ? (ipa.startsWith('/') ? ipa : `/${ipa}/`) : '',
      pos,
      definitions: [
        {
          pos,
          posLabel: pos,
          definition: def,
          example
        }
      ],
      status: 'learning',
      reviewCount: 0,
      lastReviewed: null,
      addedAt: Date.now()
    };

    allCards.unshift(newCard);
    chrome.storage.local.set({ flashcards: allCards }, () => {
      updateStats();
      initStudySession();
      renderListView();
      closeManualModal();
      showToast(`Đã thêm từ "${word}" vào Flashcard! ⭐`);
    });
  });

  // ==========================================
  // EXPORT TO JSON FILE
  // ==========================================
  exportBtn.addEventListener('click', () => {
    if (allCards.length === 0) {
      showToast('Chưa có từ nào để xuất!');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allCards, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `subdict_flashcards_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã xuất file Flashcard thành công! 📥');
  });

  // ==========================================
  // TOAST HELPER
  // ==========================================
  let toastTimeout = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2400);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Load initial data
  loadCards();
});
