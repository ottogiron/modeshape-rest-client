var Wreck = require('wreck');
var Utils = require('./utils');
var _ = require('lodash');
var url = require('url');
var path = require('path');

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
        ADD_NODE: '/items'
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


ModeShapeClient.prototype.executeRequest = function(method, endpoint, options, callback){

    var httpOptions = options ? _.defaults(options, this.httpDefaultOptions) : this.httpDefaultOptions;
    var url = this.getEndPointUrl(endpoint);
    Wreck.request(method, url, httpOptions, callback);
};


ModeShapeClient.prototype.getEndPointUrl = function(path){

    var fullPath = path ? this.options.context + '/' + path : this.options.context;
    var endPointUrl = url.resolve(this.baseUrl, fullPath);
    return endPointUrl;
};

ModeShapeClient.prototype.getAvailableRepositories = function(callback){

    this.executeRequest(internals.GET_METHOD, '', null, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.getWorskpaceList = function(repositoryName, callback) {


    this.executeRequest(internals.GET_METHOD, repositoryName, null, function(err, res){

        return internals.processResponse(err ,res , callback);
    })
}

ModeShapeClient.prototype.addNode = function(path, node, callback) {

    var fullPath = internals.buildPath(internals.endpoints.ADD_NODE, path);
    var options = internals.buildRequestOptions(node);
    this.executeRequest(internals.POST_METHOD, fullPath, options, function(err, res){

        return internals.processResponse(err, res, callback);
    });
}


internals.buildRequestOptions = function(jsonPayload) {

    var serializedPayload = internals.serializePayload(node);

    return {
        payload: serializedPayload
    };
};


internals.processResponse = function(err, res, callback) {

    if(err){ return internals.handleError(err, callback); }

    Wreck.read(res, null, function(readError, body) {

        //console.log(body.toString('utf8'));
        return callback(err, JSON.parse(body.toString('utf8')));
    });
};


internals.handleError = function(err, callback){

    console.log(err);
    callback(err);
};

internals.serializePayload = function(payload) {

    return JSON.stringify(payload);
};

internals.buildPath = function() {

    return path.join.apply(path, arguments);
};


module.exports = function(options){

    return new ModeShapeClient(options);
}
