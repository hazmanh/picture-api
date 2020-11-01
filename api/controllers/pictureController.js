"use strict";

const fs = require("fs");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const Picture = mongoose.model("Pictures");
const uuid = require("uuid");
const mime = require("mime-types");
const extract = require("extract-zip");

const extractDir = path.resolve(__dirname, "../tmp");
const upload = multer({ dest: extractDir });
const { ErrorHandler } = require("../../middleware/errors");
const { uploadToAws } = require("./uploadToAws");
const { fail } = require("assert");
const base_aws_bucket_url = "https://exam-picture-storage.s3.amazonaws.com/";

function checkPicType(file) {
  const allowed_pic_types = /image\/jpg|image\/jpeg|image\/png|image\/bmp/;
  return allowed_pic_types.test(file.mimetype);
}

async function savePicture(picture_data, url) {
  const new_pic = new Picture({
    original_name: picture_data.originalname,
    mimetype: picture_data.mimetype,
    filename: picture_data.filename,
    permalink: url,
  });
  await new_pic.save(function (err) {
    if (err)
      throw new ErrorHandler(500, "Interal server error when submitting to DB");
  });
  return new_pic;
}

//uploads the picture to the bucket
async function uploadPicture(uploaded_file) {
  try {
    const is_image = checkPicType(uploaded_file);
    if (is_image) {
      await uploadToAws(uploaded_file);
      const picture_permalink = base_aws_bucket_url + uploaded_file.filename;
      const picture_details = await savePicture(
        uploaded_file,
        picture_permalink
      );
      const filepath = uploaded_file.path;
      fs.unlinkSync(filepath);
      return picture_details;
    } else {
      return null;
    }
  } catch (err) {
    throw new ErrorHandler(500, "Interal error with AWS inside upload");
  }
}

function checkZippedFile(file) {
  const allowed_filetypes = /application\/zip/;
  return allowed_filetypes.test(file.mimetype);
}

async function processZippedFiles(extracted_file_path) {
  return new Promise(function (resolve, reject) {
    fs.readdir(extracted_file_path, async (err, files) => {
      if (err) {
        throw new ErrorHandler(500, "Unable to extract the files");
      }
      //listing all files using forEach
      let added_pictures = [];
      let failed_pics = [];
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let file_path = path.join(extracted_file_path, file);
        let pic = {
          original_name: file,
          mimetype: mime.lookup(file),
          path: path.join(file_path),
          filename: uuid.v4(),
        };
        let pic_details = await uploadPicture(pic);
        if (pic_details === null) {
          failed_pics.push(pic);
        } else {
          added_pictures.push(pic_details);
        }
      }
      resolve({
        message: "Stowed the zipped files",
        successful: added_pictures,
        failed: failed_pics,
      });
    });
  });
}

//returns the list of permalinks and picture details
const listAllPictures = function (req, res) {
  Picture.find({}, function (err, picture) {
    if (err) res.send(err);
    res.json(picture);
  });
};

//main function to receive the picture
const receiveFile = [
  upload.single("file"),
  async function (req, res, next) {
    try {
      const uploaded_file = req.file;
      if (uploaded_file === undefined) {
        throw new ErrorHandler(400, "Picture is undefined");
      }
      const is_image = checkPicType(uploaded_file);
      const is_zipped = checkZippedFile(uploaded_file);

      if (is_image) {
        const picture_details = await uploadPicture(uploaded_file);
        if (picture_details === null) {
          throw new ErrorHandler(400, "File is not a picture");
        } else {
          res.json({
            message: "Successfully added picture",
            picture_details: picture_details,
          });
        }
      } else if (is_zipped === true) {
        const file_location = req.file.path;
        const extracted_file_path = path.join(
          `${extractDir}`,
          `${new Date().getTime()}`
        );

        await extract(file_location, { dir: extracted_file_path }, (err) => {
          if (err) throw new ErrorHandler(500, "Unable to extract files");;
        });
        let process_response = await processZippedFiles(extracted_file_path);

        //deleting the original zip and unzipped contents
        fs.unlinkSync(file_location);
        fs.rmdir(extracted_file_path, { recursive: true }, (err) => {
          if (err) {
            throw new ErrorHandler(400, "Unable to remove the files");
          }
        });

        res.json({ process_response });
      } else {
        throw new ErrorHandler(
          400,
          "Invalid format, please submit either a jpeg, jpg, png or a combination of them zipped"
        );
      }
    } catch (err) {
      next(err);
    }
  },
];

module.exports = {
  receiveFile,
  listAllPictures,
};
