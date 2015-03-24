
var internals  = {
    BASE64: 'base64'
};

module.exports.encodeCredentialsToBase64 = function(user, password) {

    var credentials = user + ':' +  password;
    return new Buffer(credentials).toString(internals.BASE64);
};
