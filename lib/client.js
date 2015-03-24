var Wreck = require('wreck');
var Utils = require('./utils');
var _ = require('lodash');
var url = require('url');

var internals = {
    GET_METHOD: 'GET',
    PUT_METHOD: 'PUT',
    POST_METHOD: 'POST',
    DELETE_METHOD: 'DELETE',
    defaultOptions: {
        port: 8080,
        hostname: 'localhost',
        protocol: 'http',
        context: 'modeshape-rest'
    },
    endpoints: {

    }
};


var ModeShapeClient = function(options){

    this.options = _.defaults(options, internals.defaultOptions);

    //Initialize default request options

    var encodedCredentials = Utils.encodeCredentialsToBase64(this.options.user, this.options.password);
    this.httpDefaultOptions = {
        headers: {
            Authorization: 'Basic ' + encodedCredentials,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    //Initialize base url
    this.baseUrl = url.format({ protocol: this.options.protocol, hostname: this.options.hostname, port: this.options.port });
};


ModeShapeClient.prototype.executeRequest = function(method, endpoint, callback){

    var url = this.getEndPointUrl(endpoint);
    Wreck.request(method, url, this.httpDefaultOptions, callback);
};


ModeShapeClient.prototype.getEndPointUrl = function(path){

    var fullPath = path ? this.options.context + '/' + path : this.options.context;
    var endPointUrl = url.resolve(this.baseUrl, fullPath);
    return endPointUrl;
};


internals.processResponse = function(res, callback) {

    Wreck.read(res, null, function(err, body) {

        //console.log(body.toString('utf8'));
        callback(err, JSON.parse(body.toString('utf8')));
    });
};


internals.handleError = function(err, callback){

    console.log(err);
    callback(err);
};


ModeShapeClient.prototype.getAvailableRepositories = function(callback){

    this.executeRequest(internals.GET_METHOD, '', function(err, res) {

        if(err){ return internals.handleError(err, callback); }

        return internals.processResponse(res, callback);
    });
};


ModeShapeClient.prototype.getWorskpaceList = function(repositoryName, callback) {

    var url =
    this.executeRequest(internals.GET_METHOD, repositoryName, function(err, res){

        if(err){ return internals.handleError(err, callback); }

        return internals.processResponse(res, callback);
    })
}


module.exports = function(options){

    return new ModeShapeClient(options);
}
