const Database = require('better-sqlite3');
const fs = require('fs');

// Load JSON data as an array of { id, text }
const cccData = JSON.parse(fs.readFileSync('./json/catechism.json', 'utf8'));
const heresyData = JSON.parse(fs.readFileSync('./json/heresy.json', 'utf8'));
const councilData = JSON.parse(fs.readFileSync('./json/councils.json', 'utf8'));

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
	if (!entry || !entry.id || !entry.text) continue;
	insert.run(entry.id, entry.text);
}

// eslint-disable-next-line no-unused-vars
const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');


db.exec(`
  CREATE TABLE IF NOT EXISTS heresies (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    condemned_at TEXT,
    key_figures TEXT,
    response TEXT,
    info TEXT,
    reference TEXT
  );
`);

const insertHeresy = db.prepare(`
    INSERT OR REPLACE INTO heresies (slug, name, summary, condemned_at, key_figures, response, info, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

for (const [slug, heresy] of Object.entries(heresyData)) {
	if (!heresy.name || !heresy.summary) continue;

	insertHeresy.run(
		slug,
		heresy.name,
		heresy.summary,
		heresy.condemnedAt || '',
		(heresy.keyFigures || []).join(', '),
		heresy.response || '',
		heresy.info || '',
		// eslint-disable-next-line comma-dangle
		(heresy.reference || []).join(', ')
	);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS councils (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    year TEXT,
    key_figures TEXT,
    response TEXT,
    info TEXT
  );
`);

const insertCouncil = db.prepare(`
    INSERT OR REPLACE INTO councils (slug, name, summary, year, key_figures, response, info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

for (const [slug, council] of Object.entries(councilData)) {
	if (!council.name || !council.summary) continue;

	insertCouncil.run(
		slug,
		council.name,
		council.summary,
		council.year || '',
		(council.keyFigures || []).join(', '),
		council.response || '',
		council.info || '',
	);
}

console.log('CCC database created successfully.');