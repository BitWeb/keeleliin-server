var ObjectUtils = {

    hasKeyValue: function(object, value){
        for(i in object){
            if(object[i] == value){
                return true;
            }
        }
        return false;
    },

    snakeToCame: function (object) {

        var newObject = {};
        for(i in object){
            newKey = i.replace(/[\-_\s]+(.)?/g, function(match, chr) {
                return chr ? chr.toUpperCase() : '';
            });
            newObject[newKey] = object[i];
        }
        return newObject;
    },

    mapProperties: function(object, properties){
        var result = {};
        for(i in properties){
            result[properties[i]] = object[properties[i]];
        }
        return result;
    }
};

module.exports = ObjectUtils;