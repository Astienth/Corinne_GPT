const { Events } = require('discord.js');

const ready = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};

module.exports = ready;