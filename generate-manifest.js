#!/usr/bin/env node

/**
 * generate-manifest.js
 * Scans the ./subjects/ directory and writes a subjects.json manifest.
 * Run with: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const SUBJECTS_DIR = path.join(__dirname, 'subjects');
const OUTPUT_FILE = path.join(__dirname, 'subjects.json');

function prettifyName(filename) {
  // Remove .csv extension, then replace underscores and hyphens with spaces, then title-case each word
  const base = filename.replace(/\.csv$/i, '');
  return base
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function main() {
  if (!fs.existsSync(SUBJECTS_DIR)) {
    console.error(`Error: "${SUBJECTS_DIR}" directory not found.`);
    process.exit(1);
  }

  const entries = fs.readdirSync(SUBJECTS_DIR, { withFileTypes: true });
  const subjects = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const subjectName = entry.name;
    const subjectPath = path.join(SUBJECTS_DIR, subjectName);
    const files = fs.readdirSync(subjectPath).filter((f) => f.toLowerCase().endsWith('.csv'));

    if (files.length === 0) {
      console.warn(`Warning: Subject "${subjectName}" has no CSV files, skipping.`);
      continue;
    }

    const quizzes = files.map((f) => ({
      file: f,
      name: prettifyName(f),
    }));

    subjects.push({
      name: subjectName,
      slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
      quizzes: quizzes,
    });
  }

  // Sort subjects alphabetically for consistency
  subjects.sort((a, b) => a.name.localeCompare(b.name));

  const manifest = { subjects };

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`✅ subjects.json written successfully with ${subjects.length} subject(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Error writing subjects.json:', err.message);
    process.exit(1);
  }
}

main();
