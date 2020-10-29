'use strict';
module.exports = function(app) {
  var pictures = require('../controllers/pictureController');

    app.route('/pictures')
        .get(pictures.list_all_pictures)
        .post(pictures.upload_a_file);
};