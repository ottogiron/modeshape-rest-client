var Wreck = require('wreck');
var Utils = require('./utils');
var _ = require('lodash');
var url = require('url');
var path = require('path');
var querystring = require('querystring');

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
        ITEMS: '/items',
        NODES: '/nodes',
        QUERY: '/query',
        NODETYPES: '/nodetypes',
        BINARY: '/binary'
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

    options = options || {};
    options.headers = options.headers || {};

    var headers = _.defaults(options.headers, this.httpDefaultOptions.headers);
    options.headers = headers;
    var requestOptions = _.defaults(options, this.httpDefaultOptions);
    var url = this.getEndPointUrl(endpoint);
    Wreck.request(method, url, requestOptions, callback);
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
};


ModeShapeClient.prototype.addNode = function(options, node, callback) {

    var fullPath = internals.buildPath(options, internals.endpoints.ITEMS, options.path);
    var requestOptions = internals.buildOptionsWithJSONPayload(node);
    this.executeRequest(internals.POST_METHOD, fullPath, requestOptions, function(err, res){

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.updateNode = function(options, nodeProperties, callback) {

    var fullPath = internals.buildPath(options, internals.endpoints.ITEMS, options.path);
    var requestOptions = internals.buildOptionsWithJSONPayload(nodeProperties);
    this.executeRequest(internals.PUT_METHOD, fullPath, requestOptions, function(err, res){

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.deleteNode = function(options, callback) {

    var path = internals.buildPath(options, internals.endpoints.ITEMS, options.path);
    this.executeRequest(internals.DELETE_METHOD, path, null, function(err, res) {

        return internals.processDeleteResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.getNodeByIdentifier = function(options, callback) {

    var path = internals.buildPath(options, internals.endpoints.NODES, options.id);
    this.executeRequest(internals.GET_METHOD, path, null, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.updateNodeByIdentifier = function(options, nodeProperties, callback) {

    var requestOptions = internals.buildOptionsWithJSONPayload(nodeProperties);
    var path = internals.buildPath(options, internals.endpoints.NODES, options.id);
    this.executeRequest(internals.PUT_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.deleteNodeByIdentifier = function(options, callback) {

    var path = internals.buildPath(options, internals.endpoints.NODES, options.id);
    this.executeRequest(internals.DELETE_METHOD, path, null, function(err, res) {

        return internals.processDeleteResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.executeJCRQuery = function(options, callback) {

    var queryString = '';

    if(options.filters) {
        queryString = '?' + querystring.stringify(options.filters);
    }

    var path = internals.buildPath(options, internals.endpoints.QUERY) + queryString;

    var requestOptions = internals.buildOptionsWithPlainPayload(options.query);
    requestOptions.headers = {
        "Content-Type": "application/jcr+" + options.queryType
    };

    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res){

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.addMultipleNodes = function(options, nodes, callback) {

    var path = internals.buildPath(options, internals.endpoints.ITEMS);
    var requestOptions = internals.buildOptionsWithJSONPayload(nodes);
    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.updateMultipleNodes = function(options, nodes, callback) {

    var path = internals.buildPath(options, internals.endpoints.ITEMS);
    var requestOptions = internals.buildOptionsWithJSONPayload(nodes);
    this.executeRequest(internals.PUT_METHOD, path,requestOptions, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.getNodeType = function(options,callback) {

    var path = internals.buildPath(options, internals.endpoints.NODETYPES, options.nodeTypeName);
    this.executeRequest(internals.GET_METHOD, path, null, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.createBinaryProperty = function(options, binaryStream, callback) {
    
    var path = internals.buildPath(options, internals.endpoints.BINARY, options.path);
    var requestOptions = internals.buildOptionsWithPlainPayload(binaryStream);
    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(err, res, callback);
    });
};


internals.buildOptionsWithJSONPayload = function(jsonPayload) {

    var serializedPayload = internals.serializePayload(jsonPayload);
    var requestOptions =  {
        payload: serializedPayload
    };

    return requestOptions;
};


internals.buildOptionsWithPlainPayload = function(payload) {

    var requestOptions =  {
        payload: payload
    };
    return requestOptions;
}


internals.processResponse = function(err, res, callback) {

    /* istanbul ignore if  */
    if(err){ return internals.handleError(err, callback); }

    Wreck.read(res, null, function(readError, body) {

        //console.log(body.toString('utf8'));
        return callback(err, JSON.parse(body.toString('utf8')));
    });
};


internals.processDeleteResponse = function(err, res, callback) {

    /* istanbul ignore if  */
    if(err){ return internals.handleError(err, callback); }

    Wreck.read(res, null, function(readError, body) {

        return callback(err,body.toString('utf8'));
    });
}


/* istanbul ignore next */
internals.handleError = function(err, callback){

    console.log('There has been an error when processing the request:npm',err);
    callback(err);
};

internals.serializePayload = function(payload) {

    return JSON.stringify(payload);
};


internals.buildPath = function() {

    var options = arguments[0];
    var args = [];
    if(options.repository && options.workspace) {
        //create an array with all arguments but the first one 'options'
        var args = Array.prototype.slice.call(arguments, 1);
        //unshift repository and worskpace as first parameters of path.join
        args.unshift(options.repository, options.workspace);
    } else {
        //pass all the arguments to path.join
        args = Array.prototype.slice.call(arguments);
    }
    return path.join.apply(null, args);
};


module.exports = function(options){

    return new ModeShapeClient(options);
}
