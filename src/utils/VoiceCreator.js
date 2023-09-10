const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');

const VoiceCreator = {
    createAudioGoogle: async function(text) {
        try {
            const filePath = path.resolve('./src/audios/output.mp3');

            const res = await googleTTS.getAllAudioBase64(text, { lang: 'fr' });
            const buffers = res.map(result => Buffer.from(result.base64, 'base64'));
            const finalBuffer = Buffer.concat(buffers);
            fs.writeFileSync(filePath, finalBuffer);
            console.log(`Audio file ${filePath} created successfully`);
            return filePath;
        }
        catch(err) {
            console.log(err);
        }
    },
};

module.exports = VoiceCreator;