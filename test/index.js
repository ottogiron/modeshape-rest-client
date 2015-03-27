require('chai').should();
var nockBack = require('nock').back;
var modeshapeRestClient = require('../');
var async = require('async');

nockBack.fixtures = './test/fixtures';
nockBack.setMode('record');


var TEST_REPOSITORY = 'sample';
var TEST_WORKSPACE = 'default'

describe('Modeshape available endpoints', function() {

    var client;

    before(function(){
        client = modeshapeRestClient({
            user: 'admin',
            password: 'admin'
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
                    repository: TEST_REPOSITORY,
                    workspace: TEST_WORKSPACE,
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
                repository: TEST_REPOSITORY,
                workspace: TEST_WORKSPACE,
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
                repository: TEST_REPOSITORY,
                workspace: TEST_WORKSPACE,
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
                repository: TEST_REPOSITORY,
                workspace: TEST_WORKSPACE,
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
                repository: TEST_REPOSITORY,
                workspace: TEST_WORKSPACE,
                path: '/testbyidentifier'
            };

            async.waterfall([
                //create test node
                function(callback) {

                    client.addNode(options, nodeToAdd, function(err, res) {
                        callback(err, res)
                    });
                },
                //retrieve node with created node id
                function(createdNode, callback) {

                    options.id = createdNode.id;
                    client.getNodeByIdentifier(options, function(err, retrievedNode) {

                        retrievedNode.should.be.an('object');
                        retrievedNode.id.should.be.equal(options.id);
                        callback(err);
                    });
                },
                //delete created node
                function(callback) {

                    client.deleteNodeByIdentifier(options, function(err, res) {
                        callback(err, res);
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
                repository: TEST_REPOSITORY,
                workspace: TEST_WORKSPACE,
                path: '/testbyidentifier'
            };

            async.waterfall([
                //create test node
                function(callback) {

                    client.addNode(options, nodeToAdd, function(err, res) {
                        callback(err, res)
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
                        callback(err, res);
                    });
                }
            ], function(err, result) {

                result.should.be.empty;
                nockDone();
                done();
            });

        });

    });

});
