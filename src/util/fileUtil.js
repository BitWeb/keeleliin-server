/**
 * Created by priit on 31.07.15.
 */
var logger = require('log4js').getLogger('file_util');

var FileUtil = {

    getExtension: function(filename) {

        var dotIndex = filename.lastIndexOf('.');
        if(dotIndex > -1){
            return filename.substr(filename.lastIndexOf('.')+1);
        }
        return null;
    },

    getName: function( filename ) {

        var dotIndex = filename.lastIndexOf('.');
        if( dotIndex > -1){
            return filename.substr(0, filename.lastIndexOf('.'));
        }
        return filename;
    },

    getSourceName: function( filename ) {

        var dotIndex = filename.indexOf('.');
        if( dotIndex > -1){
            return filename.substr(0, dotIndex);
        }
        return filename;
    },

    getExtendedName: function(filename, extender){

        var extension = FileUtil.getExtension( filename );
        var name = FileUtil.getName( filename );

        var dotIndex = name.lastIndexOf('.');
        var orgPrefix;
        if(dotIndex > -1){
            orgPrefix = name.substr(0, dotIndex);
        } else {
            orgPrefix = name;
        }

        var extendedName = orgPrefix + '.' + extender;
        if(extension){
            extendedName = extendedName + '.' + extension;
        }
        return extendedName;
    },

    normalizeFileName: function(fileName, replaceStr) {
        if (replaceStr == undefined) {
            replaceStr = '_';
        }
        return fileName.replace(/[\/\\]/g, replaceStr);
    }
};

module.exports = FileUtil;