/**
 * Created by priit on 1.07.15.
 */

function SubstepServiceDtoMapper(){

    var self = this;

    var substep;
    var resources;


    this.getSubstepServiceDto = function (workflowSubstep, cb) {


        substep = workflowSubstep;


        async.waterfall([
            function (callback) {
                self.getWorkflowService(callback);
            },
            function (callback) { //ressursid // eeldatakse ühte
                substep.getInputResources().then(function (data) {
                    resources = data;
                    callback();
                }).catch(function (err) {
                    logger.error('Get substep input resources error');
                    callback(err);
                });
            },
            function (callback) {
                substep.getWorkflowService().then(function (workflowService) {
                    workflowService



                });
            }

        ], function (err) {

        });




    };

    this.getWorkflowService = function (cb) {
        substep.getWorkflowService().then(function (workflowService) {
            cb(null, workflowService);
        });
    }




}

module.exports = SubstepServiceDtoMapper;