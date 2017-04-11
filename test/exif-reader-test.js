var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var reader = require("../exif-reader");
var photo_list = require('../photo-list')
chai.use(chaiAsPromised);
var expect = chai.expect;
chai.should();

describe('ExifReader', function() {

    it('Should read exif data for an image', function (done) {
        var item = { Key: '01a8f6cd-3239-43ce-b756-95abf64a1b12.bf54b6d2-542e-4c48-8a8a-53b47e6b91d5.jpg' ,
            LastModified: '2016-08-12T13:24:21.000Z' ,
            ETag:  '"9c83384a1be4de19b0b15b57e4913e75"' ,
            Size:  2168091 ,
            StorageClass:  'STANDARD' };

        photo_list.download(item)
            .then(function(filename){
                return reader.read(photo_list.get_filename(item));
            })
            .then(function(exif_data){
                expect(exif_data).to.have.property('image');
                expect(exif_data).to.have.property('thumbnail');
                expect(exif_data).to.have.property('exif');
                expect(exif_data).to.have.property('gps');
                expect(exif_data).to.have.property('interoperability');
                expect(exif_data).to.have.property('makernote');
                done();
            })
            .catch(function(err){
                throw err;
                done();
            });
    });

});
