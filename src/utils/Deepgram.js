const { Deepgram } = require('@deepgram/sdk');
require('dotenv').config();
const fs = require('node:fs');
const prism = require('prism-media');
const Lame = require('node-lame').Lame;

const speechToText = {
    client: null,
    convert: async function(filePath, mimetype) {
        if(!this.client) {
            this.client = new Deepgram(process.env.DEEPGRAM_API_KEY);
        }
        try {
            const audioFile = fs.createReadStream(filePath);
            const audio = { buffer: audioFile, mimetype: mimetype };
            const response = await this.client.transcription.preRecorded(audio, {
                punctuate: true,
                // TODO autodetect language ? Check if language is in the reply
                language: 'fr',
            });
            return response.results.channels[0].alternatives[0].transcript;
        }
        catch(err) {
            console.log('Error Deepgram ' + err);
            return false;
        }
    },
    recordAudio: function(subscription, userId) {
        console.log('RECORD AUDIO');
        const writeStream = fs.createWriteStream('./src/audios/input' + userId + '.pcm');
        const opusDecoder = new prism.opus.Decoder({
            frameSize: 960,
            channels: 2,
            rate: 48000,
        });

        subscription.pipe(opusDecoder).pipe(writeStream);
    },
    convertPCMtoMP3: async function(filePath, userId) {
        try{
            const encoder = new Lame({
                output: './src/audios/input' + userId + '.mp3',
                raw: true,
                signed: true,
                bitwidth: 16,
                sfreq: 48,
                'little-endian': true,
                bitrate: 192,
            }).setFile(filePath);

            await encoder.encode();
            return './src/audios/input' + userId + '.mp3';
        }
        catch (err) {
            console.log(err);
            return false;
        }
    },
};

module.exports = speechToText;