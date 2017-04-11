'use strict';

module.exports = function photo_job (mongoose){
    var Job = mongoose.model('Job',{Key:{type:String,index:{unique:true}},Status:String,Filename:String,Exif:Object});
    return {
        // Create record in Jobs collection for item if it does not exist.
        // initial Status is 'new'
        // Return doc that matches the item key.
        create: function (item) {
            var job = new Job({Key:item.Key,Status:'new'});
            return this.exists(item)
                .then(function(exists){
                    if(!exists){
                        return job.save();
                    }
                    else{
                        return Job.findOne({Key:item.Key});
                    }
                });
        },
        exists:function(item){
            return Job.count({Key:item.Key}).then(function(count){
                return count > 0;
            });
        },
        // Get the Status of the item.  if it is not in DB then return 'missing' status
        status:function(item){
            var self = this;
            return self.exists(item).then(function(exists){
                if(!exists){
                    return 'missing'
                }
                else{
                    return Job.findOne({Key:item.Key}).then(function(doc){
                        return doc.Status;
                    });
                }
            })
        },
        update:function(item,fields){
            return Job.update({Key:item.Key},fields);
        },
        get:function(item){
            return Job.findOne({Key:item.Key});
        },
        delete:function(item){
            return Job.deleteOne({Key:item.Key});
        }
    }
};