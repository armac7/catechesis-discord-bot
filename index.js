const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./globalConfig.js');
// const { token } = require('./config.json');

dotenv.config();

const token = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Code for command handling
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

// Code for event handling
// --------------------------------------------------------------------------------
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Log in to Discord with your client's token
client.login(token);