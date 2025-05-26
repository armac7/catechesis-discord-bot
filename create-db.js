const Database = require('better-sqlite3');
const fs = require('fs');

// Load JSON data as an array of { id, text }
const cccData = JSON.parse(fs.readFileSync('./json/catechism.json', 'utf8'));
const heresyData = JSON.parse(fs.readFileSync('./json/heresy.json', 'utf8'));

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

const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');


db.exec(`
  CREATE TABLE IF NOT EXISTS heresies (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    condemned_at TEXT,
    key_figures TEXT,
    response TEXT,
    info TEXT
  );
`);

const insertHeresy = db.prepare(`
    INSERT OR REPLACE INTO heresies (name, slug, summary, condemned_at, key_figures, response, info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

for (const [slug, heresy] of Object.entries(heresyData)) {
	if (!heresy.name || !heresy.summary) continue; // basic validation

	insertHeresy.run(
		slug,
		heresy.name,
		heresy.summary,
		heresy.condemnedAt || '',
		(heresy.keyFigures || []).join(', '),
		heresy.response || '',
		heresy.info || ''
	);
}


console.log('CCC database created successfully.');