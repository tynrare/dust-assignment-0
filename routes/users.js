var express = require('express');
var hash = require('pbkdf2-password')()
var router = express.Router();
var { authenticate, users } = require('../public/javascripts/lib-0')

// dummy database

  
  // when you create a user, generate a salt
  // and hash the password ('foobar' is the pass here)
  
  hash({ password: 'dusta' }, function (err, pass, salt, hash) {
    if (err) throw err;
    // store the salt & hash in the "db"
    users.dusta.salt = salt;
    users.dusta.hash = hash;
  });
  
  router.post('/', function(req, res, next) {
    //do something and return data here?
  });
  
  router.get('/logout', function(req, res){
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
      res.redirect('/');
    });
  });
  
  router.get('/login', function(req, res){
    res.render('login');
  });
  
  router.post('/login', function(req, res){
    authenticate(req.body.username, req.body.password, function(err, user){
        switch (req.body.operation) {
            case 'Register':
                register();
                break;
            case 'Login':
                login();
                break;
        }

      function register(){
          if (user) {
              // Regenerate session when signing in
              // to prevent fixation
              req.session.regenerate(function(){
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.error = 
                  `User ${user.name} aready exists. 
                  `
                res.redirect('back');
              });
            } else {
              hash({ password: req.body.password }, function (err, pass, salt, hash) {
                  if (err) throw err;
                  // store the salt & hash in the "db"
                  users[req.body.username] = { name: req.body.username };
                  users[req.body.username].salt = salt;
                  users[req.body.username].hash = hash;
                });

                req.session.user = req.body.username;
                req.session.success = `Registered ${req.body.username}. You now able to enter with your login/password`
                res.redirect('back');
            }
      }

      function login(){
        if (user) {
          // Regenerate session when signing in
          // to prevent fixation
          req.session.regenerate(function(){
            // Store the user's primary key
            // in the session store to be retrieved,
            // or in this case the entire user object
            req.session.user = user;
            req.session.success = 
              `Authenticated as User ${user.name}.
              You may now access <a href="/game">/game</a>.
              click at <a href="/logout">logout</a> to logout. 
              `
            res.redirect('back');
          });
        } else {
          req.session.error = 'Authentication failed, please check your '
            + ' username and password.'
            + ' (use "dusta" and "dusta" as defaults)';
          res.redirect('/login');
        }
      }

    });
  });

module.exports = router;
