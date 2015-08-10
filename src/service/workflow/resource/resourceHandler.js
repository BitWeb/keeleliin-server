/**
 * Created by priit on 22.07.15.
 */

var logger = require('log4js').getLogger('resource_handler');
var async = require('async');
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ResourceCreator = require('./resourceCreator');
var ArrayUtil = require(__base + 'src/util/arrayUtils');
var fs = require('fs');
var lineReader = require('line-reader');
var config = require(__base + 'config');

function ResourceHandler(project) {

    var self = this;

    this.getWorkflowServiceSubStepsInputResources = function (resources, workflowService, fromSubStep, resourceJunkCallback, cb) {

        var service;
        var inputTypes;
        var inputResourceTypes;

        async.waterfall([
            function getService(callback) {
                logger.debug('Get service');
                workflowService.getService().then(function (item) {
                    if (!item) {
                        logger.error(workflowService);
                        callback('Workflow service has no service.');
                    }
                    logger.debug('Got service id: ' + item.id);
                    service = item;
                    callback();
                }).catch(callback);
            },
            function getServiceInputTypes(callback) {
                logger.debug('Get input resources');
                service.getServiceInputTypes().then(function (result) {
                    inputTypes = result;
                    callback();
                }).catch(callback);
            },
            function checkInputTypesLength(callback) {
                if (inputTypes.length == 0) {
                    logger.info('Service has no inputs!');
                    resourceJunkCallback(null, []);
                    cb();
                    return;
                }
                return callback();
            },
            function getInputTypeResourceTypes(callback) {
                logger.debug('Get input resource types');
                async.map(
                    inputTypes,
                    function (inputType, itCallback) {
                        inputType.getResourceType().then(function (inputResourceType) {
                            itCallback(null, inputResourceType);
                        }).catch(itCallback);
                    },
                    function (err, resourceTypes) {
                        inputResourceTypes = resourceTypes;
                        logger.debug('Input resource types found: ' + resourceTypes.length);
                        callback(err);
                    }
                );
            },

            function mapResourceJunks(callback) {
                logger.debug('Get resource junks');
                self._getResourceJunks(resources, inputTypes, inputResourceTypes, fromSubStep, callback);
            },

            function traverseJunks(resourceJunks, callback) {

                logger.debug('Start traverse junks');
                async.eachSeries(
                    resourceJunks,
                    function iterator(resourceJunk, itCallback) {
                        logger.debug('Traverse resources iteration');
                        self._handleResourceJunk(resourceJunk, inputTypes, inputResourceTypes, workflowService, resourceJunkCallback, itCallback);
                    },
                    function done(err) {
                        logger.debug('Resource junks traversed');
                        callback(err);
                    }
                );
            }
        ], cb);
    };


    //leiab kogumikud failidest, mis peaksid teenusele sisendiks sobima
    this._getResourceJunks = function (resources, inputTypes, inputResourceTypes, fromSubStep, callback) {

        logger.debug('Start map junks');

        var resourcesCountInJunk = inputTypes.length;
        var junks = [];

        var isResourceTypeNeeded = function (resourceTypeId) {
            var inputType = ArrayUtil.find(inputResourceTypes, function (item) {
                return item.id == resourceTypeId
            });
            return !!inputType;
        };

        var putResourceToJunk = function (resource) {
            var junk;
            for (i in junks) {
                junk = junks[i];
                var resourceWithResourceType = ArrayUtil.find(junk, function (junkResource) {
                    return junkResource.resourceTypeId == resource.resourceTypeId;
                });

                if (resourceWithResourceType == null) {
                    junk.push(resource);
                    return true;
                }
            }
            junk = [];
            junk.push(resource);
            junks.push(junk);
        };

        for (i in resources) {
            var resource = resources[i];
            if (isResourceTypeNeeded(resource.resourceTypeId) == true) {
                putResourceToJunk(resource);
            } else {
                logger.info('Resource ' + resource.id + ' is not used in current service step.');
            }
        }

        var fillMissingResourcesInJunk = function (junk, cb) {

            async.eachSeries(
                inputResourceTypes,
                function fillMissing(inputResourceType, eCallback) {

                    var resourceFromJunk = ArrayUtil.find(junk, function (item) {
                        return item.resourceTypeId == inputResourceType.id
                    });

                    if (resourceFromJunk == null) {
                        self._getResourceFromHistoryByResourceTypeId(inputResourceType.id, fromSubStep, function (err, resource) {
                            if (resource) {
                                junk.push(resource);
                            }
                            eCallback(err);
                        });
                    } else {
                        eCallback();
                    }
                },
                function done(err) {
                    logger.debug('Junk filled: ' + junk.length);
                    cb(err, junk);
                }
            );
        };

        //võimalik, et leidub poolikuid junke. Täidame need ajaloost
        async.map(
            junks,
            function (junk, mCallback) {

                logger.debug('MAP. Junk length: ' + junk.length + ' Expected: ' + resourcesCountInJunk);

                if (junk.length < resourcesCountInJunk) {
                    return fillMissingResourcesInJunk(junk, mCallback);
                } else {
                    return mCallback(null, junk);
                }
            },
            function done(err, result) {
                logger.debug('Junks created: ' + result.length);
                var filledJunks = [];
                for (i in result) {
                    if (result[i].length == resourcesCountInJunk) {
                        filledJunks.push(result[i]);
                    } else {
                        logger.trace('Not filled junk happened');
                    }
                }
                logger.debug('Full junks created: ' + filledJunks.length);
                callback(err, filledJunks);
            }
        );
    };

    this._getResourceFromHistoryByResourceTypeId = function (inputResourceTypeId, subStep, callback) {

        subStep.getPrevSubstep().then(function (prevSubstep) {
            if (prevSubstep) {
                prevSubstep.getOutputResources().then(function (outputResources) {
                    var resource = ArrayUtil.find(outputResources, function (element) {
                        return element.resourceTypeId == inputResourceTypeId
                    });
                    if (resource) {
                        return callback(null, resource);
                    } else {
                        prevSubstep.getInputResources().then(function (inputResources) {
                            var resource = ArrayUtil.find(inputResources, function (element) {
                                return element.resourceTypeId == inputResourceTypeId
                            });
                            if (resource) {
                                return callback(null, resource);
                            } else {
                                return self._getResourceFromHistoryByResourceTypeId(inputResourceTypeId, prevSubstep, callback);
                            }
                        });
                    }
                });
            } else {
                subStep.getWorkflowService().then(function (workflowService) {
                    workflowService.getWorkflow().then(function (workflow) {
                        workflow.getInputResources().then(function (resources) {
                            var resource = self.filterResourceByTypeId(resources, inputResourceTypeId);
                            return callback(null, resource);
                        });
                    })
                });
            }
        });
    };

    this._handleResourceJunk = function (resourceJunk, inputTypes, inputResourceTypes, workflowService, resourceJunkCallback, itCallback) {

        var junkIndex = 0;
        var resourceTraverseCount = 0;
        logger.trace('Resource junk length: ' + resourceJunk);
        self._handleJunkResourceOnIndex(junkIndex, resourceTraverseCount, resourceJunk, [], inputTypes, inputResourceTypes, workflowService, resourceJunkCallback, itCallback);

        //self._handleResource( resource, serviceInputType, serviceInputResourceType, workflowService, resourceCallback, cb );
    };

    this._handleJunkResourceOnIndex = function (index, resourceTraverseCount, resourceJunk, resultJunk, inputTypes, inputResourceTypes, workflowService, junkCallback, cb) {

        logger.debug('Handle resource on index: ' + index);
        resourceTraverseCount = resourceTraverseCount + 1;

        var resource = resourceJunk[index];
        var serviceInputType = ArrayUtil.find(inputTypes, function (element) {
            return element.resourceTypeId == resource.resourceTypeId;
        });
        var serviceInputResourceType = ArrayUtil.find(inputResourceTypes, function (element) {
            return element.id == resource.resourceTypeId;
        });

        self._handleResource(
            resource,
            serviceInputType,
            serviceInputResourceType,
            workflowService,
            function subResourceCallback(err, subresource) {

                logger.debug('Get subresource callback: ' + subresource.id);

                if (err) logger.error(err);
                var result = resultJunk.slice(0); //clone result junk
                result.push(subresource);
                logger.debug('Sub resource callback index: ' + index);
                if (result.length == resourceJunk.length) {
                    logger.trace('Junk callback length: ' + result.length);
                    return junkCallback(err, result);
                } else {
                    var continueIndex = index + 1;
                    return self._handleJunkResourceOnIndex(continueIndex, resourceTraverseCount, resourceJunk, result, inputTypes, inputResourceTypes, workflowService, junkCallback, cb);
                }
            },
            function resourceIsHandled(err) {
                if (err) logger.error(err);
                logger.debug('Junk resource is handled on index: ' + resourceTraverseCount);
                resourceTraverseCount = resourceTraverseCount - 1;
                if (resourceTraverseCount == 0) {
                    logger.debug('Junk is handled');
                    cb(err);
                }
            }
        );
    };

    this._handleResource = function (resource, serviceInputType, serviceInputResourceType, workflowService, resourceCallback, cb) {

        var resourceType;
        var pathToSourceFile = config.resources.location + '/' + resource.filename;

        async.waterfall([
            function checkIfResourceExcists(callback) {
                fs.lstat(pathToSourceFile, function (err, inodeStatus) {
                    var errorMessage;
                    if (err) {
                        if (err.code === 'ENOENT') {
                            errorMessage = 'Ressursi faili ei leitud. Id:' + resource.id;
                            logger.error(errorMessage);
                            return callback(errorMessage);
                        }
                        logger.error(err.message);
                        return callback(err.message);
                    }

                    if (inodeStatus.isDirectory()) {
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
            function checkIfSomethingToSplit(callback) {
                if (serviceInputType.sizeUnit == ServiceInputType.sizeUnits.BYTE) {
                    fs.stat(pathToSourceFile, function (err, stats) {
                        if (stats.size > serviceInputType.sizeLimit) {
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
        var resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex, project);

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
                    resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex, project);
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

module.exports = ResourceHandler;