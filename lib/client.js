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
        context: 'modeshape-rest',
        workspace: 'default',
        repository: 'sample'
    },
    endpoints: {
        ITEMS: '/items',
        NODES: '/nodes',
        QUERY: '/query',
        NODETYPES: '/nodetypes',
        BINARY: '/binary',
        UPLOAD: '/upload'
    },
    resultObjectTypes: {
        STREAM: 'stream',
        JSON: 'json'
    }
};


var ModeShapeClient = function(options){

    if(!(this instanceof ModeShapeClient)) {
        return new ModeShapeClient(options);
    }

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

    //e.g. http://localhost:8090/resources/repo/default/items/
    var itemsPath = this._buildPath(this.options.context, this.options.repository, this.options.workspace, internals.endpoints.ITEMS);
    this.itemsUrl= url.resolve(this.baseUrl, itemsPath);
};


ModeShapeClient.prototype.executeRequest = function(method, endpoint, options, callback) {

    var requestOptions = this._getRequestOptions(options);
    var url = this.getEndPointUrl(endpoint);
    Wreck.request(method, url, requestOptions, callback);
};



ModeShapeClient.prototype._getRequestOptions = function(options) {

    options = options || {};
    options.headers = options.headers || {};

    var headers = _.defaults(options.headers, this.httpDefaultOptions.headers);
    options.headers = headers;
    var requestOptions = _.defaults(options, this.httpDefaultOptions);

    return requestOptions;
};


ModeShapeClient.prototype.getEndPointUrl = function(path) {

    var fullPath = this._buildPath(this.options.context, this.options.repository, this.options.workspace, path || '');
    var endPointUrl = url.resolve(this.baseUrl, fullPath);
    console.log('Called url is:', endPointUrl);
    return endPointUrl;
};


ModeShapeClient.prototype.getAvailableRepositories = function(callback) {

    var requestOptions = this._getRequestOptions();
    var path = this._buildPath(this.options.context);
    var endPointUrl = url.resolve(this.baseUrl, path);

    Wreck.request(internals.GET_METHOD, endPointUrl, requestOptions, function(err, res) {

        return internals.processResponse(null, err ,res , callback);
    });
};


ModeShapeClient.prototype.getWorskpaceList = function(repositoryName, callback) {

    var requestOptions = this._getRequestOptions();
    var path = this._buildPath(this.options.context, repositoryName);
    var endPointUrl = url.resolve(this.baseUrl, path);

    Wreck.request(internals.GET_METHOD, endPointUrl, requestOptions, function(err, res) {

        return internals.processResponse(null, err ,res , callback);
    });
};


