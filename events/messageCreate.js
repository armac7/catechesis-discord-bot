const config = require('../globalConfig.js');
const { Events, MessageFlags } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('ccc.db');

function getCCCPart(paragraph) {
	if (paragraph >= 1 && paragraph <= 1065) {
		return 'Part 1: The Profession of Faith';
	} else if (paragraph >= 1066 && paragraph <= 1845) {
		return 'Part 2: The Celebration of the Christian Mystery';
	} else if (paragraph >= 1846 && paragraph <= 2557) {
		return 'Part 3: Life in Christ';
	} else if (paragraph >= 2558 && paragraph <= 2865) {
		return 'Part 4: Christian Prayer';
	} else {
		return 'Unknown Part';
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;

		const matchesCCC = [...message.content.matchAll(/\bCCC\s+(\d{1,4})(?:-(\d{1,4}))?\b/gi)];
		const matchesCANON = [...message.content.matchAll(/\bCanon\s+(\d{1,4})\b/gi)];
		if (matchesCCC.length === 0 && matchesCANON.length === 0 ) return;
		
		// console.log(matchesCANON);

		if (matchesCCC.length !== 0) {
			// Separate singles and ranges
			const singles = [];
			const ranges = [];

			for (const match of matchesCCC) {
				const start = parseInt(match[1], 10);
				const end = match[2] ? parseInt(match[2], 10) : null;

				if (end === null) {
					// Single paragraph
					singles.push(start);
				} else {
					if (end >= start) {
						ranges.push([start, end]);
					} else {
						// Invalid range, ignore
					}
				}
			}

			// Remove duplicate singles and sort
			const uniqueSingles = [...new Set(singles)].sort((a, b) => a - b);

			// Process singles — one embed per paragraph
			for (const paraNum of uniqueSingles) {
				const stmt = db.prepare('SELECT text FROM catechism WHERE paragraph = ?');
				const row = stmt.get(paraNum);
				const partName = getCCCPart(paraNum);

				const spaces = '\u00A0\u00A0\u00A0\u00A0'; // Adjust spacing if you want
				const description = row ? `${spaces}${row.text}` : '❌ Paragraph not found.';

				const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 CCC ${paraNum} - ${partName}`)
					.setDescription(description)
					.setFooter({
						text: `v${config.version} by armac7`,
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

				await message.reply({ embeds: [embed] });
			}

			// Process ranges — combine each range into a single embed
			for (const [start, end] of ranges) {
				const length = end - start + 1;
				if (length > 10) {
					await message.reply({
						content: `❌ Range CCC ${start}-${end} is too large (max 10 paragraphs).`,
						flags: MessageFlags.Ephemeral,
					});
					continue;
				}

				let combinedText = '';
				for (let i = start; i <= end; i++) {
					const stmt = db.prepare('SELECT text FROM catechism WHERE paragraph = ?');
					const row = stmt.get(i);
					if (row) {
						combinedText += `**${i}**\u00A0\u00A0\u00A0\u00A0${row.text}\n\n`;
					} else {
						combinedText += `**${i}** ❌ Paragraph not found.\n\n`;
					}
				}

				const partName = getCCCPart(start);

				const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 CCC ${start}–${end} - ${partName}`)
					.setDescription(combinedText.length > 4000 ? combinedText.slice(0, 4000) + '\n\n...[truncated]' : combinedText)
					.setFooter({
						text: `v${config.version} by armac7`,
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

				await message.reply({ embeds: [embed] });
			}
		}

		if (matchesCANON.length !== 0) {
			// Separate singles and ranges
			// console.log("Inside if"); // DEBUG
			const matches = [];

			// Separates all matches by number only and pushes it to new array of just the number matches
			for (const match of matchesCANON) {
					matches.push(match[1]);
			}
			// console.log(matches); // DEBUG

			// Remove duplicate singles and sort
			const unique = [...new Set(matches)].sort((a, b) => a - b);

			// console.log(unique); // DEBUG

			// Process references
			for (const canonId of unique) {
				const stmt = db.prepare('SELECT * FROM canon WHERE id = ?');
				const row = stmt.get(canonId);

				const spaces = '\u00A0\u00A0\u00A0\u00A0'; // Adjust spacing if you want
				if ('text' in row && typeof row.text === 'string') {
					const text = row ? `${spaces}${row.text}` : '❌ Paragraph not found.';

					const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 Canon Law ${canonId}`)
					.setDescription(text)
					.setFooter({
						text: `v${config.version} by armac7`,
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

					await message.reply({ embeds: [embed] });
				} else { // if there is no text in the entry for the law, it means it has sections instead
					const stmt = db.prepare('SELECT * FROM canonSection WHERE canon_id = ?');
					const row = stmt.all(canonId);

					// console.log("Inside else if");

					let combinedText = '';
					for (const entry of row) {
						if (entry) {
							combinedText += `**${entry.id}. **\u00A0\u00A0\u00A0\u00A0${entry.text}\n\n`;
						} else {
							combinedText += `**${entry.id}** ❌ Paragraph not found.\n\n`;
						}
					}

					const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 Canon Law ${canonId}`)
					.setDescription(combinedText)
					.setFooter({
						text: `v${config.version} by armac7`,
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

					await message.reply({ embeds: [embed] });
				}
			}
		}
	},
};
