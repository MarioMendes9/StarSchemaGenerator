var express = require('express');
var router = express.Router();
var ssgOPT= require("../Controllers/ssgController");

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("aqui");
  res.sendFile('uploadFile.html', {root: "views" });
});


router.post('/',ssgOPT.generateSchema);


module.exports = router;
