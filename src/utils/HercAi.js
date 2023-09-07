const { Hercai } = require('hercai');

const HercAi = {
    client: null,
    askHercAi: async function(text) {
        if(!this.client) {
            this.client = new Hercai();
        }
        /* Available Models "v2","beta" | Default Model; "v2" */
        return await this.client.question({ model:'v2', content: text });
    },
};

module.exports = HercAi;

