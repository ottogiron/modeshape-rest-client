require('chai').should();
var nockBack = require('nock').back;
var modeshapeRestClient = require('../');

nockBack.fixtures = './test/fixtures';
nockBack.setMode('record');



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

});
