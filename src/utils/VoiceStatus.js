const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const discordVoice = require('@discordjs/voice');

const voiceStatus = {
    voiceConnection: null,
    channelUsers: {},
    onDisconnect: function() {
        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            } catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.voiceConnection.destroy();
            }
        });
    },
    onReady: function() {
        // When player is ready again I guess, not when connected...
        this.voiceConnection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
        });
    },
    createConnection: function(message) {
        discordVoice.joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        this.voiceConnection = discordVoice.getVoiceConnection(message.guild.id);
    },
	destroyConnection: function() {
		if(this.voiceConnection) {
			this.voiceConnection.destroy();
			this.voiceConnection = null;
		}
	},
    init: function(message) {
        try {
            this.createConnection(message);
            this.onDisconnect();
            // get users
            console.log(message);
            // start listening
        }
        catch (error) {
            console.log(error);
        }
    },
};

module.exports = voiceStatus;