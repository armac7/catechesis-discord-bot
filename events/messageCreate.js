const config = require('../globalConfig.js');
const { Events, MessageFlags, Message } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('ccc.db');

function getCCCPart(paragraph) {
	if (paragraph >= 1 && paragraph <= 1065) {
		return 'Part 1: The Profession of Faith';
	}
	else if (paragraph >= 1066 && paragraph <= 1845) {
		return 'Part 2: The Celebration of the Christian Mystery';
	}
	else if (paragraph >= 1846 && paragraph <= 2557) {
		return 'Part 3: Life in Christ';
	}
	else if (paragraph >= 2558 && paragraph <= 2865) {
		return 'Part 4: Christian Prayer';
	}
	else {
		return 'Unknown Part';
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		// if the message is from the bot, ignore
		if (message.author.bot) return;

		// Match all CCC <number> patterns, pulling citations from the message
		// (e.g. CCC 123, CCC 45, and CCC 123 would turn out as such [["CCC 123", "123"], ["CCC 45", "45"], ["CCC 123", "123"])
		// const matches = [...message.content.matchAll(/\bCCC\s+(\d{1,4})\b/gi)];
		const matches = [...message.content.matchAll(/\bCCC\s+(\d{1,4})(?:-(\d{1,4}))?\b/gi)];
		console.log(matches);
		if (matches.length === 0) return;

		// const paragraphNumbers = [];

		// for (const match in matches) {
		// 	console.log(match);
		// 	const start = parseInt(match[1]);
		// 	const end = match[2] ? parseInt(match[2]) : start;

		// 	for (let i = start; i <= end; i++) {
		// 		paragraphNumbers.push(i);
		// 	}
		// };
        
		// console.log(paragraphNumbers);

		// this then takes and converts the second entry (m[1]) to base ten in a set, which removes all duplicates
		// leaves us with [123, 45] and then the "..." turns it back into the array
		const paragraphNumbers = [...new Set(matches.map(m => parseInt(m[1], 10)))];
		// paragraphNumbers.push([...new Set(matches.map(m => parseInt(m[1], 10)))]);
		console.log(paragraphNumbers);

		let i = 0;
		for (const number of paragraphNumbers) {
			i++;
			if (i >= 10) {
				await message.reply({ content: '❌ Max amount of citations per message hit (5).', flags: MessageFlags.Ephemeral });
				return;
			}
			const stmt = db.prepare('SELECT text FROM catechism WHERE paragraph = ?');
			const row = stmt.get(number);
			const partName = getCCCPart(number);
			const embed = new EmbedBuilder()
				.setColor(0xFFE100)
				.setTitle(`📜 CCC ${number} - ${partName}`)
				.setDescription(row ? row.text : '❌ Paragraph not found.')
				.setFooter({
					text: `v${config.version} by armac7`,
					// eslint-disable-next-line comma-dangle
					iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
				});

			await message.reply({ embeds: [embed] });
		}
	},
};