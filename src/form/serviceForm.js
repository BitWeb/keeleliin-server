var requestForm = require(__base + 'src/form/requestForm');
var _ = require('underscore');

var ServiceForm = function(data) {
    requestForm.call(this, data);

    this.inputFilter = {
        sid: {
            required: true,
            allowEmpty: false
        },
        name: {
            required: true,
            allowEmpty: false
        },
        description: {
            required: false,
            allowEmpty: true
        },
        url: {
            required: false,
            allowEmpty: true
        },
        serviceInputTypes: {
            required: false,
            allowEmpty: true,
            inputFilter: {
                id: {
                    required: false,
                    allowEmpty: true
                },
                resourceTypeId: {
                    required: true,
                    allowEmpty: false
                },
                key: {
                    required: true,
                    allowEmpty: false
                },
                sizeLimit: {
                    required: false,
                    allowEmpty: true
                },
                sizeUnit: {
                    required: false,
                    allowEmpty: true
                },
                isList: {
                    required: false,
                    allowEmpty: false
                },
                doParallel: {
                    required: false,
                    allowEmpty: true
                }
            }
        },
        serviceOutputTypes: {
            required: false,
                allowEmpty: true,
                inputFilter: {
                    id: {
                        required: false,
                        allowEmpty: true
                    },
                    resourceTypeId: {
                        required: true,
                        allowEmpty: false
                    },
                    key: {
                        required: true,
                        allowEmpty: false
                    }
            }
        },
        serviceParams: {
            required: false,
            allowEmpty: false,
            inputFilter: {
                id: {
                    required: false,
                    allowEmpty: true
                },
                type: {
                    required: true,
                    allowEmpty: false
                },
                key: {
                    required: false,
                    allowEmpty: true
                },
                value: {
                    required: false,
                    allowEmpty: true
                },
                description: {
                    required: false,
                    allowEmpty: true
                },
                isEditable: {
                    required: false,
                    allowEmpty: true
                },
                paramOptions: {
                    required: false,
                    allowEmpty: true,
                    inputFilter: {
                        id: {
                            required: false,
                            allowEmpty: true
                        },
                        label: {
                            required: true,
                            allowEmpty: false
                        },
                        value: {
                            required: false,
                            allowEmpty: true
                        }
                    }
                }
            }
        }
    };

};


ServiceForm.prototype = _.extend(requestForm.prototype, ServiceForm.prototype);

module.exports = ServiceForm;