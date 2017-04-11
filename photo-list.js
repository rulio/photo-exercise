'use strict';
var Promise             = require('bluebird');
var rp                  = require('request-promise');
var req                 = require('request');
var path                = require('path');
var fs                  = require('fs');
var parseString         = Promise.promisify(require("xml2js").parseString);
var unlink              = Promise.promisify(require("fs").unlink);

module.exports = function photo_list (){
    var base_url  = 'http://s3.amazonaws.com/waldo-recruiting';
    var dl_folder = 'downloads/';
    return {
        // Get the list of s3 objects from the bucket directory.
        get: function (name) {
            var self = this;
            var request = {uri: base_url, resolveWithFullResponse: true};

            return rp(request)
                .then(function (resp) {
                    if (resp.statusCode == '200') {
                        return self.parse(resp.body)
                            .then(function(data){
                               return data.ListBucketResult.Contents;
                            });
                    }
                });
        },
        is_photo:function(item){
            return path.extname(item.Key) == ".jpg" || path.extname(item.Key) == ".jpeg";
        },

        // Parse the XML bucket list data into JSON.
        parse(bucket_data){
            return parseString(bucket_data)
                .then(function(data){

                    var results = [];
                    data.ListBucketResult.Contents.forEach(function(item){
                        item.Key            = item.Key[0];
                        item.LastModified   = item.LastModified[0];
                        item.ETag           = item.ETag[0];
                        item.Size           = parseInt(item.Size[0]);
                        item.StorageClass   = item.StorageClass[0];
                    })
                    return data
                })
        },
        // Construct the uri of the s3 object fromt the item key.
        get_photo_uri:function(item){
            return base_url +"/"+item.Key
        },

        // Download an object from s3.
        // Exif library works on local files.
        download:function(item){
            var remote_file,
                file,
                uri =this.get_photo_uri(item)

            this.create_dowload_folder();

            // Promisify the download of the photo.
            return new Promise(function(resolve,reject){
                file = fs.createWriteStream(dl_folder + item.Key);

                remote_file = req.get(uri,function(error,response){
                    if (response.statusCode !=200){
                        reject(Error('Could not retrieve file at uri: ' + uri));
                    }
                });

                remote_file.on('data', function(chunk) {
                    file.write(chunk);
                });

                remote_file.on('end',function(){
                    // Return the filename of downloaded file.
                    // it is placed in current directory
                    resolve(item.Key);
                });

            })
        },
        get_filename:function(item){
            return dl_folder + item.Key;
        },
        // Remove file from local filesystem
        delete_local:function(item){
            return unlink(dl_folder + item.Key);
        },
        create_dowload_folder:function(){
            var dir = './' + dl_folder;

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
        }
    }
}();