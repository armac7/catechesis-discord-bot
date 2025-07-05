const { Events, MessageFlags } = require('discord.js');
const Database = require('better-sqlite3');
const db = new Database('ccc.db');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Handles autocomplete
		if (interaction.isAutocomplete()) {
			const commandName = interaction.commandName;
			const focusedOption = interaction.options.getFocused(true);
			
			// if the command called is heresy and the option focused is name, 
			if (commandName === 'heresy' && focusedOption.name === 'name') {
				// grabs the current input
				const focusedValue = focusedOption.value;
				// grabs all the entries that are similar to focusedValue
				const rows = db.prepare(`
					SELECT name FROM heresies
					WHERE name LIKE ?
					LIMIT 25
				`).all(`${focusedValue}%`);
				
				// responds with the rows
				await interaction.respond(
					rows.length
						? rows.map(row => ({ name: row.name, value: row.name }))
						: [{ name: 'No matches found', value: 'no_match' }]
				);
				return;
			}

			// same as above
			if (commandName === 'council' && focusedOption.name === 'name') {
				const focusedValue = focusedOption.value;
				const rows = db.prepare(`
					SELECT name FROM councils
					WHERE name LIKE ?
					LIMIT 25
				`).all(`${focusedValue}%`);

				await interaction.respond(
					rows.length
						? rows.map(row => ({ name: row.name, value: row.name }))
						: [{ name: 'No matches found', value: 'no_match' }]
				);
				return;
			}
		}

		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
			else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};