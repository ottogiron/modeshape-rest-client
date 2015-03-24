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

    var url = this.getEndPointUrl(endpoint);
    Wreck.request(method, url, options, callback);
};


ModeShapeClient.prototype.getEndPointUrl = function(path){

    var fullPath = internals.buildPath(this.options.context, path || '');
    var endPointUrl = url.resolve(this.baseUrl, fullPath);
    console.log(endPointUrl);
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

ModeShapeClient.prototype.addNode = function(options, node, callback) {

    var fullPath = internals.buildPath(options.repository, options.workspace, internals.endpoints.ADD_NODE, options.path);
    var requestOptions = this._buildRequestOptions(node);
    this.executeRequest(internals.POST_METHOD, fullPath, requestOptions, function(err, res){

        return internals.processResponse(err, res, callback);
    });
}


ModeShapeClient.prototype._buildRequestOptions = function(jsonPayload) {

    var serializedPayload = internals.serializePayload(jsonPayload);
    var requestOptions = _.defaults({
        payload: serializedPayload
    }, this.httpDefaultOptions);

    return requestOptions;
};


internals.processResponse = function(err, res, callback) {

    /* istanbul ignore if  */
    if(err){ return internals.handleError(err, callback); }

    Wreck.read(res, null, function(readError, body) {

        //console.log(body.toString('utf8'));
        return callback(err, JSON.parse(body.toString('utf8')));
    });
};

/* istanbul ignore next */
internals.handleError = function(err, callback){

    console.log(err);
    callback(err);
};

internals.serializePayload = function(payload) {

    return JSON.stringify(payload);
};

internals.buildPath = function() {

    var args = Array.prototype.slice.call(arguments);
    //console.log('About to process these arguments', args);
    return path.join.apply(null, args);
};


module.exports = function(options){

    return new ModeShapeClient(options);
}
