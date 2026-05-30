/* ============================================================
   MockTest — Core Quiz Logic & Data Fetching
   ============================================================ */

// ---------- State ----------
const appState = {
  view: 'subjects',       // 'subjects' | 'quizzes' | 'quiz' | 'results'
  subjects: [],            // from subjects.json
  currentSubject: null,
  currentQuiz: null,
  questions: [],           // parsed & randomised
  currentQuestionIndex: 0,
  userAnswers: [],          // array of selected letter (null if not answered)
};

// Subject icons — pick a distinct emoji per subject keyword, fallback to 📘
const SUBJECT_ICONS = {
  mathematics: '🧮',
  math: '🧮',
  science: '🔬',
  physics: '⚛️',
  chemistry: '🧪',
  biology: '🧬',
  history: '📜',
  geography: '🌍',
  english: '📖',
  computer: '💻',
  economics: '📊',
  art: '🎨',
  music: '🎵',
  philosophy: '🤔',
  language: '🗣️',
  engineering: '⚙️',
};

function getSubjectIcon(name) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📘';
}

// ---------- DOM References ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  viewSubjects:   $('#view-subjects'),
  viewQuizzes:    $('#view-quizzes'),
  viewQuiz:       $('#view-quiz'),
  viewResults:    $('#view-results'),
  subjectsGrid:   $('#subjects-grid'),
  subjectsError:  $('#subjects-error'),
  btnRetry:       $('#btn-retry'),
  quizzesTitle:   $('#quizzes-title'),
  quizzesGrid:    $('#quizzes-grid'),
  btnBackSubjects: $('#btn-back-subjects'),
  btnBackQuizzes: $('#btn-back-quizzes'),
  progressFill:   $('#progress-bar-fill'),
  quizProgress:   $('#quiz-progress'),
  quizQuestion:   $('#quiz-question'),
  quizOptions:    $('#quiz-options'),
  btnNext:        $('#btn-next'),
  btnSubmit:      $('#btn-submit'),
  resultsScore:   $('#results-score'),
  resultsPercentage: $('#results-percentage'),
  resultsDetails: $('#results-details'),
  btnRetake:      $('#btn-retake'),
  btnBackHome:    $('#btn-back-home'),
  logoHome:       $('#logo-home'),
};

// ---------- CSV Parser (spec-provided, bullet-proof) ----------
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { currentField += '"'; i++; }
        else { inQuotes = false; }
      } else { currentField += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { currentRow.push(currentField.trim()); currentField = ''; }
      else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f !== '')) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\r') {
        // skip carriage return (handle \r\n)
      } else { currentField += char; }
    }
  }
  // Push last line if any
  if (currentField || currentRow.length) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== '')) rows.push(currentRow);
  }
  return rows;
}

// ---------- Question Validator ----------
function parseQuestions(csvText, filename) {
  if (!csvText || csvText.trim().length === 0) {
    console.warn(`⚠️ CSV file "${filename}" is empty. Skipping.`);
    return [];
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    console.warn(`⚠️ CSV file "${filename}" has no data rows. Skipping.`);
    return [];
  }

  // Validate header
  const header = rows[0].map(h => h.toLowerCase().trim());
  const expectedHeaders = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
  if (header.length < 7) {
    console.warn(`⚠️ CSV file "${filename}" has invalid header (expected 7 columns, got ${header.length}). Skipping.`);
    return [];
  }

  const questions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 7) {
      console.warn(`⚠️ Row ${i + 1} in "${filename}" is malformed (only ${row.length} columns). Skipping.`);
      continue;
    }

    const correctAnswer = row[5].toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      console.warn(`⚠️ Row ${i + 1} in "${filename}" has invalid correct_answer "${row[5]}". Skipping.`);
      continue;
    }

    questions.push({
      question: row[0],
      options: {
        A: row[1],
        B: row[2],
        C: row[3],
        D: row[4],
      },
      correctAnswer: correctAnswer,
      explanation: row[6] || '',
    });
  }

  return questions;
}

// ---------- Fisher-Yates Shuffle ----------
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ---------- Toast Notifications ----------
function showToast(message, type = 'error') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// ---------- View Management ----------
function showView(viewName) {
  const views = { subjects: dom.viewSubjects, quizzes: dom.viewQuizzes, quiz: dom.viewQuiz, results: dom.viewResults };
  for (const [name, el] of Object.entries(views)) {
    el.classList.remove('active');
    el.classList.add('hidden');
  }
  const target = views[viewName];
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
    // Re-trigger fadeIn animation
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
  }
  appState.view = viewName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- Load Subjects ----------
