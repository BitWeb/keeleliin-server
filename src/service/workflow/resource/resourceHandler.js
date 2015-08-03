/**
 * Created by priit on 22.07.15.
 */

var logger = require('log4js').getLogger('resource_handler');
var async = require('async');
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ResourceCreator = require('./resourceCreator');

var fs = require('fs');
var lineReader = require('line-reader');
var config = require(__base + 'config');

function ResourceHandler() {

    var self = this;

    this.getWorkflowServiceSubStepsInputResources = function (resources, workflowService, resourceCallback, cb) {

        var service;
        var inputType;
        var inputResourceType;

        async.waterfall([
            function getService(callback) {
                logger.debug('Get service');
                workflowService.getService().then(function (item) {
                    if(!item){
                        logger.error(workflowService);
                        callback('Workflow service has no service.');
                    }
                    logger.debug('Got service id: ' + item.id);
                    service = item;
                    callback();
                }).catch(callback);
            },
            function getServiceInputType(callback) {
                logger.debug('Get input resources');
                service.getServiceInputTypes().then(function (inputTypes) {
                    inputType = inputTypes.pop(); //Currently one
                    callback();
                }).catch(callback);
            },
            function getInputTypeResourceType(callback) {
                logger.debug('Get input resource types');
                inputType.getResourceType().then(function (item) {
                    inputResourceType = item;
                    callback();
                }).catch(callback);
            },
            function traverseAndSplitResources(callback) {
                logger.debug('Traverse resources');
                async.eachSeries(
                    resources,
                    function iterator(resource, itCallback) {
                        logger.debug('Traverse resources iteration');
                        self._handleResource(resource, inputType, inputResourceType, workflowService, resourceCallback, itCallback);
                    },
                    function done(err) {
                        callback(err);
                    }
                );
            }
        ], cb);
    };

    this._handleResource = function (resource, serviceInputType, serviceInputResourceType, workflowService, resourceCallback, cb) {

        var resourceType;
        var pathToSourceFile = config.resources.location + '/' + resource.filename;

        async.waterfall([
            function checkIfResourceExcists(callback) {
                fs.lstat( pathToSourceFile, function (err, inodeStatus) {
                    var errorMessage;
                    if (err) {
                        if (err.code === 'ENOENT' ) {
                            errorMessage = 'Ressursi faili ei leitud. Id:' + resource.id;
                            logger.error(errorMessage);
                            return callback(errorMessage);
                        }
                        logger.error(err.message);
                        return callback(err.message);
                    }

                    if(inodeStatus.isDirectory()){
                        errorMessage = 'Tegemist on kaustaga. Id:' + resource.id;
                        logger.error(errorMessage);
                        return callback(errorMessage);
                    }

                    return callback();
                });
            },
            function getResourceResourceType(callback) {
                logger.debug('Get resource type');
                resource.getResourceType().then(function (item) {
                    resourceType = item;
                    callback();
                }).catch(cb);
            },
            function checkResourceTypeCompatibility(callback) {
                logger.debug('Check compatibility');
                if (!serviceInputResourceType) {
                    return cb();
                }
                if (!resourceType) {
                    return cb();
                }
                if (serviceInputResourceType.value != resourceType.value) {
                    return cb();
                }
                callback();
            },
            function checkAllowedDoParallel(callback) {
                logger.debug('Check do parallel');
                if (serviceInputType.doParallel == false || serviceInputType.sizeLimit == 0) {
                    logger.debug('Can not do parallel');
                    resourceCallback(null, resource);
                    return cb();
                }
                callback();
            },
            function checkIfSomethingToSplit(callback){
                if(serviceInputType.sizeUnit == ServiceInputType.sizeUnits.BYTE){
                    fs.stat(pathToSourceFile, function (err, stats) {
                        if(stats.size > serviceInputType.sizeLimit){
                            return callback();
                        } else {
                            logger.debug('Can not do parallel. Smaller than limit');
                            resourceCallback(null, resource);
                            return cb();
                        }
                    });
                } else {
                    //Can't tell
                    return callback();
                }
            },
            function doSplit(callback) {
                logger.debug('Do parallel');
                self._split(resource, resourceType, serviceInputType, workflowService, resourceCallback, callback);
            }
        ], function (err) {
            cb(err);
        });
    };

    this._split = function (resource, resourceType, serviceInputType, workflowService, subResourceCallback, cb) {

        if (resourceType.splitType == ResourceType.splitTypes.NONE) {
            subResourceCallback(null, resource);
            return cb();
        } else if (resourceType.splitType == ResourceType.splitTypes.LINE) {
            logger.debug('Start line split for resource id: ' + resource.id);
            self._splitOnLine(resource, serviceInputType, workflowService, subResourceCallback, cb);
        } else {
            logger.error('Split type split not defined: ' + resourceType.splitType);
            cb();
        }
    };

    this._splitOnLine = function (sourceResource, serviceInputType, workflowService, subResourceCallback, cb) {

        var filename = sourceResource.filename;
        var pathToSourceFile = config.resources.location + '/' + filename;

        var globalLineIndex = 0;
        var subResourceIndex = 0;


        var limitLeft = serviceInputType.sizeLimit;
        var resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex);

        lineReader.eachLine(pathToSourceFile, function (line, last, lineReaderCb) {

            if (globalLineIndex == 0 && last) {
                logger.debug('One line file. Return current resource.');
                subResourceCallback(null, sourceResource); // return current resource and finish
                cb(); //stop handling sourceResource
                return lineReaderCb(false); //stop reading lines
            }

            globalLineIndex++;

            var lineSize;
            if (serviceInputType.sizeUnit == ServiceInputType.sizeUnits.PIECE) {
                lineSize = 1;
            } else if (serviceInputType.sizeUnit == ServiceInputType.sizeUnits.BYTE) {
                lineSize = Buffer.byteLength(line);
            }

            if (lineSize > serviceInputType.sizeLimit) {
                cb('Line size is greater than input size limit');
                return lineReaderCb(false);
            }

            limitLeft = limitLeft - lineSize;

            if (limitLeft <= 0) { //subresource filled
                resourceCreator.finish(function (err, resource) {
                    subResourceIndex++;
                    logger.debug('Subresource filled');
                    subResourceCallback(null, resource);
                    resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex);
                    limitLeft = serviceInputType.sizeLimit - lineSize;
                    write();
                });
            } else {
                write()
            }

            function write() {

                line = line + '\n';

                resourceCreator.write(line, function () {
                    if (last) {
                        resourceCreator.finish(function (err, resource) {
                            logger.debug('Line split finished');
                            subResourceCallback(null, resource);
                            lineReaderCb(false); //stop reading
                            cb();
                        });
                    } else {
                        lineReaderCb();
                    }
                });
            }
        });
    };

}

module.exports = new ResourceHandler();