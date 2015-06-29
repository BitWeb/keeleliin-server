/**
 * Created by taivo on 19.06.15.
 */

var config = require('../config');
var server = require('../www/server');
var request = require('supertest');
var assert = require('assert');
var should = require('should');

describe('Routing', function() {
    var url = 'http://127.0.0.1:' + config.port + '/api/v1';

    before(function(done) {
        server.startInstance( function(){
            done();
        });
    });

    describe('/service', function() {
        it('returns list of services', function(done) {
            request(url).get('/service')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 1);
                    done();
                });
        });

        it('returns service', function(done) {
            request(url).get('/service/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.id.should.equal(1);
                    done();
                });
        });
    });

    describe('/workflow-definition', function(done) {
        it('returns workflow definition', function(done) {
            request(url).get('/workflow-definition/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    res.body.should.have.property('user_id');
                    res.body.should.have.property('input_resource_id');
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('date_created');
                    //res.body.should.have.property('date_updated'); // TODO: add
                    //res.body.should.have.property('workflow_services'); // TODO: add
                    res.body.id.should.equal(1);
                    done();
                });
        });

        it('returns list of workflow definitions by project id', function(done) {
            request(url).get('/workflow-definition/projectId/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 1);
                    done();
                });
        });

        it('returns list of workflow definition service params by workflow definition service id', function(done) {
            request(url).get('/workflow-definition/service/1/params')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 2);
                    done();
                });
        });

        it('adds new workflow definition and updates the workflow', function(done) {
            request(url).post('/workflow-definition/projectId/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .send({
                    name: 'Test töövoog',
                    description: 'Test töövoo kirjeldus',
                    user_id: 1
                })
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    res.body.should.have.property('date_created');

                    var id = res.body.id;

                    request(url).put('/workflow-definition/' + id)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .send({
                            name: 'Test töövoog (Muudetud)',
                            description: 'Test töövoo kirjeldus (Muudetud)'
                        })
                        .end(function(err, res) {
                            res.body.should.have.property('date_updated');
                            done();
                        });
                });
        });

        var workflowDefinitionServiceId = null;

        it('addes service to the workflow definition', function(done) {

            request(url).post('/workflow-definition/1/service')
                .expect(200)
                .expect('Content-Type', /json/)
                .send({
                    service_id: 1
                })
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    workflowDefinitionServiceId = res.body.id;
                    done();
                });
        });

        it('removes service from the workflow definition', function(done) {

            request(url).delete('/workflow-definition/service/' + workflowDefinitionServiceId)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });
    });

    describe('/workflow', function(done) {
        it('returns workflow', function(done) {
            request(url).get('/workflow/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    res.body.should.have.property('workflow_definition_id');
                    res.body.should.have.property('input_resource_id');
                    res.body.should.have.property('status');
                    res.body.should.have.property('datetime_start');
                    res.body.should.have.property('datetime_end');
                    //res.body.should.have.property('workflow_services'); // TODO: add
                    res.body.id.should.equal(1);
                    done();
                });
        });

        it('returns list of workflows by project id', function(done) {
            request(url).get('/workflow/projectId/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 1);
                    done();
                });
        });

        it('returns list of workflow service params by workflow service id', function(done) {
            request(url).get('/workflow/service/1/params')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 2);
                    done();
                });
        });
    });

    describe('/resource', function(done) {
        it('returns list of resources', function(done) {
            request(url).get('/resource')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 1);
                    done();
                });
        });

        it('returns a resource', function(done) {
            request(url).get('/resource/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id');
                    res.body.should.have.property('source_original_name');
                    res.body.should.have.property('source_filename');
                    res.body.should.have.property('filename');
                    res.body.should.have.property('name');
                    res.body.should.have.property('date_created');
                    res.body.should.have.property('corpora_name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('author');
                    res.body.should.have.property('content_type');
                    res.body.should.have.property('encoding');
                    res.body.should.have.property('language');
                    res.body.should.have.property('date_updated');
                    res.body.should.have.property('hash');
                    res.body.id.should.equal(1);
                    done();
                });
        });

        it('returns project resources', function(done) {
            request(url).get('/resource/projectId/1')
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.body.length, 0);
                    done();
                });
        });
    });
});