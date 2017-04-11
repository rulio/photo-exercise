'use strict';
var Promise   = require('bluebird');
var ExifImage = require('exif').ExifImage;

module.exports = function exif_reader (){
    return {
        read:function(filename){
            return new Promise(function(resolve,reject){
                try {
                    new ExifImage({ image : filename }, function (error, exifData) {
                        if (error)
                            reject(error);
                        else
                            resolve(exifData);
                    });
                } catch (error) {
                   reject(error);
                }

            })
        }
    }
}();