async function loadSubjects() {
  dom.subjectsError.classList.add('hidden');
  dom.subjectsGrid.innerHTML = '';

  try {
    const resp = await fetch('subjects.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    appState.subjects = data.subjects || [];

    if (appState.subjects.length === 0) {
      dom.subjectsError.classList.remove('hidden');
      $('.error-msg').textContent = 'No subjects found. Add CSV files to the subjects/ folder.';
      return;
    }

    renderSubjects();
  } catch (err) {
    console.error('Failed to load subjects.json:', err);
    dom.subjectsError.classList.remove('hidden');
  }
}

// ---------- Render Subjects ----------
function renderSubjects() {
  dom.subjectsGrid.innerHTML = '';
  for (const subject of appState.subjects) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.id = `subject-${subject.slug}`;

    const quizCount = subject.quizzes.length;
    card.innerHTML = `
      <span class="card-icon">${getSubjectIcon(subject.name)}</span>
      <div class="card-title">${escapeHTML(subject.name)}</div>
      <div class="card-meta">${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}</div>
    `;

    card.addEventListener('click', () => openSubject(subject));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openSubject(subject); });
    dom.subjectsGrid.appendChild(card);
  }
}

// ---------- Open Subject ----------
function openSubject(subject) {
  appState.currentSubject = subject;
  dom.quizzesTitle.textContent = subject.name;
  renderQuizzes(subject);
  showView('quizzes');
}

// ---------- Render Quizzes ----------
function renderQuizzes(subject) {
  dom.quizzesGrid.innerHTML = '';
  for (const quiz of subject.quizzes) {
    const card = document.createElement('div');
    card.className = 'quiz-card-item';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.id = `quiz-${subject.slug}-${quiz.file.replace(/\.csv$/i, '')}`;

    card.innerHTML = `
      <div class="card-title">${escapeHTML(quiz.name)}</div>
      <div class="card-meta">${escapeHTML(quiz.file)}</div>
    `;

    card.addEventListener('click', () => startQuiz(subject, quiz));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') startQuiz(subject, quiz); });
    dom.quizzesGrid.appendChild(card);
  }
}

// ---------- Start Quiz ----------
async function startQuiz(subject, quiz) {
  appState.currentSubject = subject;
  appState.currentQuiz = quiz;
  appState.currentQuestionIndex = 0;
  appState.userAnswers = [];

  const csvPath = `subjects/${encodeURIComponent(subject.name)}/${encodeURIComponent(quiz.file)}`;

  try {
    const resp = await fetch(csvPath);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const csvText = await resp.text();
    const questions = parseQuestions(csvText, quiz.file);

    if (questions.length === 0) {
      showToast('⚠️ This quiz has no valid questions.');
      return;
    }

    appState.questions = shuffleArray(questions);
    appState.userAnswers = new Array(appState.questions.length).fill(null);

    showView('quiz');
    renderQuestion();
  } catch (err) {
    console.error('Failed to load quiz CSV:', err);
    showToast('⚠️ Failed to load quiz data. Check your connection.');
  }
}

// ---------- Render Question ----------
function renderQuestion() {
  const idx = appState.currentQuestionIndex;
  const total = appState.questions.length;
  const q = appState.questions[idx];

  // Progress
  const pct = ((idx + 1) / total) * 100;
  dom.progressFill.style.width = `${pct}%`;
  dom.quizProgress.textContent = `Question ${idx + 1}/${total}`;

  // Question text
  dom.quizQuestion.textContent = q.question;

  // Options
  dom.quizOptions.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  for (const letter of letters) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('data-letter', letter);
    btn.id = `option-${letter}`;

    if (appState.userAnswers[idx] === letter) {
      btn.classList.add('selected');
    }

    btn.innerHTML = `
      <span class="option-letter">${letter}</span>
      <span class="option-text">${escapeHTML(q.options[letter])}</span>
    `;

    btn.addEventListener('click', () => selectOption(letter));
    dom.quizOptions.appendChild(btn);
  }

  // Show/hide nav buttons
  const isLast = idx === total - 1;
  if (isLast) {
    dom.btnNext.classList.add('hidden');
    dom.btnSubmit.classList.remove('hidden');
    dom.btnSubmit.disabled = appState.userAnswers[idx] === null;
  } else {
    dom.btnSubmit.classList.add('hidden');
    dom.btnNext.classList.remove('hidden');
    dom.btnNext.disabled = appState.userAnswers[idx] === null;
  }
}

