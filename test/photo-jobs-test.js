var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/photos');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var fs = require('fs');
var photo_job = require("../photo-jobs")(mongoose);

chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

describe('PhotoJob', function() {

   it('Should create a new job and save in Mongo', function (done) {
        var item = { Key: '01a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
            LastModified: '2016-08-12T13:24:21.000Z' ,
            ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
            Size:  2168091 ,
            StorageClass:  'STANDARD' };
        photo_job.create(item)
            .then(function(doc){
                expect(doc.Key).to.equal(item.Key);
                expect(doc.Status).to.equal('new');
                return photo_job.delete(item);
            })
            .then(function(){
                done();
            })
            .catch(function(err){
                photo_job.delete(item)
                    .then(function(){
                        throw err;
                    });

            });

    });
    it('Should Find the job status of newly created item is "new"', function (done) {
        var existing_item = { Key: '01a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
            LastModified: '2016-08-12T13:24:21.000Z' ,
            ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
            Size:  2168091 ,
            StorageClass:  'STANDARD' };

        photo_job.create(existing_item)
            .then(function(doc){
                return photo_job.status(existing_item);
            })
            .then(function(status){
                expect(status).to.equal('new');
                return photo_job.delete(existing_item);
            })
            .then(function(){
                done();
            })
            .catch(function(err){
                photo_job.delete(item)
                .then(function(){
                    throw err;
                });
            })
    });

    it('Should return the job status of item not in db as "missing"', function (done) {
        var non_existing_item = { Key: '0xxxxx1a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
        LastModified: '2016-08-12T13:24:21.000Z' ,
        ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
        Size:  2168091 ,
        StorageClass:  'STANDARD' };

        photo_job.status(non_existing_item)
            .then(function(status){
                expect(status).to.equal('missing');
                done()
            });
    });


    it('Should Find the job status of newly created item is "new"', function (done) {
        var item = { Key: '01a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
            LastModified: '2016-08-12T13:24:21.000Z' ,
            ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
            Size:  2168091 ,
            StorageClass:  'STANDARD' };

        photo_job.create(item)
            .then(function(doc){
                return photo_job.status(item);
            })
            .then(function(status){
                expect(status).to.equal('new');
                return photo_job.update(item,{Status:'downloaded',Filename:'a0file.jpg'})
            })
            .then(function(results){
                return photo_job.get(item).then(function(doc){
                    expect(doc.Status).to.equal('downloaded');
                    expect(doc.Filename).to.equal('a0file.jpg');
                    return photo_job.delete(item);
                })
            })
            .then(function(){
                done();
            })
            .catch(function(err){
                photo_job.delete(item)
                    .then(function(){
                        throw err;
                    });
            })
    });

});
