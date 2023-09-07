const { Hercai } = require('hercai');

const HercAi = {
    client: null,
    askHercAi: async function(text) {
        if(!this.client) {
            this.client = new Hercai();
        }
        /* Available Models "v2","beta" | Default Model; "v2" */
        const res = await this.client.question({ model:'v2', content: text });
        return res.reply;
    },
};

module.exports = HercAi;

