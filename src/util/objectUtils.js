var ObjectUtils = {

    hasKeyValue: function(object, value){
        for(i in object){
            if(object[i] == value){
                return true;
            }
        }
        return false;
    }
};

module.exports = ObjectUtils;