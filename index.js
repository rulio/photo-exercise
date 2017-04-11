'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/photos');

var Promise = require('bluebird');
var list = require("./photo-list");
var job = require("./photo-jobs")(mongoose);
var reader = require('./exif-reader');

list.get().then(function(data){
    // Loop through each object in the bucket and process that item
    return Promise.map(data, function(item){
        return process_item(item)
            .catch(function(err){
                console.log("ERROR:: "+ err);
                //return job.update(item,{Status:'error'});

            });
        },{concurrency:3})
        .then(function(){
            console.log('Finished');
            mongoose.connection.close();
            return true;
     })
        .catch(function(err){
            console.log('MAP ERR' + err);
            mongoose.connection.close();
            return false;
        })
});

// Process an item according to its current status.
// Return a promise so that process_item can be chained to:
// A) complete every step in the process.
// B) Pick up processing at any step in the process (i.e. after previous failure)
function process_item(item){
    return job.status(item).then(function(status){
        if(status !== 'complete' && status !='error')
            console.log(item.Key +" -- Process Status = " + status);

        if(!list.is_photo(item)){
            return job.update(item,{Status:'error'}).then(function(){
                throw new Error(item.Key +" is not a photo.")
            });
        }

        var promise;
        if(status == 'missing'){
            promise = job.create(item);
        }
        if(status == 'new'){
            // Download image
            promise = list.download(item)
                .then(function(filename){
                    return job.update(item,{Status:'downloaded',Filename:filename});
                });
        }
        if(status == 'downloaded'){
            // save exif
            promise = reader.read(list.get_filename(item))
                .then(function(exif_data){
                    return job.update(item,{Status:'parsed',Exif:exif_data});
                });
        }
        if(status == 'parsed'){
            // remove local file
            promise =  list.delete_local(item).then(function(){
                return job.update(item,{Status:'complete'});
            });
        }

        if(status == 'complete'){
            return true;
        }
        if(status == 'error'){
            return false;
        }
        return promise.then(function(){
            return process_item(item);
        });

    });
};
