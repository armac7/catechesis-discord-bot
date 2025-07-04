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

		const matches = [...message.content.matchAll(/\bCCC\s+(\d{1,4})(?:-(\d{1,4}))?\b/gi)];
		if (matches.length === 0) return;

		// Separate singles and ranges
		const singles = [];
		const ranges = [];

		for (const match of matches) {
			const start = parseInt(match[1], 10);
			const end = match[2] ? parseInt(match[2], 10) : null;

			if (end === null) {
				// Single paragraph
				singles.push(start);
			} else {
				if (end >= start) {
					ranges.push([start, end]);
				} else {
					// Invalid range, ignore or handle error if you want
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
	},
};
