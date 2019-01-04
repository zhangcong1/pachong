var crypto = require('crypto');
var md5 = crypto.createHash('md5');

module.exports = function (str) {
    return md5.update(str).digest('hex');
};