const { SlashCommandBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const { EmbedBuilder } = require('discord.js');

const db = new Database('ccc.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('heresy')
		.setDescription('Provides information on various declared heresies by the Catholic Church')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Name of the heresy to look up')
				// eslint-disable-next-line comma-dangle
				.setRequired(false)
		),
	async execute(interaction) {
		const input = interaction.options.getString('name');

		if (input) {
			const stmt = db.prepare('SELECT * FROM heresies WHERE name LIKE ? COLLATE NOCASE');
			const result = stmt.get(`%${input}%`);

			if (result) {
				console.log(result);
				// Try to parse keyFigures safely (fallback to empty array)
				let keyFiguresArray = [];
				// console.log(result.key_figures);
				if (result.key_figures) {
					try {
						const parsed = JSON.parse(result.key_figures);
						// console.log(result.parsed);
						if (Array.isArray(parsed)) {
							keyFiguresArray = parsed;
						}
						else if (typeof parsed === 'string') {
							keyFiguresArray = [parsed];
						}
					}
					catch {
						keyFiguresArray = [result.key_figures];
					}
				}

				let referenceArray = [];
				console.log(result.reference);
				if (result.reference) {
					try {
						const parsed = JSON.parse(result.reference);
						// console.log(typeof parsed);
						if (Array.isArray(parsed)) {
							referenceArray = parsed;
						}
						else if (typeof parsed === 'string') {
							referenceArray = [parsed];
						}
						else if (typeof parsed === 'number') {
							referenceArray = [result.reference];
						}
					}
					catch {
						referenceArray = [result.reference];
						// console.log(referenceArray);
					}
				}

				const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 ${result.name} - Heresy`)
					.setDescription(result.summary)
					.addFields(
						{ name: 'Condemned At', value: result.condemned_at || 'N/A' },
						{ name: 'Key Figures', value: keyFiguresArray.length ? keyFiguresArray.join(', ') : 'N/A' },
						{ name: 'Church Response', value: result.response || 'N/A' },
						{ name: 'Additional Info', value: result.info || 'N/A' },
						{ name: 'CCC References', value: referenceArray.length ? referenceArray.join(', ') : 'N/A' },
					)
					.setFooter({
						text: 'BishopBot v1.1.0 by armac7',
						// eslint-disable-next-line comma-dangle
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

				await interaction.reply({ embeds: [embed] });
			}
			else {
				await interaction.reply(`❌ No heresy found matching **"${input}"**.`);
			}
		}
		else {
			const stmt = db.prepare('SELECT name, slug FROM heresies ORDER BY name ASC');
			const results = stmt.all();

			if (!results.length) {
				await interaction.reply('❌ No heresy found in database.');
				return;
			}


			const embed = new EmbedBuilder()
				.setColor(0xFFE100)
				.setTitle('📜 List of Heresies')
				.setDescription(results.map(h => `${h.name}`).join('\n'))
				.setFooter({
					text: 'BishopBot v1.1.0 by armac7',
					// eslint-disable-next-line comma-dangle
					iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
				});

			await interaction.reply({ embeds: [embed] });

		}
	},
};