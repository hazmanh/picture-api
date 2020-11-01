const { handleError, ErrorHandler } = require("./middleware/errors");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const mongoose = require("mongoose");
const Pictures = require("./api/models/pictureModel");
const pictures = require("./api/controllers/pictureController");

mongoose.Promise = global.Promise;
const uri =
  "mongodb+srv://exam-user:admin123@cluster0.j5j5f.mongodb.net/permalink_pics?retryWrites=true&w=majority";
mongoose.connect(uri);

app.post("/pictures", pictures.receiveFile);
app.get("/pictures", pictures.listAllPictures);

//Handling invalid urls
app.use(function (req, res, next) {
  next(new ErrorHandler(404, "URL not found"))
});

app.use(handleError);

app.listen(port);
console.log("Picture API server started on: " + port);
