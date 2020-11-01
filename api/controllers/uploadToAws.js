const express = require("express"),
  aws = require("aws-sdk"),
  fs = require("fs");
const { ErrorHandler } = require("../../middleware/errors");

//configuring the AWS environmen
const s3 = new aws.S3({
  accessKeyId: "AKIAJPA5FULY7UVLWZ3A",
  secretAccessKey: "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",
});

module.exports = {
  uploadToAws: async function (file) {
    try {
      const fileContent = fs.readFileSync(file.path);

      //setting file params
      const params = {
        Bucket: "exam-picture-storage",
        Key: file.filename,
        Body: fileContent,
        ContentType: file.mimetype,
      };
      s3.upload(params, (err, data) => {
        if (err) {
          console.log("inside if");
          throw new ErrorHandler(500, "Interal error with AWS inside upload");
        }
        if (data) {
          return data.Location;
        }
      });
    } catch (err) {
      throw new ErrorHandler(500, "Interal error with AWS inside upload");
    }
  },
};
