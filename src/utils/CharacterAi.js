const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

const characterAi = {
    authenticated: false,
    characterId: {
      'Lady Gaga': '3NauECRlfLF12OV_3ik6Tg47TQfVb7U4J7msy0ibhbc',
      'Joel Miller': 'oJcj_P-Df68mT19nAniAAlHsmsKucNGSStGfkZ5-EOw',
      'Braillanne Molko': 'UlU-dqMF0D9DnJhOix3w0NJlemjlGpnxbJFeZJHeJMQ',
      'Buzz léclair': 'ePPhoqUPuQ8bosybI6kB7WxvexrPuMf75PtkiQGHmsE',
      'Nathan Draike': 'CVVOl3izWrimWo3xz7ckqGRpuj_u9HvwI4IIjLlfLzE',
      'Crisse évanne se': '39IagXdDPud5PAt8hLa3TroWab3j-nK3kuEs2vqM6PY',
    },
    randomPropertyKey: function(obj) {
      const keys = Object.keys(obj);
      return keys[ keys.length * Math.random() << 0];
    },
    submitText: async function(text) {
      const { translate } = await import('@vitalets/google-translate-api');

      // Authenticating as a guest (use `.authenticateWithToken()` to use an account)
      if(!this.authenticated) {
        await characterAI.authenticateAsGuest();
        this.authenticated = true;
      }

      // Place your character's id here
      const key = this.randomPropertyKey(this.characterId);
      const characterId = this.characterId[key];

      const chat = await characterAI.createOrContinueChat(characterId);

      // Send a message
      const tradEn = await translate(text, { to: 'en' });
      const response = await chat.sendAndAwaitResponse(tradEn.text, true);
      const tradFr = await translate(response.text, { to: 'fr' });

      return 'En tant que ' + key + ', ' + tradFr.text;
    },
};

module.exports = characterAi;
