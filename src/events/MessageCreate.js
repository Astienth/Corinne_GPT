const { Events } = require('discord.js');
const discordVoice = require('@discordjs/voice');

const MessageCreate = {
	voiceChannel: null,
	name: Events.MessageCreate,
	async execute(message) {
		// Join the same voice channel of the author of the message
		if (message.content === '!join') {
			if (message.member.voice.channel) { 
				discordVoice.joinVoiceChannel({
					channelId: message.member.voice.channel.id,
					guildId: message.guild.id,
					adapterCreator: message.guild.voiceAdapterCreator,
				});
				this.voiceChannel = discordVoice.getVoiceConnection(message.guild.id);
			}
		}

		if (message.content === '!logout') {
            if(this.voiceChannel) {
                this.voiceChannel.destroy();
                this.voiceChannel = null;
            }
		}
	},
};

module.exports = MessageCreate;