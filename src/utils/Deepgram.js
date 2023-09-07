const { Deepgram } = require('@deepgram/sdk');
require('dotenv').config();

const speechToText = {
    client: null,
    convert: async function(audioSource) {
        if(!this.client) {
            this.client = new Deepgram(process.env.DEEPGRAM_API_KEY);
        }
        try {
            const audio = { buffer: audioSource, mimetype: 'audio/*' };
            const response = await this.client.transcription.preRecorded(audio, {
                punctuate: true,
            });
            return response;
        }
        catch(err) {
            console.log(err);
        }
    },
};

module.exports = speechToText;