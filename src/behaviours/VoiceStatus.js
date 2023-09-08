const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const VoiceCreator = require('../utils/VoiceCreator');
const discordVoice = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const HercAi = require('../utils/HercAi');
const Deepgram = require('../utils/Deepgram');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior, EndBehaviorType } = require('@discordjs/voice');

const voiceStatus = {
    // eslint-disable-next-line quotes
    bonjour: "Bonjour",
    voiceConnection: null,
    channel: null,
    audioPlayer: null,
    channelUsers: null,
    botSpeaking: false,
    selectedUser: null,
    triggerWords: ['corinne', 'corrine', 'corine', 'corrinne'],

    // EVENTS
    startListeners: function() {
        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, this.onDisconnect.bind(this));
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Playing, this.onBotSpeaking.bind(this, true));
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Idle, this.onBotSpeaking.bind(this, false));
        this.voiceConnection.on(VoiceConnectionStatus.Ready, this.onReady.bind(this));
        this.voiceConnection.receiver.speaking.on('start', this.onUserSpeaking.bind(this));
        this.onPlayerCreated();
    },
    onDisconnect: async function() {
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
    },
    onBotSpeaking: function(state) {
         this.botSpeaking = state;
         console.log('BOT SPEAKING ' + this.botSpeaking);
    },
    onReady: async function() {
        console.log('Connection is in the Ready state!');
        // forcing to avoid listening straight away
        this.selectedUser = this.getRandomUser();
        this.botSpeaking = true;
        await this.textToSpeechSend(this.bonjour);
    },
    onUserSpeaking: function(userId) {
        console.log(this.selectedUser.user.username);
        if(!this.botSpeaking && this.selectedUser.user.id === userId) {
            console.log('LISTENING TO USER');
            this.botSpeaking = true;
            this.listenToUser(userId);
            this.selectedUser = this.getRandomUser();
        }
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
    listenToUser: async function(userId) {
        const subscription = this.voiceConnection.receiver.subscribe(userId, { end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        } });

        subscription.once('end', async () => {
            const mp3Path = await Deepgram.convertPCMtoMP3(audioFilePath);
            try {
                const text = await Deepgram.convert(mp3Path, 'audio/mp3');
                console.log('Result deepgram ' + text);

                // send to AI only on some conditions
                // TODO listen to all users and use trigger words to start
                // && this.triggerWords.some(v => text.includes(v))
                if(text != '') {
                    const reply = await HercAi.askHercAi(text);
                    console.log('Reply HercAi ' + reply);
                    // send back to voice chat
                    await this.textToSpeechSend(reply);
                }
            }
            catch (err) {
                console.log(err);
                this.botSpeaking = false;
            }
        });

        const audioFilePath = await Deepgram.recordAudio(subscription);
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

    // Manage COnnection
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
            this.channel = null;
            this.audioPlayer = null;
            this.channelUsers = null;
            this.botSpeaking = false;
            this.selectedUser = null;
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
            this.startListeners();
        }
        catch (error) {
            console.log(error);
        }
    },
};

module.exports = voiceStatus;