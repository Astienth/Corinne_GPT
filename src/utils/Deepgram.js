const { Deepgram } = require('@deepgram/sdk');
require('dotenv').config();
const fs = require('node:fs');

const speechToText = {
    client: null,
    convert: async function(audioSource) {
        if(!this.client) {
            this.client = new Deepgram(process.env.DEEPGRAM_API_KEY);
        }
        try {
            audioSource = fs.createReadStream('src/audios/output.mp3');
            const audio = { buffer: audioSource, mimetype: 'audio/mp3' };
            const response = await this.client.transcription.preRecorded(audio, {
                punctuate: true,
                language: 'fr',
            });
            return response.results.channels[0].alternatives[0].transcript;
        }
        catch(err) {
            console.log('Error Deepgram ' + err);
        }
    },
};

module.exports = speechToText;