// ---------- Select Option ----------
function selectOption(letter) {
  const idx = appState.currentQuestionIndex;
  appState.userAnswers[idx] = letter;

  // Update visual state
  const optionBtns = dom.quizOptions.querySelectorAll('.option-btn');
  optionBtns.forEach((btn) => {
    btn.classList.toggle('selected', btn.getAttribute('data-letter') === letter);
  });

  // Enable nav button
  const isLast = idx === appState.questions.length - 1;
  if (isLast) {
    dom.btnSubmit.disabled = false;
  } else {
    dom.btnNext.disabled = false;
  }
}

// ---------- Next Question ----------
function nextQuestion() {
  if (appState.currentQuestionIndex < appState.questions.length - 1) {
    appState.currentQuestionIndex++;
    renderQuestion();
  }
}

// ---------- Submit Quiz ----------
function submitQuiz() {
  showView('results');
  renderResults();
}

// ---------- Render Results ----------
function renderResults() {
  const questions = appState.questions;
  const answers = appState.userAnswers;
  let correctCount = 0;

  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctAnswer) correctCount++;
  }

  const total = questions.length;
  const pct = Math.round((correctCount / total) * 100);

  // Score display
  dom.resultsScore.innerHTML = `
    <span class="score-number">${correctCount}</span>
    <span class="score-divider">/</span>
    <span class="score-total">${total}</span>
  `;
  dom.resultsPercentage.textContent = `${pct}%`;

  // Color the score based on performance
  const scoreNumEl = dom.resultsScore.querySelector('.score-number');
  if (pct >= 70) {
    scoreNumEl.style.color = 'var(--correct)';
  } else if (pct >= 40) {
    scoreNumEl.style.color = 'var(--accent)';
  } else {
    scoreNumEl.style.color = 'var(--wrong)';
  }

  // Detail cards
  dom.resultsDetails.innerHTML = '';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const userAns = answers[i];
    const isCorrect = userAns === q.correctAnswer;

    const card = document.createElement('div');
    card.className = `result-card ${isCorrect ? 'correct' : 'wrong'}`;
    card.id = `result-${i}`;

    const optionLetterToText = (letter) => letter ? `${letter}. ${q.options[letter]}` : 'Not answered';

    let bodyHTML = `
      <div class="result-answer-row">
        <span class="result-label">Your answer:</span>
        <span class="result-value ${isCorrect ? 'is-correct' : 'is-wrong'}">${escapeHTML(optionLetterToText(userAns))}</span>
      </div>
    `;

    if (!isCorrect) {
      bodyHTML += `
        <div class="result-answer-row">
          <span class="result-label">Correct answer:</span>
          <span class="result-value is-correct">${escapeHTML(optionLetterToText(q.correctAnswer))}</span>
        </div>
      `;
    }

    if (q.explanation && q.explanation.trim()) {
      bodyHTML += `<div class="result-explanation">${escapeHTML(q.explanation)}</div>`;
    }

    card.innerHTML = `
      <div class="result-card-header">
        <span class="result-q-num">${i + 1}.</span>
        <span class="result-q-text">${escapeHTML(q.question)}</span>
        <span class="result-status">${isCorrect ? '✅' : '❌'}</span>
        <span class="chevron-icon">▼</span>
      </div>
      <div class="result-card-body">${bodyHTML}</div>
    `;

    // Toggle expand/collapse
    card.querySelector('.result-card-header').addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    dom.resultsDetails.appendChild(card);
  }
}

// ---------- Retake Quiz ----------
function retakeQuiz() {
  appState.questions = shuffleArray(appState.questions);
  appState.currentQuestionIndex = 0;
  appState.userAnswers = new Array(appState.questions.length).fill(null);
  showView('quiz');
  renderQuestion();
}

// ---------- Escape HTML ----------
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Event Listeners ----------
function bindEvents() {
  dom.btnRetry.addEventListener('click', loadSubjects);
  dom.btnBackSubjects.addEventListener('click', () => showView('subjects'));
  dom.btnBackQuizzes.addEventListener('click', () => {
    showView('quizzes');
  });
  dom.btnNext.addEventListener('click', nextQuestion);
  dom.btnSubmit.addEventListener('click', submitQuiz);
  dom.btnRetake.addEventListener('click', retakeQuiz);
  dom.btnBackHome.addEventListener('click', () => {
    appState.currentSubject = null;
    appState.currentQuiz = null;
    appState.questions = [];
    appState.userAnswers = [];
    showView('subjects');
  });
  dom.logoHome.addEventListener('click', () => {
    appState.currentSubject = null;
    appState.currentQuiz = null;
    appState.questions = [];
    appState.userAnswers = [];
    showView('subjects');
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadSubjects();
});
