require('chai').should();
var nockBack = require('nock').back;
var ModeShapeRestClient = require('../');
var async = require('async');
var fs = require('fs');

nockBack.fixtures = './test/fixtures/nock';
nockBack.setMode('record');




describe('Modeshape available endpoints', function() {

    var client;

    before(function(){
        client = ModeShapeRestClient({
            user: 'admin',
            password: 'admin',
            repository: 'sample',
            workspace: 'default'
        });
    });


    it('should retreive a list of available repositories', function(done) {

        nockBack('getAvailableRepositories.json', function(nockDone) {

            client.getAvailableRepositories(function(err, result) {
                result.should.be.an('object');
                result.should.have.property('repositories');
                nockDone();
                done();
            });
        });
    });


    it('should retrieve a list of workspaces for a repository', function(done) {

        nockBack('getListOfWorkspacesForRepository.json', function(nockDone) {

            var repositoryName = 'sample';
            client.getWorskpaceList(repositoryName, function(err, result){
                result.should.be.an('object');
                result.should.have.property('workspaces');
                nockDone();
                done();
            });
        });
    });


    it('should retrieve a node given a path', function(done) {

        nockBack('getANodeOrPropertyByPath.json', function(nockDone) {

            client.getNode({
                path: '/'
            }, function(err, result){

                result.should.be.an('object');
                result.should.have.property('id');
                result.should.have.property('children');
                nockDone();
                done();
            });
        });
    });


    it('should retrieve a node given a path and child depth', function(done) {

        nockBack('getANodeOrPropertyByPathAndDepth.json', function(nockDone) {

            client.getNode({
                path: '/',
                depth: 10

            }, function(err, result){

                result.should.be.an('object');
                result.should.have.property('id');
                result.should.have.property('children');
                nockDone();
                done();
            });
        });
    });


    it('should add a new node given a path', function(done) {

        var nodeToAdd = {
            "jcr:primaryType":"nt:unstructured",
            "testProperty":"testValue",
            "multiValuedProperty":["value1", "value2"],
            "children":{
                "childNode":{
                    "nestedProperty":"nestedValue"
                }
            }
        };

        nockBack('addNode.json', function(nockDone) {

            var path = '/test';
            client.addNode({
                    path: path
                }, nodeToAdd, function(err, result) {

                    result.should.be.an('object');
                    //console.log('Result is:', result);
                    result.should.have.property('id');
                    result.should.have.property('multiValuedProperty');
                    result.multiValuedProperty.should.have.length(2);
                    nockDone();
                    done();
            });
        });
    });

    it('should update node properties by path', function(done) {

        var nodeProperties = { "testProperty":"some_new_value" };

        nockBack('updateNode.json', function(nockDone) {

            var path = 'test';
            client.updateNode({
                path: path
            }, nodeProperties, function(err, result) {
            //    console.log(result);
                result.should.be.an('object');
                result.should.have.property('testProperty');
                result.testProperty.should.be.equal(nodeProperties.testProperty);
                nockDone();
                done();
            });
        });
    });


    it('should delete a node by path', function(done) {

        var nodeToAdd = {
            "jcr:primaryType":"nt:unstructured",
            "testProperty":"testValue",
            "multiValuedProperty":["value1", "value2"],
            "children":{
                "childNode":{
                    "nestedProperty":"nestedValue"
                }
            }
        };

        nockBack('deleteNode.json', function(nockDone) {

            var path = '/testdelete';
            var options = {
                path: path
            };

            client.addNode(options, nodeToAdd, function(err, result) {

                client.deleteNode(options, function(err, result) {

                    result.should.be.empty;
                    nockDone();
                    done();
                });

            });
        });
    });


    it('should delete a node by identifier', function(done) {

        nockBack('delteANodeByIdentifier.json', function(nockDone) {

            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };

            var options = {
                path: '/testdeletebyidentifier'
            };

            client.addNode(options, nodeToAdd, function(err, res) {

                res.should.have.property('id');
                options.id = res.id;
                client.deleteNodeByIdentifier(options, function(err, res) {

                    res.should.be.empty;
                    nockDone();
                    done();
                });
            });
        });
    });


    it('should retrieve and delete node by identifier', function(done) {

        nockBack('retrieveByIdentifier.json', function(nockDone) {

            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };

            var options = {
                path: '/testbyidentifier'
            };

            async.waterfall([
                //create test node
                function(callback) {

                    client.addNode(options, nodeToAdd, function(err, res) {
                        return callback(err, res)
                    });
                },
                //retrieve node with created node id
                function(createdNode, callback) {

                    options.id = createdNode.id;
                    client.getNodeByIdentifier(options, function(err, retrievedNode) {

                        retrievedNode.should.be.an('object');
                        retrievedNode.id.should.be.equal(options.id);
                        return callback(err);
                    });
                },
                //delete created node
                function(callback) {

                    client.deleteNodeByIdentifier(options, function(err, res) {
                        return callback(err, res);
                    });
                }
            ], function(err, result) {

                result.should.be.empty;
                nockDone();
                done();
            });
        });
    });


    it('should update a node by identifier', function(done) {

        nockBack('updateNodeByIdentifier.json', function(nockDone) {
            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };

            var options = {
                path: '/testbyidentifier'
            };

            async.waterfall([
                //create test node
                function(callback) {

                    client.addNode(options, nodeToAdd, function(err, res) {
                        return callback(err, res)
                    });
                },
                //retrieve node with created node id
                function(createdNode, callback) {

                    options.id = createdNode.id;
                    var testProperties = {testProperty: 'Test value'};
                    client.updateNodeByIdentifier(options, testProperties, function(err, updateResult) {

                        updateResult.should.have.property('testProperty');
                        updateResult.testProperty.should.be.equal(testProperties.testProperty);
                        callback(null);
                    });

                },
                //delete created node
                function(callback) {

                    client.deleteNodeByIdentifier(options, function(err, res) {
                        return callback(err, res);
                    });
                }
            ], function(err, result) {

                result.should.be.empty;
                nockDone();
                done();
            });

        });

    });


    it('should return a root node using SQL2 query', function(done) {

        nockBack('getRootNodeSQL2.json', function(nockDone) {

            var options = {
                query: "SELECT * FROM [nt:base] WHERE PATH([nt:base]) ='/'",
                queryType: 'sql2'
            };

            client.executeJCRQuery(options, function(err, result) {
                result.should.have.property('columns');
                result.should.have.property('rows');
                result.rows.should.be.an('array');
                result.rows.should.have.length(1);
                result.rows[0]['nt:base.jcr:path'].should.be.equal('/');
                nockDone();
                done();
            });

        });
    });


    it('should return SQL2 results with offset and limit', function(done) {

        nockBack('getNodesSQL2WithLimitAndOffset.json', function(nockDone) {

            var limit = 2;
            var options = {
                query: "SELECT * FROM [nt:base] WHERE isdescendantnode('/')",
                queryType: 'sql2',
                filters: {
                    offset: 1,
                    limit: limit
                }
            };

            client.executeJCRQuery(options, function(err, result) {
                result.should.have.property('columns');
                result.should.have.property('rows');
                result.rows.should.be.an('array');
                result.rows.should.have.length(limit);
                nockDone();
                done();
            });

        });
    });


    it('should create multiple nodes with a single session', function(done) {

        var nodesToAdd = {
            "/child/subChild" : {
                "jcr:primaryType":"nt:unstructured",
                "testProperty":"testValue",
                "multiValuedProperty":["value1", "value2"]
            },
            "/child" : {
                "jcr:primaryType":"nt:unstructured",
                "testProperty":"testValue",
                "multiValuedProperty":["value1", "value2"]
            },
            "/otherChild" : {
                "jcr:primaryType":"nt:unstructured",
                "testProperty":"testValue",
                "multiValuedProperty":["value1", "value2"],
                "children":{
                    "otherSubChild":{
                        "nestedProperty":"nestedValue"
                    }
                }
            }
        };



        nockBack('addMultipleNodesSingleSession.json', function(nockDone) {

            client.addMultipleNodes( nodesToAdd, function(err, result) {

                result.should.be.an('array');
                result.should.have.length(3);
                nockDone();
                done();
            });
        });

    });


    it('should update multiple nodes with a single session', function(done) {

        nockBack('updateMutipleNodesSingleSession.json', function(nockDone) {

            var testPath = '/updatemultiple';

            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };

            var options = {
                path: testPath
            };

            async.waterfall([
                //create test node
                function(callback) {

                    client.addNode(options, nodeToAdd, function(err, res) {
                        return callback(err, res)
                    });
                },
                //retrieve node with created node id
                function(createdNode, callback) {

                    var nodesToUpdate = {
                        "/updatemultiple" : {
                            "testProperty":"updated value",
                        }
                    };

                    options.id = createdNode.id;

                    client.updateMultipleNodes(options, nodesToUpdate, function(err, updateResult) {

                        updateResult.should.be.an('array');
                        updateResult.should.have.length(1);
                        updateResult[0].testProperty.should.be.equal(nodesToUpdate[testPath].testProperty);
                        callback(null);
                    });

                },
                //delete created node
                function(callback) {

                    client.deleteNodeByIdentifier(options, function(err, res) {
                        return callback(err, res);
                    });
                }
            ], function(err, result) {

                result.should.be.empty;
                nockDone();
                done();
            });

        });
    });



    it('it should retrieve a nodetype', function(done) {

        nockBack('getNodeType.json', function(nockDone) {
            var nodeTypeName = 'nt:base';
            var options = {
                nodeTypeName: nodeTypeName
            };

            client.getNodeType(options, function(err, nodeType) {

                nodeType.should.have.property(nodeTypeName);
                nockDone();
                done();
            });
        });
    });


    it('it should create a new binary property via request content', function(done) {

        nockBack('createBynaryProperty.json', function(nockDone) {

            var options = {
                path: '/testbinary'
            };

            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };




            async.waterfall([
                function(callback){

                    client.addNode(options, nodeToAdd, function(err, createdNode) {

                        return callback(err, createdNode);
                    });
                },
                function(createdNode, callback) {

                    var propertyName = 'binaryProperty';
                    options.path = options.path + '/' + propertyName;
                    var npath = require('path');
                    var propertyStream = fs.createReadStream(__dirname + '/fixtures/files/binaryTest');
                    client.createBinaryProperty(options, propertyStream, function(err , result) {

                        result.should.be.an('object');
                        result.should.have.property(propertyName);
                        return callback(err, createdNode.id);
                    });
                },
                function(nodeId, callback) {

                    options.id = nodeId;
                    client.deleteNodeByIdentifier(options, function(err, result) {
                            return callback(err, result);
                    });
                }
                ], function(err, result) {

                    result.should.be.empty;
                    nockDone();
                    done();
                }
            );



        });

    });


    it('should retrieve a binary property', function(done) {

        nockBack('retrieveBinaryProperty.json', function(nockDone) {
            var options = {

                path: '/testbinary'
            };

            var nodeToAdd = {
                "jcr:primaryType":"nt:unstructured"
            };




            async.waterfall([
                function(callback){

                    client.addNode(options, nodeToAdd, function(err, createdNode) {

                        return callback(err, createdNode);
                    });
                },
                function(createdNode, callback) {

                    var propertyName = 'binaryProperty';
                    options.path = options.path + '/' + propertyName;
                    var npath = require('path');
                    var propertyStream = fs.createReadStream(__dirname + '/fixtures/files/binaryTest');
                    client.createBinaryProperty(options, propertyStream, function(err , result) {

                        result.should.be.an('object');
                        result.should.have.property(propertyName);
                        options.id = createdNode.id
                        return callback(err);
                    });
                },
                function(callback) {

                    options.queryString = {
                        mimeType: 'text/plain'
                    };

                    client.getBinaryProperty(options, function(err, resultStream) {

                        var body = '';

                        resultStream.on('data', function(chunk) {

                            body = body + chunk;
                        });

                        resultStream.on('end', function() {

                            body.should.contain('hello binary');
                            return callback(err);
                        });

                    });
                },
                function(callback) {


                    client.deleteNodeByIdentifier(options, function(err, result) {
                            return callback(err, result);
                    });
                }
                ], function(err, result) {

                    result.should.be.empty;
                    nockDone();
                    done();
                }
            );

        });
    });


    it('should update a binary property via request content', function(done) {

                nockBack('updateBinaryProperty.json', function(nockDone) {
                    var options = {
                        path: '/testbinary'
                    };

                    var nodeToAdd = {
                        "jcr:primaryType":"nt:unstructured"
                    };

                    var propertyName = 'binaryProperty';
                    async.waterfall([
                        function(callback){

                            client.addNode(options, nodeToAdd, function(err, createdNode) {

                                return callback(err, createdNode);
                            });
                        },
                        function(createdNode, callback) {


                            options.path = options.path + '/' + propertyName;
                            var npath = require('path');
                            var propertyStream = fs.createReadStream(__dirname + '/fixtures/files/binaryTest');
                            client.createBinaryProperty(options, propertyStream, function(err , result) {

                                result.should.be.an('object');
                                result.should.have.property(propertyName);
                                options.id = createdNode.id
                                return callback(err);
                            });
                        },
                        function(callback) {

                            var propertyUpdateStream = fs.createReadStream(__dirname + '/fixtures/files/binaryUpdateTest');
                            client.updateBinaryProperty(options, propertyUpdateStream, function(err, result) {
                                result.should.be.an('object');
                                result.should.have.property(propertyName);
                                return callback(err);
                            });

                        },
                        function(callback) {


                            client.deleteNodeByIdentifier(options, function(err, result) {
                                    return callback(err, result);
                            });
                        }
                        ], function(err, result) {

                            result.should.be.empty;
                            nockDone();
                            done();
                        }
                    );

                });
    });


    it('should upload a binary', function(done){

        nockBack('uploadBinary.json', function(nockDone) {

            var options = {
                path: '/testbinaryUpload'
            };


            var propertyName = 'binaryProperty';
            async.waterfall([
                function(callback) {

                    var nodeStream = fs.createReadStream(__dirname + '/fixtures/files/binaryTest');
                    client.uploadBinary(options, nodeStream, function(err , result) {
                        result.should.be.an('object');
                        result.should.have.property('jcr:data');
                        return callback(err);
                    });
                },
                function(callback) {

                    client.deleteNode(options, function(err, result) {

                         return callback(err, result);
                    });
                }
                ], function(err, result) {

                    result.should.be.empty;
                    nockDone();
                    done();
                }
            );
        });
    });


    it('shoud get the path for a returned node data', function(done){

        nockBack('getNodeDataPath.json', function(nockdone) {

            var path = '/';
            client.getNode({path: path}, function(err, nodeData){

                var nodeDataPath = client.getPath(nodeData);
                nodeDataPath.should.be.equal(path);
                nockdone();
                done();
            });
        });
    });


    it('shoud get the parent path for a returned node data', function(done){

        nockBack('getNodeDataParentPath.json', function(nockdone) {

            var path = '/jcr:system';
            var parentPath = '/';
            client.getNode({path: path}, function(err, nodeData){

                var nodeDataPath = client.getParentPath(nodeData);
                nodeDataPath.should.be.equal(parentPath);
                nockdone();
                done();
            });
        });
    });


    it('shoud get the node name from the node data', function(done){

        nockBack('getNodeNameFromNodeData.json', function(nockdone) {

            var path = '/jcr:system';
            client.getNode({path: path}, function(err, nodeData){

                var nodeName = client.getName(nodeData);
                nodeName.should.be.equal('jcr:system');
                nockdone();
                done();
            });
        });
    });


    it('shoud get the node identifier from the node data', function(done){

        nockBack('getNodeIdentifierFromNodeData.json', function(nockdone) {

            var path = '/jcr:system';
            client.getNode({path: path}, function(err, nodeData){

                var identifier = client.getIdentifier(nodeData);
                identifier.should.be.equal(nodeData.id);
                nockdone();
                done();
            });
        });
    });


    it('should return a node data children which already contains a children object', function(done){

        nockBack('getCachedChildren.json', function(nockdone){

            var path = '/';
            client.getNode({ path: path}, function(err, nodeData) {

                client.getChildren(nodeData, function(err, children) {

                    children.should.be.an('object');
                    children.should.have.property('jcr:system');
                    nockdone();
                    done();
                });
            });
        });
    });


    it('should return a node data children which does not contains a children object', function(done){

        nockBack('getNonCachedChildren.json', function(nockdone){

            var path = '/';
            client.getNode({ path: path}, function(err, nodeData) {

                var jcrSystemNodeData = nodeData.children['jcr:system'];
                client.getChildren(jcrSystemNodeData, function(err, children) {

                    children.should.be.an('object');
                    children.should.have.property('jcr:nodeTypes');
                    nockdone();
                    done();
                });
            });
        });
    });

});
