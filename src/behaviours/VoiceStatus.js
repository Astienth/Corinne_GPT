const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const VoiceCreator = require('../utils/VoiceCreator');
const discordVoice = require('@discordjs/voice');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const fs = require('fs');

const voiceStatus = {
    SayBonjour: true,
    bonjour: 'Bonjour, je suis Corinne Gépété et ça pue.',
    voiceConnection: null,
    channel: null,
    audioPlayer: null,
    channelUsers: {},
    audioPipe: null,
    onDisconnect: function() {
        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(this.voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel - ignore disconnect
            }
            catch (error) {
                // Seems to be a real disconnect which SHOULDN'T be recovered from
                this.voiceConnection.destroy();
            }
        });
    },
    onReady: function() {
        // When player is ready again I guess, not when connected...
        this.voiceConnection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
            if(this.SayBonjour) {
                this.textToSpeechSend(this.bonjour);
                this.SayBonjour = false;
            }
        });
    },
    onPlayerCreated: function() {
        this.audioPlayer.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata.title);
        });
    },
    createConnection: function(message) {
        discordVoice.joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        this.voiceConnection = discordVoice.getVoiceConnection(message.guild.id);
    },
    listenToUser: function(user) {
        // Create a ReadableStream of s16le PCM audio
        this.audioPipe = this.voiceConnection.receiver.createStream(user, { mode: 'pcm' });
        this.audioPipe.pipe(fs.createWriteStream('user_audio'));
    },
	destroyConnection: function() {
		if(this.voiceConnection) {
			this.voiceConnection.destroy();
			this.voiceConnection = null;
            this.SayBonjour = true;
		}
	},
    addUser: function(user) {
        this.channelUsers[user.user.id] = user;
    },
    removeUser: function(user) {
        delete this.user[user.user.id];
    },
    getUsers: async function(channel) {
        const fetchedChannel = await channel.fetch(true);
        this.channelUsers = fetchedChannel.members;
        // remove bot
        console.log(global.client.user.id);
        delete this.channelUsers[global.client.user.id];
    },
    textToSpeechSend: async function(text) {
        // check if channel exists
        if(!this.voiceConnection || !this.channel) return;

        // create mp3
        const file = await VoiceCreator.createAudio(text);

        // send mp3 to channel
        const resource = createAudioResource(file);
        this.audioPlayer.play(resource);
    },
    init: async function(message) {
        try {
            this.channel = message.member.voice.channel;
            this.createConnection(message);
            this.audioPlayer = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
            this.onPlayerCreated();
            this.voiceConnection.subscribe(this.audioPlayer);

            // start listeners
            this.onDisconnect();
            this.onReady();

            // get users
            await this.getUsers(message.member.voice.channel);
        }
        catch (error) {
            console.log(error);
        }
    },
};

module.exports = voiceStatus;