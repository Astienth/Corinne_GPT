const { VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const VoiceCreator = require('../utils/VoiceCreator');
const discordVoice = require('@discordjs/voice');
const HercAi = require('../utils/HercAi');
const Deepgram = require('../utils/Deepgram');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior, EndBehaviorType } = require('@discordjs/voice');

const voiceStatus = {
    // eslint-disable-next-line quotes
    bonjour: "Bonjour les loulous, je suis opérationelle et à votre service mais un peu lente, ne vous moquez pas sinon je vous banne",
    voiceConnection: null,
    channel: null,
    audioPlayer: null,
    channelUsers: null,
    botSpeaking: false,
    selectedUser: null,
    triggerWords: ['corinne', 'corrine', 'corine', 'corrinne'],
    limitReply: 250,
    userProcessed: null,

    // EVENTS
    startListeners: function() {
        this.voiceConnection.on(VoiceConnectionStatus.Disconnected, this.onDisconnect.bind(this));
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Playing, this.onBotSpeaking.bind(this, true));
        this.audioPlayer.on(discordVoice.AudioPlayerStatus.Idle, this.onBotSpeaking.bind(this, false));
        this.voiceConnection.on(VoiceConnectionStatus.Ready, this.onReady.bind(this));
        this.voiceConnection.receiver.speaking.on('start', this.onUserSpeaking.bind(this));
        global.client.on('voiceStateUpdate', this.onVoiceStateUpdate.bind(this));
        this.onPlayerCreated();
    },
    onVoiceStateUpdate: function(oldState, newState) {
        if(this.channel) {
            // deconnection
            if(oldState.channelId == this.channel.id
                && newState.channelId != this.channel.id) {
                this.removeUser(oldState.id);
            }
            // connection
            if(oldState.channelId != this.channel.id
                && newState.channelId == this.channel.id) {
                this.getUsers();
            }
        }
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
        // this.selectedUser = this.getRandomUser();
        // forcing to avoid listening straight away
        this.botSpeaking = true;
        await this.textToSpeechSend(this.bonjour);
    },
    onUserSpeaking: function(userId) {
        // console.log(this.selectedUser.user.username);
        // if(!this.botSpeaking && this.selectedUser.user.id === userId) {
        if(!this.botSpeaking) {
            console.log('LISTENING TO USER');
            this.listenToUser(userId);
            // this.selectedUser = this.getRandomUser();
        }
    },
    onPlayerCreated: function() {
        this.audioPlayer.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata.title);
        });
    },

    // Manage Users
    removeUser: function(userId) {
        console.log('REMOVE USER ' + this.channelUsers.get(userId).user.username);
        delete this.channelUsers.delete(userId);
    },
    getUsers: async function() {
        const fetchedChannel = await this.channel.fetch(true);
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
                let text = await Deepgram.convert(mp3Path, 'audio/mp3');
                console.log('Result deepgram ' + text);
                // look for trigger word
                text = text.toLowerCase();
                const match = this.triggerWords.find(v => text.includes(v));
                console.log('Match ' + match);
                if(match) {
                    // block all listerners
                    this.botSpeaking = true;
                    this.userProcessed = userId;
                    // remove Corinne part of the
                    text = text.substring(text.indexOf(match) + match.length, text.length - 1);
                    console.log('Recognized match: ' + text);
                    // send to AI only on some conditions
                    if(text != '' && this.userProcessed == userId) {
                        console.log('Matching text: ' + text);
                        let reply = await HercAi.askHercAi(text);
                        console.log('Original reply HercAi: ' + reply);
                        // limit length of reply
                        if(reply.length > this.limitReply) {
                            reply = reply.toLowerCase();
                            const lastPoint = reply.indexOf('.', this.limitReply);
                            reply = reply.substring(0, lastPoint);
                            console.log('Limited reply HercAi (' + reply.length + '): ' + reply);
                        }
                        // send back to voice chat
                        await this.textToSpeechSend(reply);
                        return;
                    }
                }
                this.botSpeaking = false;
            }
            catch (err) {
                console.log(err);
                this.botSpeaking = false;
            }
        });

        const audioFilePath = await Deepgram.recordAudio(subscription);
    },
    textToSpeechSend: async function(text) {
        try {
            // check if channel exists
            if(!this.voiceConnection || !this.channel) return;

            // create mp3
            const file = await VoiceCreator.createAudio(text);

            // send mp3 to channel
            const resource = createAudioResource(file);
            this.audioPlayer.play(resource);
        }
        catch (err) {
            console.log(err);
            this.botSpeaking = false;
        }
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
        await this.getUsers();
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
            this.userProcessed = null;
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