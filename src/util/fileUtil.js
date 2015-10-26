/**
 * Created by priit on 31.07.15.
 */
var logger = require('log4js').getLogger('file_util');
var fs = require('fs');

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
    },

    concat: function(source, target, callback) {
        var cbCalled = false;

        var rd = fs.createReadStream(source);
        rd.on("error", function(err) {
            done(err);
        });

        var wr = fs.createWriteStream(target, {'flags': 'a'});
        wr.on("error", function(err) {
            done(err);
        });
        wr.on("close", function(ex) {
            done();
        });

        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                callback(err);
                cbCalled = true;
            }
        }
    },

    mv: function(source, target, callback) {
        FileUtil.cp(source, target, function (err) {
            if(err) return callback(err);
            fs.unlink(source, callback);
        });
    },

    cp: function(source, target, callback) {
        var cbCalled = false;

        var rd = fs.createReadStream(source);
        rd.on("error", function(err) {
            done(err);
        });

        var wr = fs.createWriteStream(target);
        wr.on("error", function(err) {
            done(err);
        });
        wr.on("close", function(ex) {
            done();
        });

        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                callback(err);
                cbCalled = true;
            }
        }
    }
};

module.exports = FileUtil;