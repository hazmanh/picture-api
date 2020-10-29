const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  Pictures = require('./api/models/pictureModel')
  bodyParser = require('body-parser');

mongoose.Promise = global.Promise;

var uri = 'mongodb+srv://exam-user:admin123@cluster0.j5j5f.mongodb.net/Pics?retryWrites=true&w=majority'
mongoose.connect(uri)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/pictureRoutes'); //importing route
const { handleError} = require('./middleware/errors');
routes(app); //register the route

app.listen(port);

console.log('Picture API server started on: ' + port);

app.use((err, req, res, next) => {
  handleError(err, res);
});

//Handling invalid urls
app.use(function(req, res) {
  res.status(404).send({error: req.originalUrl + ' not found'})
});

