const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const characterAi = {
    ladyGaga: '3NauECRlfLF12OV_3ik6Tg47TQfVb7U4J7msy0ibhbc',
    joelMiller: 'oJcj_P-Df68mT19nAniAAlHsmsKucNGSStGfkZ5-EOw',
    submitText: async function(text) {
      const { translate } = await import('@vitalets/google-translate-api');
      // Authenticating as a guest (use `.authenticateWithToken()` to use an account)
      await characterAI.authenticateAsGuest();

      // Place your character's id here
      const characterId = this.joelMiller;

      const chat = await characterAI.createOrContinueChat(characterId);

      // Send a message
      const tradEn = await translate(text, { to: 'en' });
      const response = await chat.sendAndAwaitResponse(tradEn.text, true);
      const tradFr = await translate(response.text, { to: 'fr' });

      return tradFr.text;
    },
};

module.exports = characterAi;
