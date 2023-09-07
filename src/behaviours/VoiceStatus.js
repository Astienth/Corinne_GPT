const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const VoiceCreator = require('../utils/VoiceCreator');
const discordVoice = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const HercAi = require('../utils/HercAi');
const Deepgram = require('../utils/Deepgram');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior, EndBehaviorType } = require('@discordjs/voice');
const fs = require('fs');

const voiceStatus = {
    bonjour: 'Coucou les loulous, c\'est Corinne Gépété !',
    voiceConnection: null,
    channel: null,
    audioPlayer: null,
    channelUsers: null, // Collection
    audioPipe: null,
    botSpeaking: false,
    selectedUser: null,

    // EVENTS
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
    onBotSpeaking: function() {
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Playing, function() {
            console.log('Bot is speaking');
            this.botSpeaking = true;
        });
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Idle, function() {
            console.log('Bot is NOT speaking');
            this.botSpeaking = false;
        });
    },
    onReady: function() {
        // When player is ready again I guess, not when connected...
        this.voiceConnection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
            // forcing to avoid listening straight away
            this.botSpeaking = true;
            this.textToSpeechSend(this.bonjour);

            // listen to user
            /*
            this.selectedUser = this.getRandomUser();
            this.voiceConnection.receiver.speaking.on('start', function(userId) {
                if(!this.botSpeaking && this.selectedUser.user.id === userId) {
                    console.log('listening to user');
                    this.listenToUser(this.selectedUser);
                    this.selectedUser = this.getRandomUser();
                }
            });
            */
        });
    },
    onPlayerCreated: function() {
        this.audioPlayer.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata.title);
        });
    },

    // Manage Users
    addUser: function(user) {
        this.channelUsers[user.user.id] = user;
    },
    removeUser: function(user) {
        delete this.user[user.user.id];
    },
    getUsers: async function(channel) {
        const fetchedChannel = await channel.fetch(true);
        this.channelUsers = fetchedChannel.members;
        // remove bot 1148931901260828702
        this.channelUsers = this.channelUsers.filter(user => user.user.id != global.client.user.id);
    },
    getRandomUser: function() {
        return this.channelUsers.random();
    },

    // LISTEN AND REPLY
    getTextReply: async function(text) {
        return await HercAi.askHercAi(text);
    },
    listenToUser: async function(user) {
        const subscription = this.voiceConnection.receiver.subscribe(user.id, { end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        } });

        const buffer = [];
        const encoder = new OpusEncoder(48000, 2);

        subscription.on('data', chunk => {
            buffer.push(encoder.decode(chunk));
        });
        subscription.once('end', async () => {
            // Convert audio format
            const bufferAudio = Buffer.from(buffer);
            const text = Deepgram.convert(bufferAudio);
            console.log(text);

            // send to AI

            // send back to voice chat
        });
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

    // MAnage COnnection
    createConnection: async function(message) {
        discordVoice.joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        this.voiceConnection = discordVoice.getVoiceConnection(message.guild.id);
        // get users
        await this.getUsers(message.member.voice.channel);
    },
	destroyConnection: function() {
		if(this.voiceConnection) {
			this.voiceConnection.destroy();
			this.voiceConnection = null;
            this.SayBonjour = true;
		}
	},

    // INIT
    init: async function(message) {
        try {
            this.channel = message.member.voice.channel;
            await this.createConnection(message);

            // audioPlayer
            this.audioPlayer = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });
            this.voiceConnection.subscribe(this.audioPlayer);

            // start listeners
            this.onDisconnect();
            this.onReady();
            this.onBotSpeaking();
            this.onPlayerCreated();
        }
        catch (error) {
            console.log(error);
        }
    },

    // speech loop
    speechLoop: function() {
        // select and listen to user

        // create audio to text

        // submit text

        // text to speech

        // send to voice chat

        // manage status / time interval ?
    },
};

module.exports = voiceStatus;