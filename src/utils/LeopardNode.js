const {Leopard} = require('@picovoice/leopard-node');

const LeopartNode = function(filePath) {
    // eslint-disable-next-line quotes
    const accessKey = "/MXtH8D1f1TZMOu60oXs7UH9cwY0d4ryK/z9zIRZipoGU34wwCnUuw==";
    const handle = new Leopard(accessKey, { modelPath: __dirname + '/../assets/leopard_params_fr.pv' });

    const result = handle.processFile(filePath);
    return result.transcript;
};

module.exports = LeopartNode;