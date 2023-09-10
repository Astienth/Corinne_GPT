const CharacterAI = require('node_characterai');
const jsGoogleTranslateFree = require('@kreisler/js-google-translate-free');
const characterAI = new CharacterAI();

const characterAi = {
    authenticated: false,
    characterId: {
      'Lady Gaga': '3NauECRlfLF12OV_3ik6Tg47TQfVb7U4J7msy0ibhbc',
      'Joel Miller': 'oJcj_P-Df68mT19nAniAAlHsmsKucNGSStGfkZ5-EOw',
      'Braillanne Molko': 'UlU-dqMF0D9DnJhOix3w0NJlemjlGpnxbJFeZJHeJMQ',
      'Buzz léclair': 'ePPhoqUPuQ8bosybI6kB7WxvexrPuMf75PtkiQGHmsE',
      'Nathan Drèque': 'CVVOl3izWrimWo3xz7ckqGRpuj_u9HvwI4IIjLlfLzE',
      'Crisse évanne se': '39IagXdDPud5PAt8hLa3TroWab3j-nK3kuEs2vqM6PY',
      'Jésus Christ': '0evHzbnTogrr6Tal8gG3IIfuIgLse3xLNIju1Iwh3cM',
      'Thérapeute sexuel': 'jSzSel5sJeeIyK-ZgURU7cuJTsGGk6lB-A1TqkPyJf8',
      'Entraineur fitness': 'W5-Hc1hkjFtg9fLVzrZQQcZJxqaloF_87x3yKc_BIIg',
      'Nil Dreuckmanne': 'XHEGrpIUABLhXytyGxa18j_vDaXonUdX0T_wbWet8-M',
      'Patricia Fromage': 'X-Z4l1S8egzpXHbPepX5Oaew2ISSskj3VpwmsjndsLE',
    },
    randomPropertyKey: function(obj) {
      const keys = Object.keys(obj);
      return keys[ keys.length * Math.random() << 0];
    },
    submitText: async function(text) {
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
      const tradEn = await jsGoogleTranslateFree.translate('fr', 'en', text);
      const response = await chat.sendAndAwaitResponse(tradEn, true);
      const tradFr = await jsGoogleTranslateFree.translate('en', 'fr', response.text);

      // eslint-disable-next-line quotes
      return "C'est " + key + ' qui vous parle. ' + tradFr;
    },
};

module.exports = characterAi;