ModeShapeClient.prototype.getNode = function(options, callback) {

    var queryString = '';
    if(options.depth) {
        queryString = '?depth=' + options.depth;
    }
    var fullPath = this._buildPath(internals.endpoints.ITEMS, options.path) + queryString;
    this.executeRequest(internals.GET_METHOD, fullPath, null, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
}


ModeShapeClient.prototype.addNode = function(options, node, callback) {

    var fullPath = this._buildPath( internals.endpoints.ITEMS, options.path);
    var requestOptions = internals._buildOptionsWithJSONPayload(node);
    this.executeRequest(internals.POST_METHOD, fullPath, requestOptions, function(err, res){

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.updateNode = function(options, nodeProperties, callback) {

    var fullPath = this._buildPath(internals.endpoints.ITEMS, options.path);
    var requestOptions = internals._buildOptionsWithJSONPayload(nodeProperties);
    this.executeRequest(internals.PUT_METHOD, fullPath, requestOptions, function(err, res){

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.deleteNode = function(options, callback) {

    var path = this._buildPath( internals.endpoints.ITEMS, options.path);
    this.executeRequest(internals.DELETE_METHOD, path, null, function(err, res) {

        return internals.processDeleteResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.getNodeByIdentifier = function(options, callback) {

    var path = this._buildPath( internals.endpoints.NODES, options.id);
    this.executeRequest(internals.GET_METHOD, path, null, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.updateNodeByIdentifier = function(options, nodeProperties, callback) {

    var requestOptions = internals._buildOptionsWithJSONPayload(nodeProperties);
    var path = this._buildPath( internals.endpoints.NODES, options.id);
    this.executeRequest(internals.PUT_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.deleteNodeByIdentifier = function(options, callback) {

    var path = this._buildPath( internals.endpoints.NODES, options.id);
    this.executeRequest(internals.DELETE_METHOD, path, null, function(err, res) {

        return internals.processDeleteResponse(err, res, callback);
    });
};


ModeShapeClient.prototype.executeJCRQuery = function(options, callback) {

    var queryString = '';

    if(options.filters) {
         queryString = '?' + querystring.stringify(options.filters);

    }

    var path = this._buildPath(internals.endpoints.QUERY) + queryString;

    var requestOptions = internals._buildOptionsWithPlainPayload(options.query);
    requestOptions.headers = {
        "Content-Type": "application/jcr+" + options.queryType
    };

    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res){

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.addMultipleNodes = function( nodes, callback) {

    var path = this._buildPath( internals.endpoints.ITEMS);
    var requestOptions = internals._buildOptionsWithJSONPayload(nodes);
    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(null, err, res, callback);
    });
};


ModeShapeClient.prototype.updateMultipleNodes = function(options, nodes, callback) {

    var path = this._buildPath( internals.endpoints.ITEMS);
    var requestOptions = internals._buildOptionsWithJSONPayload(nodes);
    this.executeRequest(internals.PUT_METHOD, path,requestOptions, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.getNodeType = function(options,callback) {

    var path = this._buildPath( internals.endpoints.NODETYPES, options.nodeTypeName);
    this.executeRequest(internals.GET_METHOD, path, null, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.createBinaryProperty = function(options, binaryStream, callback) {

    var path = this._buildPath( internals.endpoints.BINARY, options.path);
    var requestOptions = internals._buildOptionsWithPlainPayload(binaryStream);
    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.getBinaryProperty = function(options, callback) {

    var queryString = '';
    if(options.queryString) {
         queryString = '?' + querystring.stringify(options.queryString);

    }

    var path = this._buildPath( internals.endpoints.BINARY, options.path) + queryString;
    options.resultObjectType = internals.resultObjectTypes.STREAM;
    this.executeRequest(internals.GET_METHOD, path, null, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.getPath = function(nodeData) {

    var selfUrl = nodeData.self;
    var path = this._extractPath(selfUrl);
    return path;
};


ModeShapeClient.prototype.getParentPath = function(nodeData) {

    var parentUrl = nodeData.up;
    var path = this._extractPath(parentUrl);
    return path;
};


ModeShapeClient.prototype._extractPath = function(fullNodeUrl) {

    var tokens = fullNodeUrl.split(this.itemsUrl);
    var path = decodeURIComponent(this._buildPath(tokens[1]));
    return path;
};


ModeShapeClient.prototype.getIdentifier = function(nodeData) {

    return nodeData.id;
};


ModeShapeClient.prototype.getName = function(nodeData) {

    var url = nodeData.self;
    var name = decodeURIComponent(path.basename(url));
    return name;
};


ModeShapeClient.prototype.getChildren = function(nodeData, callback) {

    if(nodeData.children) {
        process.nextTick(function(){

            callback(null, nodeData.children);
        });
    }
    else {
        var path = this.getPath(nodeData);
        this.getNode({ path: path}, function(err, nodeDataWithChildren){

            callback(err, nodeDataWithChildren.children);
        });
    }
};


ModeShapeClient.prototype.updateBinaryProperty = function(options, binaryStream, callback) {

    var path = this._buildPath( internals.endpoints.BINARY, options.path);
    var requestOptions = internals._buildOptionsWithPlainPayload(binaryStream);
    this.executeRequest(internals.PUT_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype.uploadBinary = function(options, binaryStream, callback) {

    var path = this._buildPath( internals.endpoints.UPLOAD, options.path);
    var requestOptions = internals._buildOptionsWithPlainPayload(binaryStream);
    this.executeRequest(internals.POST_METHOD, path, requestOptions, function(err, res) {

        return internals.processResponse(options, err, res, callback);
    });
};


ModeShapeClient.prototype._buildPath = function() {

    //pass all the arguments to path.join
    //var args = Array.prototype.slice.call(arguments);

    var url = path.join.apply(null, arguments);

    return url;
};


internals._buildOptionsWithJSONPayload = function(jsonPayload) {

    var serializedPayload = internals.serializePayload(jsonPayload);
    var requestOptions =  {
        payload: serializedPayload
    };

    return requestOptions;
};


internals._buildOptionsWithPlainPayload = function(payload) {

    var requestOptions =  {
        payload: payload
    };
    return requestOptions;
}


internals.processResponse = function(options, err, res, callback, responseType) {

    options = options || {};
    options.resultObjectType = options.resultObjectType || internals.resultObjectTypes.JSON;
    /* istanbul ignore if  */
    if(err){ return internals.handleError(err, callback); }

    if(options.resultObjectType === internals.resultObjectTypes.STREAM) {
        return callback(err, res);
    } else if(options.resultObjectType === internals.resultObjectTypes.JSON) {

        Wreck.read(res, null, function(readError, body) {

            //console.log(body.toString('utf8'));
            return callback(err, JSON.parse(body.toString('utf8')));
        });
    }


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





module.exports = ModeShapeClient;
