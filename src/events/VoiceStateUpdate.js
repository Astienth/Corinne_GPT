const { Events } = require('discord.js');

const VoiceStateUpdate = {
	name: Events.VoiceStateUpdate,
	async execute(oldVoiceState, newVoiceState) {
        // The member connected to a channel.
		if (newVoiceState.channel) {
            console.log(`${newVoiceState.member.user.tag} connected to ${newVoiceState.channel.name}.`);
        }
        // The member disconnected from a channel.
        else if (oldVoiceState.channel) {
            console.log(`${oldVoiceState.member.user.tag} disconnected from ${oldVoiceState.channel.name}.`);
        }
	},
};

module.exports = VoiceStateUpdate;