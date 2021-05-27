var hash = require('pbkdf2-password')()

// Authenticate using our plain-object database of doom!
    
var users = {
    dusta: { name: 'dusta' }
};


function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    var user = users[name];
    // query the db for the given username
    if (!user) return fn(new Error('cannot find user'));
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
      if (err) return fn(err);
      if (hash === user.hash) return fn(null, user)
      fn(new Error('invalid password'));
    });
}
  
function restrict(req, res, next) {
    if (req.session?.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}


  module.exports = { authenticate, restrict, users };