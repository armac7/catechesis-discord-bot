const dotenv = require('dotenv');
const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
// const { token } = require('./config.json');

dotenv.config();

const token = process.env.token;

const db = new Database('ccc.db');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Code for handling commands
// --------------------------------------------------------------------------------
client.commands = new Collection();
// gets path to commands folder
const foldersPath = path.join(__dirname, 'commands');
// returns an array of the folders within the command folder
const commandFolders = fs.readdirSync(foldersPath);
// iterates through the folders
for (const folder of commandFolders) {
	const commandPath = path.join(foldersPath, folder);
	// returns an array of the folders within the folders within the command file.
	const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log('[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.');
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
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
});
// --------------------------------------------------------------------------------

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

// Code for handling passive message listening
// --------------------------------------------------------------------------------
const { EmbedBuilder } = require('discord.js');

// listens for all messages sent
client.on(Events.MessageCreate, async message => {
	// if the message is from the bot, ignore
	if (message.author.bot) return;

	// Match all CCC <number> patterns, pulling citations from the message
	// (e.g. CCC 123, CCC 45, and CCC 123 would turn out as such [["CCC 123", "123"], ["CCC 45", "45"], ["CCC 123", "123"])
	const matches = [...message.content.matchAll(/\bCCC\s+(\d{1,4})\b/gi)];
	if (matches.length === 0) return;

	// this then takes and converts the second entry (m[1]) to base ten in a set, which removes all duplicates
	// leaves us with [123, 45] and then the "..." turns it back into the array.
	const paragraphNumbers = [...new Set(matches.map(m => parseInt(m[1], 10)))];

	for (const number of paragraphNumbers) {
		const stmt = db.prepare('SELECT text FROM catechism WHERE paragraph = ?');
		const row = stmt.get(number);
		const partName = getCCCPart(number);
		const embed = new EmbedBuilder()
			.setColor(0xFFE100)
			.setTitle(`📜 CCC ${number} - ${partName}`)
			.setDescription(row ? row.text : '❌ Paragraph not found.')
			.setFooter({
				text: 'BishopBot v1.1.0 by armac7',
				// eslint-disable-next-line comma-dangle
				iconURL: 'https://raw.githubusercontent.com/armac7/catechesis-discord-bot/refs/heads/main/assets/imgs/bishop-bot.png'
			});

		await message.reply({ embeds: [embed] });
	}
});


// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
