var ObjectUtils = {

    hasKeyValue: function(object, value){
        for(var i in object){
            if (!object.hasOwnProperty(i)) {
                continue;
            }

            if(object[i] == value){
                return true;
            }
        }
        return false;
    },

    snakeToCame: function (object) {

        var newObject = {};
        for(var i in object){
            if (object.hasOwnProperty(i)) {
                var newKey = i.replace(/[\-_\s]+(.)?/g, function (match, chr) {
                    return chr ? chr.toUpperCase() : '';
                });
                newObject[newKey] = object[i];
            }
        }
        return newObject;
    },

    mapProperties: function(object, properties){
        var result = {};
        for(var i in properties){

            if (!properties.hasOwnProperty(i)) {
                continue;
            }

            result[properties[i]] = object[properties[i]];
        }
        return result;
    }
};

module.exports = ObjectUtils;