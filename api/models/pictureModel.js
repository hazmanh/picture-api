'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var PicturesSchema = new Schema({
  original_name: {
    type: String,
  },
  mimetype: {
    type: String,
  },
  filename: {
    type: String,
  },
  permalink: {
    type: String,
  },
});

module.exports = mongoose.model('Pictures', PicturesSchema);