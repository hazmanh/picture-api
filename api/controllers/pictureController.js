'use strict';

const e = require('express');
const fs = require('fs')
const multer = require('multer')
const aws = require('./uploadToAws')
const path = require('path');
const mongoose = require('mongoose'),
  Picture = mongoose.model('Pictures');

const extractDir = path.resolve(__dirname, '../tmp');
const upload = multer({ dest: extractDir});
const { ErrorHandler } = require('../../middleware/errors');
const uploadToAws = require('./uploadToAws');


function checkPicType(file){
  const allowed_pic_types = /image\/jpg|image\/jpg|image\/png|image\/bmp/;
  const mimetype = allowed_pic_types.test(file.mimetype);

  if(mimetype) {
    return true;
  } else {
      return false;
  }
}

function save_a_picture(picture_data, url) {
  let new_pic = new Picture({
    original_name: picture_data.originalname,
    mimetype: picture_data.mimetype,
    filename: picture_data.filename,
    permalink: url
  });
  return new_pic
};

function upload_a_picture(uploaded_file){
  let is_image = checkPicType(uploaded_file)
  if (is_image === false) {
    res.json({ message: 'Not an image, please submit either a jpeg, jpg, or png',
               file_properties: uploaded_file});
    let filepath = uploaded_file.path
    fs.unlinkSync(filepath)
  }
  else {
    uploadToAws.uploadToAws(uploaded_file)
    let picture_permalink = 'https://exam-picture-storage.s3.amazonaws.com/' + uploaded_file.filename
    let picture_details = save_a_picture(uploaded_file, picture_permalink)
    return picture_details;
  }
}

//returns a list of uploaded pictures
exports.list_all_pictures = function(req, res){
  Picture.find({}, function(err, picture){
      if (err)
          res.send(err);
      res.json(picture);
  });
};

//main function to process the uploaded pictures
exports.upload_a_file = [upload.single('file'), async function(req, res, next) {
  try{
    const uploaded_file = req.file
    console.log(uploaded_file)
    if (uploaded_file === undefined){
      throw new ErrorHandler(500, 'Picture is undefined')
    }
    let is_image = checkPicType(uploaded_file)
    
    if (is_image === true){
      let picture_details = upload_a_picture(uploaded_file)
      console.log(picture_details)
      res.json({message: 'Successfully added picture',
                picture_details: picture_details})
    }

    else {
      throw new ErrorHandler(500, 'Invalid format, please submit either a jpeg, jpg, png or a combination of them zipped')
    }
  }
  catch(err){
    next(err)
  } 
}]
