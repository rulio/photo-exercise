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

    // Set concurrency to desired rate in promise map
    return Promise.map(data, function(item){
        return process_item(item)
            .catch(function(err){
                console.log("ERROR:: "+ err);
            });
        }, {concurrency:3})
        .then(function(){
            // When all promises return Close DB connection and return
            mongoose.connection.close();
            console.log('Finished');
            return true;
     })
        .catch(function(err){
            console.log('MAP ERR' + err);
            mongoose.connection.close();
            return false;
        })
});

// Process an item according to its current status.
// Return a promise so that process_item can be chained.  This way we can:
// A) Complete every step in the process in order for each photo.
// B) Recover gracefully  at any step in the process (i.e. after previous failure)
function process_item(item){
    return job.status(item).then(function(status){

        // Ignore photos that are complete or have been marked as errors
        if(status !== 'complete' && status !='error')
            console.log(item.Key +" -- Process Status = " + status);

        // Mark as error any objects in S3 that are not photos
        if(!list.is_photo(item)){
            return job.update(item,{Status:'error'}).then(function(){
                throw new Error(item.Key +" is not a photo.")
            });
        }

        // Apply appropriate processing given the current status of the item/photo
        var promise;

        // If missing create photo job in Mongo with status = new
        if(status == 'missing'){
            promise = job.create(item);
        }

        // If status is 'new' then download the photo for processing and set status to 'downloaded'
        if(status == 'new'){
            // Download image
            promise = list.download(item)
                .then(function(filename){
                    return job.update(item,{Status:'downloaded',Filename:filename});
                });
        }

        // If status is 'downloaded'  then read parse the EXIF data and set status to 'parsed'
        if(status == 'downloaded'){
            // save exif
            promise = reader.read(list.get_filename(item))
                .then(function(exif_data){
                    return job.update(item,{Status:'parsed',Exif:exif_data});
                });
        }

        // If status is 'parsed'  then delete the photo from local filesystem and update status to 'complete'
        if(status == 'parsed'){
            // remove local file
            promise =  list.delete_local(item).then(function(){
                return job.update(item,{Status:'complete'});
            });
        }

        // if status is 'complete' or 'error' then we can fulfill the Promise
        if(status == 'complete'){
            return true;
        }
        if(status == 'error'){
            return false;
        }

        // if promise not fullfilled, then call process_item again to proceed to next processing step.
        return promise.then(function(){
            return process_item(item);
        });

    });
};
