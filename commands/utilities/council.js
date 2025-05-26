const { SlashCommandBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const { EmbedBuilder } = require('discord.js');

const db = new Database('ccc.db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('council')
		.setDescription('Provides information on various the various ecumenical councils of the Catholic Church')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Name of the council to look up')
			// eslint-disable-next-line comma-dangle
				.setRequired(false)
		),
	async execute(interaction) {
		const input = interaction.options.getString('name');

		if (input) {
			console.log(input);
			const query = db.prepare('SELECT * FROM councils WHERE name LIKE ? COLLATE NOCASE');
			const results = query.get(`%${input}%`);
			console.log(results);

			if (results) {
				console.log(results);

				let keyFiguresArray = [];
				// console.log(result.key_figures);
				if (results.key_figures) {
					try {
						const parsed = JSON.parse(results.key_figures);
						// console.log(result.parsed);
						if (Array.isArray(parsed)) {
							keyFiguresArray = parsed;
						}
						else if (typeof parsed === 'string') {
							keyFiguresArray = [parsed];
						}
					}
					catch {
						keyFiguresArray = [results.key_figures];
					}
				}

				const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 ${results.name} - ${results.year} Anno Domini`)
					.setDescription(results.summary)
					.addFields(
						{ name: 'Key Figures', value: keyFiguresArray.length ? keyFiguresArray.join(', ') : 'N/A' },
						{ name: 'Church Response', value: results.response || 'N/A' },
						{ name: 'Additional Info', value: results.info || 'N/A' },
					)
					.setFooter({
						text: 'BishopBot v1.1.0 by armac7',
						// eslint-disable-next-line comma-dangle
						iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
					});

				await interaction.reply({ embeds: [embed] });
				return;
			}
			else {
				await interaction.reply(`❌ No council found matching **"${input}"**.`);
			};
		}
		else {
			const stmt = db.prepare('SELECT name, slug FROM councils ORDER BY CAST(year AS INTEGER) ASC');
			const results = stmt.all();

			if (!results.length) {
				await interaction.reply('❌ No councils found in the database.');
				return;
			};

			const embed = new EmbedBuilder()
				.setColor(0xFFE100)
				.setTitle('📜 List of Councils')
				.setDescription(results.map(h => `${h.name}`).join('\n'))
				.setFooter({
					text: 'BishopBot v1.1.0 by armac7',
					// eslint-disable-next-line comma-dangle
					iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
				});

			await interaction.reply({ embeds: [embed] });

		};
	},
};