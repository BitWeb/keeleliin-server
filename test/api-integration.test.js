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
    var app;

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