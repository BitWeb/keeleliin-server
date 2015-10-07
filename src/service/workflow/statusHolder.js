/**
 * Created by priit on 27.07.15.
 */
var logger = require('log4js').getLogger('running_workflow_status_holder');

function StatusHolder(){

    var self = this;
    var serviceStatuses = {};

    this.updateFilesToParseCount = function ( workflowService, change) {
        self._checkItem( workflowService );
        serviceStatuses[workflowService.id].filesToParse = serviceStatuses[workflowService.id].filesToParse + change;
        logger.debug('Is in proccessing update files id: '+workflowService.id+'. Files to parse: ' + self._getFilesToParseCount(workflowService) + ' Steps to run: ' + self._getSubStepsToRunCount(workflowService));
        return this;
    };

    this.updateSubStepsToRunCount = function ( workflowService, change ) {
        self._checkItem( workflowService );
        serviceStatuses[workflowService.id].subStepsToRun = serviceStatuses[workflowService.id].subStepsToRun + change;
        logger.debug('Is in proccessing update substeps id: '+workflowService.id+'. Files to parse: ' + self._getFilesToParseCount(workflowService) + ' Steps to run: ' + self._getSubStepsToRunCount(workflowService));
        return this;
    };

    this._getFilesToParseCount = function (workflowService) {
        self._checkItem( workflowService );
        return serviceStatuses[workflowService.id].filesToParse;
    };

    this._getSubStepsToRunCount = function (workflowService) {
        self._checkItem( workflowService );
        var stepsToRun = 0;
        for(i in serviceStatuses){
            var item = serviceStatuses[i];
            if(i <= workflowService.id){
                stepsToRun += item.subStepsToRun;
            }
        }
        return stepsToRun;
    };

    this.isInProcessing = function (workflowService) {
        self._checkItem( workflowService );
        logger.debug('Is in proccessing check id: '+workflowService.id+'. Files to parse: ' + self._getFilesToParseCount(workflowService) + ' Steps to run: ' + self._getSubStepsToRunCount(workflowService));
        if( self._getFilesToParseCount(workflowService) == 0 && self._getSubStepsToRunCount(workflowService) == 0 ){
            return false;
        }
        return true;
    };
    
    this._checkItem = function ( workflowService ) {
        if(serviceStatuses[workflowService.id] == undefined){
            serviceStatuses[workflowService.id] = {
                filesToParse: 0,
                subStepsToRun: 0
            };
        }
    };
}

module.exports = StatusHolder;
