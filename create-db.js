const Database = require('better-sqlite3');
const fs = require('fs');

// Load JSON data as an array of { id, text }
const cccData = JSON.parse(fs.readFileSync('./json/catechism.json', 'utf8'));

// Create SQLite database
const db = new Database('ccc.db');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS catechism (
    paragraph INTEGER PRIMARY KEY,
    text TEXT NOT NULL
  );
`);

// Prepare insert statement
const insert = db.prepare('INSERT OR REPLACE INTO catechism (paragraph, text) VALUES (?, ?)');

// Loop through the array and insert entries
for (const entry of cccData) {
  if (!entry || !entry.id || !entry.text) continue; // skip invalid
  insert.run(entry.id, entry.text);
}

console.log('CCC database created successfully.');