const express = require('express'),
    aws = require('aws-sdk'),
    fs = require('fs');

module.exports = {
    uploadToAws: async function(file){
        try {
            //configuring the AWS environment
            aws.config.update({
                accessKeyId: "",
                secretAccessKey: ""
            });
            var s3 = new aws.S3();
            const fileContent = fs.readFileSync(file.path);
    
            //setting file params
            const params = {
                Bucket: 'exam-picture-storage',
                Key: file.filename,
                Body: fileContent,
                ContentType: file.mimetype
            }
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log('AWS Error: ' + err)                
                }
                else{
                    console.log(`File uploaded successfully. ${data.Location}`);
                }
            });
        } catch (err){
            console.log('AWS Error: ' + err)   
        }
            
    }
}