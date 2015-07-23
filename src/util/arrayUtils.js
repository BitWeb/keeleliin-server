var ArrayUtils = {
    arrayDiff: function(array1, array2) {
        var result = [];
        for (var i = 0; i < array1.length; i++) {
            if (array2.indexOf(array1[i]) == -1) {
                result.push(array1[i]);
            }
        }
        return result;
    }
};

module.exports = ArrayUtils;