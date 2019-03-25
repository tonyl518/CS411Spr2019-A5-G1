var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CS411Lab5Group1' });
});

/* POST ingredients list for search */
router.post('/', (req, res) => {
  res.send("Got your request!");
});

module.exports = router;
