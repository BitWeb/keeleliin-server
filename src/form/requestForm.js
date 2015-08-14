var RequestForm = function(data, parentElementName) {

    var self = this;

    this.inputData = data;
    this.filteredData = {};
    this.inputFilter = {};
    this.errors = [];
    this.parentElementName = (parentElementName || null);

    this._validate = function() {
        for (var prop in self.inputFilter) {
            if (self.inputFilter.hasOwnProperty(prop)) {
                var inputFilter = self.inputFilter[prop];
                var value = self.inputData[prop];
                var elementName = self._getElementName(prop);

                if (self.inputData[prop] === undefined) {
                    if (inputFilter.required) {
                        self.errors.push({name: elementName, message: 'Is required.'});
                    }
                    continue;
                }

                if (inputFilter.filter != undefined) {
                    value = inputFilter.filter(value);
                }

                if (!inputFilter.allowEmpty && (value == null || value == '' || self._isArray(value) && value.length == 0)) {
                    self.errors.push({name: elementName, message: 'Cannot be empty.'});
                    continue;
                }

                if (self._isArray(value) && inputFilter.inputFilter != undefined) {
                    for (var itemIdx in value) {
                        var item = value[itemIdx];
                        var form = new RequestForm(item, prop);
                        form.inputFilter = inputFilter.inputFilter;
                        if (form.isValid()) {
                            value[itemIdx] = form.getData();
                        } else {
                            for (var i in form.errors) {
                                self.errors.push(form.errors[i]);
                            }
                        }
                    }
                }

                self.filteredData[prop] = value;
            }
        }

        return self.errors.length == 0;
    };

    this._getElementName = function(name) {

        return (self.parentElementName ? self.parentElementName + '.' : '') + name;
    };

    this.isValid = function() {
        return self._validate();
    };

    this.getData = function() {
        return self.filteredData;
    };

    this._isArray = function(value) {
        return value != null && value.constructor === Array;
    };

};

module.exports = RequestForm;