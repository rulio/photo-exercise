var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var fs = require('fs');
var photo_list = require("../photo-list");

chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

describe('PhotoList', function() {

    it('Should retrieve xml list Items in the S3 bucket', function (done) {
       photo_list.get().then(function(contents){
            contents.forEach(function(item){
                expect(item).to.have.property('Key');
                expect(item).to.have.property('ETag');
                expect(item).to.have.property('LastModified');
                expect(item).to.have.property('Size');
                expect(item).to.have.property('StorageClass');

                expect(item.Key).to.be.a('string');
                expect(item.ETag).to.be.a('string');
                expect(item.LastModified).to.be.a('string');
                expect(item.Size).to.be.a('number');
                expect(item.StorageClass).to.be.a('string');


            });
            done();
        })
    });
    it('should get exif data for an item',function(done){
        var item = { Key: '01a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
            LastModified: '2016-08-12T13:24:21.000Z' ,
            ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
            Size:  2168091 ,
            StorageClass:  'STANDARD' };

        photo_list.download(item).then(function(filename){
            expect(fs.existsSync("downloads/"+filename)).to.be.true;
            fs.unlink(filename,function(){
                done();
            })

        });

    });

});
