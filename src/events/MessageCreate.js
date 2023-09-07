const { Events } = require('discord.js');
const voiceStatus = require('../behaviours/VoiceStatus');

const MessageCreate = {
	name: Events.MessageCreate,
	authorized: ['188033772434882560', '331701285277401088'],
	async execute(message) {
		if(message.author.id == '323788974416199680') {
			// do whatever makes Sylvain crazy
			return;
		}
		if(!this.authorized.includes(message.author.id)) {
			return;
		}
		// Join the same voice channel of the author of the message
		if (message.content === '!join') {
			if (message.member.voice.channel) {
				voiceStatus.init(message);
			}
		}

		if (message.content === '!logout') {
			voiceStatus.destroyConnection();
		}
	},
};

module.exports = MessageCreate;