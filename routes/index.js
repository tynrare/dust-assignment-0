var express = require('express');
var router = express.Router();
var { restrict } = require('../public/javascripts/lib-0')
var expressBrowserify = require('express-browserify');

router.get('/', restrict, function(req, res){
  res.render('index');
});

router.get('/assets/:path', restrict, function (req, res) {
  res.send("/public/assets/" + req.params.path)
})

router.get('/game.js', /*restrict, */
  expressBrowserify('./public/javascripts/game-0/index.js', {
    plugin: [
      [ require('esmify'), { /* ... options ... */ } ]
    ]
  }) );
router.get('/game', /*restrict,*/ function(req, res){
  res.render('game');
});


module.exports = router;
