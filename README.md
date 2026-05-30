<div align="center">
  <h1>✨ Premium Mock-Test Platform ✨</h1>
  <p>A beautiful, fully-responsive, and self-updating quiz platform built with pure HTML, CSS, and vanilla JS.</p>

  [![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-181717?style=for-the-badge&logo=github)](#)
  [![UI](https://img.shields.io/badge/UI-Glassmorphism-00d2ff?style=for-the-badge)](#)
  [![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)](#)
</div>

<br />

## 🌟 Overview

Welcome to the **Mock-Test Platform**! This project is a modern, high-performance web application designed to host multiple-choice question (MCQ) quizzes. 

What makes it special? **Zero build tools, zero frameworks, and an automated CI/CD pipeline.** Simply upload a CSV file to GitHub, and the site automatically updates itself!

## 🚀 Key Features

- **🎨 Premium UI/UX:** Stunning glassmorphism design with an animated background, custom color gradients, and micro-interactions.
- **⚡ Blazing Fast:** Built entirely with vanilla JavaScript, HTML, and CSS. No React, no NPM, no heavy bundles.
- **🤖 Automated Updates:** Powered by GitHub Actions and a Node.js manifest generator. Adding a new quiz is as simple as pushing a CSV file.
- **📱 Fully Responsive:** Works flawlessly on desktops, tablets, and mobile devices.
- **🧠 Smart Review:** Detailed results screen with correct/incorrect answers and explanations.

---

## 📂 Project Structure

```text
/
├── index.html                # Single-page application shell
├── style.css                 # Glassmorphism design system
├── script.js                 # Core quiz engine & CSV parser
├── generate-manifest.js      # Node.js script to auto-generate the catalog
├── subjects.json             # Auto-generated catalog (Do not edit manually)
├── .github/workflows/        # CI/CD pipeline for GitHub Pages
└── subjects/                 # 📁 Put your CSV files here!
    ├── Mathematics/
    │   ├── algebra.csv
    │   └── calculus.csv
    └── Science/
        └── physics.csv
```

---

## 📝 How to Add a New Subject or Quiz

Because of the built-in automation, updating the site requires zero coding. 

### Step 1: Create the Folder
Navigate to the `subjects/` folder and create a new directory for your subject (e.g., `History`). This folder name will appear exactly as typed on the homepage.

### Step 2: Create the CSV File
Inside your subject folder, create a `.csv` file (e.g., `world_war_2.csv`). The file name will be automatically formatted into the quiz name (e.g., "World War 2").

### Step 3: Format Your CSV
Your CSV **MUST** have the following exact header on the first line:
```csv
question,option_a,option_b,option_c,option_d,correct_answer,explanation
```

**Rules:**
- Wrap text containing commas in double-quotes `" "`.
- `correct_answer` must be a single uppercase letter (`A`, `B`, `C`, or `D`).
- `explanation` is optional.

*Example:*
```csv
question,option_a,option_b,option_c,option_d,correct_answer,explanation
"What is 2+2?","3","4","5","6",B,"Basic addition: 2+2=4"
```

### Step 4: Push to GitHub!
Upload your new folder and CSV file to GitHub. The GitHub Actions workflow will instantly run, update the `subjects.json` manifest, and deploy your new quiz to the live site within 60 seconds!

---

## 🤖 AI Prompt for Quick CSV Creation

Have a screenshot or a PDF of a test? Use this prompt with ChatGPT, Claude, or Gemini to instantly convert it into the correct CSV format:

> *"I have uploaded an image containing Multiple Choice Questions. Read the text and convert it directly into a strict CSV format. Do not use markdown wrappers. Output ONLY raw CSV text. The first line MUST be: `question,option_a,option_b,option_c,option_d,correct_answer,explanation`. Extract exactly 4 options. Ignore prefixes like 'A)' or '1.'. If the correct answer isn't marked, use your knowledge to provide the correct letter (A, B, C, D). If there is no explanation, write a 1-sentence explanation yourself. You MUST wrap the question, all 4 options, and the explanation in double-quotes. Do NOT wrap the correct_answer letter in quotes. Double-escape any internal quotes."*

---

## 💻 Local Development

Want to test the site on your machine? 

1. **Clone the repo**
   ```bash
   git clone https://github.com/Tusarkanta-07/mock-test.git
   ```
2. **Update the Manifest** (If you added new CSVs locally)
   ```bash
   node generate-manifest.js
   ```
3. **Start a local server**
   You can use any static server. For example:
   ```bash
   npx serve .
   ```
   *Then open `http://localhost:3000` in your browser.*

---
<div align="center">
  <p>Built with ❤️</p>
</div>
