# Architecture & AI Context Guide

> **AI INSTRUCTION:** If you are an AI assistant starting a new session on this repository, **read this file first**. Do NOT read the full `.js`, `.css`, or `.html` files unless the user explicitly requests changes to them. This file contains the entire state and structure of the app to save context tokens.

## 1. Core Architecture
- **Tech Stack:** Vanilla JavaScript, HTML5, Vanilla CSS (No build tools, no React, no Tailwind, no NPM dependencies).
- **Hosting/CI:** Deployed automatically to GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`).
- **Data Source:** Static `.csv` files stored in subject-specific folders inside `/subjects/`.
- **Manifest Generator:** A Node.js script (`generate-manifest.js`) scans the CSVs and outputs `subjects.json`, which acts as the database for the frontend.

## 2. File Structure
- `index.html`: The SPA shell. Contains 4 views toggled via CSS `.hidden` and `.active` classes:
  - `#view-subjects`
  - `#view-quizzes`
  - `#view-quiz` (The actual test)
  - `#view-results`
- `style.css`: Uses CSS Variables (`:root`) for a "Glassmorphism" theme. 
  - Accent color: `#00d2ff`
  - Background: dark purple gradient `#0f0c29` -> `#24243e`.
- `script.js`: Contains all application logic and state.

## 3. State Management
The application relies on a single, global `appState` object in `script.js`:
```javascript
const appState = {
  view: 'subjects',
  subjects: [],            // Loaded from subjects.json
  currentSubject: null,
  currentQuiz: null,
  questions: [],           // Parsed and shuffled from the chosen CSV
  currentQuestionIndex: 0,
  userAnswers: [],         // Array matching questions length, stores 'A', 'B', 'C', or 'D'
};
```

## 4. Custom CSV Parser
The project uses a custom, robust CSV parser (`parseCSV` function in `script.js`) that handles:
- Commas inside double-quotes.
- Missing trailing newlines.
- Empty rows.
**Row Format Required:** `question,option_a,option_b,option_c,option_d,correct_answer,explanation`
**Validation:** `correct_answer` must be precisely `A`, `B`, `C`, or `D`.

## 5. UI Behaviors
- **Shuffle:** Questions are randomized on load via Fisher-Yates (`shuffleArray`). Options are **not** shuffled.
- **Results Screen:** Calculates the score and renders expandable accordion cards for every question, highlighting the correct option and revealing the explanation.

## 6. Development Rules
- **DO NOT** rewrite the CSV parser. It is specifically designed to handle the user's quoted-comma edge cases.
- **DO NOT** add build tools (Webpack, Vite) or frameworks (React, Vue). The strict requirement is zero dependencies.
