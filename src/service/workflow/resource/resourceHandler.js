/**
 * Created by priit on 22.07.15.
 */

var logger = require('log4js').getLogger('resource_handler');
var async = require('async');
var ResourceType = require(__base + 'src/service/dao/sql').ResourceType;
var ResourceAssociation = require(__base + 'src/service/dao/sql').ResourceAssociation;
var Resource = require(__base + 'src/service/dao/sql').Resource;
var ServiceInputType = require(__base + 'src/service/dao/sql').ServiceInputType;
var ResourceCreator = require('./resourceCreator');
var ArrayUtil = require(__base + 'src/util/arrayUtils');
var fs = require('fs');
var lineReader = require('line-reader');
var config = require(__base + 'config');

function ResourceHandler(project, workflow) {

    var self = this;

    /**
     * resourceJunkCallback Callback if substep junk created
     * cb Callbac if resources traversed
     * */
    this.getWorkflowServiceSubStepsInputResources = function (workflowService, fromSubStep, resourceJunkCallback, resourcesCb) {

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
                    return resourceJunkCallback(null, [], function (err) {
                        resourcesCb(err);
                    });
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

            function (callback) {
                if(service.isSynchronous){
                    return self._getSyncServiceResources(fromSubStep, workflowService, inputTypes, inputResourceTypes, resourceJunkCallback, callback );
                } else {
                    return self.getAsyncServiceResources(fromSubStep, workflowService, inputTypes, inputResourceTypes, resourceJunkCallback, callback );
                }
            }
        ], resourcesCb);
    };


    this.getAsyncServiceResources = function (fromSubStep, workflowService, inputTypes, inputResourceTypes, resourceJunkCallback, resourcesCb) {

        async.waterfall([
            function getInitResources(callback) {
                logger.debug('Get resource junks');
                if(fromSubStep){
                    fromSubStep.getOutputResources({
                        through:{
                            attributes:[]
                        }
                    }).then(function (resources) {
                        return callback(null, resources);
                    });
                } else {
                    workflowService.getWorkflow().then(function (workflow) {
                        workflow.getInputResources({
                            through:{
                                attributes:[]
                            }
                        }).then(function (resources) {
                            return callback(null, resources);
                        });
                    });
                }
            },
            function mapResourceJunks(resources, callback) {
                self._getResourceJunks(resources, inputTypes, inputResourceTypes, fromSubStep, callback);
            },
            function traverseJunks(resourceJunks, callback) {

                logger.debug('Start traverse junks');
                async.each(
                    resourceJunks,
                    function iterator(resourceJunk, itCallback) {
                        logger.debug('Traverse resources iteration');
                        self._handleResourceJunk(resourceJunk, inputTypes, inputResourceTypes, workflowService, resourceJunkCallback, itCallback);
                    },
                    function done(err) {
                        logger.debug('Resource junks traversed for service:' + workflowService.id);
                        callback(err);
                    }
                );
            }
        ], resourcesCb);
    };

    this._getSyncServiceResources = function ( fromSubStep, workflowService, inputTypes, inputResourceTypes, resourceJunkCallback, resourcesCb ) {

        async.waterfall([
            function getResources( callback ) {

                var initResources = [];

                if(fromSubStep){
                    fromSubStep.getWorkflowService().then(function (previousWorkflowService) {

                        previousWorkflowService.getSubSteps().then(function (substeps) {
                            async.each(substeps, function (substep, innerCallback) {
                                substep.getOutputResources({
                                    through:{
                                        attributes:[]
                                    }
                                }).then(function (resources) {
                                    initResources = initResources.concat(resources);
                                    return innerCallback();
                                });
                            }, function (err) {
                                callback(err, initResources );
                            });
                        });
                    });
                } else {
                    workflowService.getWorkflow().then(function (workflow) {
                        workflow.getInputResources({
                            through:{
                                attributes:[]
                            }
                        }).then(function (resources) {
                            return callback(null, resources);
                        });
                    });
                }
            },
            function filterResources( resources, callback ) {
                var filteredResult = [];
                for(i in resources){
                    var resource = resources[i];
                    for(j in inputResourceTypes){
                        var inputType = inputResourceTypes[j];
                        if(resource.resourceTypeId == inputType.id){
                            filteredResult.push(resource);
                        }
                    }
                }
                callback( null, filteredResult);
            }
        ], function (err, resources) {

            if(err){
                logger.error('Resource handle error happened', err);
                return resourcesCb(err);
            }

            resourceJunkCallback(null, resources, function (err) {
                resourcesCb();
            });
        });
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

        for (i in resources) {
            var resource = resources[i];
            if (isResourceTypeNeeded(resource.resourceTypeId) == true) {
                putResourceToJunk(resource);
            } else {
                logger.info('Resource ' + resource.id + ' is not used in current service step.');
            }
        }

        //If last substep gives no suitable output then make one empty junk
        if(junks.length == 0){
            junks.push([]);
        }

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

    this._handleResourceJunk = function (resourceJunk, inputTypes, inputResourceTypes, workflowService, resourceJunkCallback, junkHandledCb) {


        var buffer = {};
        var putToBuffer = function (subResource, index) {

            if(buffer[index] == undefined){
                buffer[index] = [];
            }
            buffer[index].push(subResource);
        };

         function SubBufferHandler() {
            var init = [];
            this.cross = function (buffer) {
                var updatedInit = [];
                for(i in buffer){
                    var item = buffer[i];
                    if(init.length > 0){
                        for(j in init){
                            var subArray = init[j].slice(0);
                            subArray.push( item );
                            updatedInit.push(subArray);
                        }
                    } else {
                        var subArray = [item];
                        updatedInit.push(subArray);
                    }
                }
                init = updatedInit.slice(0);
            };
             this.getResult = function () {
                 return init;
             }
        }

        var handleBuffer = function (cb) {

            var subBufferHandler = new SubBufferHandler();
            for( i in buffer ){
                subBufferHandler.cross( buffer[i] );
            }
            var resultJunks = subBufferHandler.getResult();
            var sendJunk = function (index) {
                if(resultJunks[ index ]){
                    return resourceJunkCallback(null, resultJunks[ index ], function (err) {
                        index = index + 1;
                        sendJunk(index);
                    });
                } else {
                    cb();
                }
            };
            sendJunk(0);
        };

        async.forEachOfSeries(resourceJunk, function (resource, index, callback) {
            var serviceInputType = ArrayUtil.find(inputTypes, function (element) { return element.resourceTypeId == resource.resourceTypeId; });
            var serviceInputResourceType = ArrayUtil.find(inputResourceTypes, function (element) { return element.id == resource.resourceTypeId; });

            self._handleResource(
                resource,
                serviceInputType,
                serviceInputResourceType,
                workflowService,
                function subResourceCallback(err, subresource, srCb) {
                    logger.debug('Get subResource callback: ' + subresource.id);
                    putToBuffer(subresource, index );
                    srCb();
                },
                function resourceIsHandled(err) {
                    if (err) logger.error(err);
                    logger.debug('Resource resource is handled on index: ' + index);
                    callback();
                }
            );
        }, function (err) {
            handleBuffer(function ( err ) {
                junkHandledCb( err )
            });
        });
    };

    this._handleResource = function (resource, serviceInputType, serviceInputResourceType, workflowService, subResourceCallback, resourceCallback) {

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
                }).catch(resourceCallback);
            },
            function checkResourceTypeCompatibility(callback) {
                logger.debug('Check compatibility');
                if (!serviceInputResourceType) {
                    return resourceCallback();
                }
                if (!resourceType) {
                    return resourceCallback();
                }
                if (serviceInputResourceType.value != resourceType.value) {
                    return resourceCallback();
                }
                callback();
            },
            function checkAllowedDoParallel(callback) {
                logger.debug('Check do parallel');
                if (serviceInputType.doParallel == false || serviceInputType.sizeLimit == 0) {
                    logger.debug('Can not do parallel');
                    return subResourceCallback(null, resource, function (err) {
                        resourceCallback(err);
                    });
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
                            return subResourceCallback(null, resource, function (err) {
                                resourceCallback(err);
                            });
                        }
                    });
                } else {
                    //Can't tell
                    return callback();
                }
            },
            function doSplit(callback) {
                logger.debug('Do parallel');
                self._split(resource, resourceType, serviceInputType, workflowService, subResourceCallback, callback);
            }
        ], function (err) {
            if(err){
                logger.error(err);
            }
            resourceCallback(err);
        });
    };

    this._split = function (resource, resourceType, serviceInputType, workflowService, subResourceCallback, fileFinishCb) {

        if (resourceType.splitType == ResourceType.splitTypes.NONE) {

            return subResourceCallback(null, resource, function (err) {
                fileFinishCb(err);
            });

        } else if (resourceType.splitType == ResourceType.splitTypes.LINE) {
            logger.debug('Start line split for resource id: ' + resource.id);
            self._splitOnLine(resource, serviceInputType, workflowService, subResourceCallback, fileFinishCb);
        } else {
            logger.error('Split type split not defined: ' + resourceType.splitType);
            fileFinishCb();
        }
    };

    this._splitOnLine = function (sourceResource, serviceInputType, workflowService, subResourceCallback, fileFinishCb) {

        var filename = sourceResource.filename;
        var pathToSourceFile = config.resources.location + '/' + filename;

        var globalLineIndex = 0;
        var subResourceIndex = 0;
        var limitLeft = serviceInputType.sizeLimit;
        var resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex, project, workflow);

        lineReader.eachLine(pathToSourceFile, function (line, last, lineReaderCb) {

            if (globalLineIndex == 0 && last) {
                logger.debug('One line file. Return current resource.');
                return subResourceCallback(null, sourceResource, function (err) {
                    fileFinishCb(err);
                    lineReaderCb(false); //stop reading lines
                });
            }

            globalLineIndex++;

            var lineSize;
            if (serviceInputType.sizeUnit == ServiceInputType.sizeUnits.PIECE) {
                lineSize = 1;
            } else if (serviceInputType.sizeUnit == ServiceInputType.sizeUnits.BYTE) {
                lineSize = Buffer.byteLength(line);
            }

            if (lineSize > serviceInputType.sizeLimit) {
                fileFinishCb('Line size is greater than input size limit');
                return lineReaderCb(false);
            }

            limitLeft = limitLeft - lineSize;

            if (limitLeft <= 0) { //subresource filled
                resourceCreator.finish(function (err, resource) {
                    subResourceIndex++;
                    logger.debug('Subresource filled');

                    subResourceCallback(null, resource, function (err) {
                        resourceCreator = new ResourceCreator(sourceResource, workflowService, globalLineIndex, project, workflow);
                        limitLeft = serviceInputType.sizeLimit - lineSize;
                        write();
                    });
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
                            subResourceCallback(null, resource, function (err) {
                                lineReaderCb(false); //stop reading
                                fileFinishCb();
                            });
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