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
				.setRequired(false) // optional argument
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

				if (result.key_figures) {
					try {
						const parsed = JSON.parse(result.key_figures);
						if (Array.isArray(parsed)) {
							keyFiguresArray = parsed;
						} else if (typeof parsed === 'string') {
							keyFiguresArray = [parsed];
						}
					} catch {
						keyFiguresArray = [result.key_figures];
					}
				}

				const embed = new EmbedBuilder()
					.setColor(0xFFE100)
					.setTitle(`📜 ${result.slug} - Heresy`)
					.setDescription(result.summary)
					.addFields(
						{ name: 'Condemned At', value: result.condemned_at || 'N/A' },
						{ name: 'Key Figures', value: keyFiguresArray.length ? keyFiguresArray.join(', ') : 'N/A' },
						{ name: 'Church Response', value: result.response || 'N/A' },
						{ name: 'Additional Info', value: result.info || 'N/A' }
					)
					.setFooter({
						text: 'BishopBot v1.1.0 by armac7',
						iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Emblem_of_the_Papacy_SE.svg/120px-Emblem_of_the_Papacy_SE.svg.png' // Vatican coat of arms
					});

				await interaction.reply({ embeds: [embed] });
			} else {
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
				.setDescription(results.map(h => `${h.slug}`).join('\n'))
				.setFooter({
					text: 'BishopBot v1.1.0 by armac7',
					iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Emblem_of_the_Papacy_SE.svg/120px-Emblem_of_the_Papacy_SE.svg.png' // Vatican coat of arms
				});

				await interaction.reply({ embeds: [embed] });

		}
	},
};