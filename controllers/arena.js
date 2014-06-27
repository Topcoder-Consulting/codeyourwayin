var Q = require("q");
var User = require('../models/User');

/**
 * GET /
 * Arena!!
 */

exports.index = function(req, res) {
  if (typeof req.user.goldenTicket === 'undefined') {
    res.render('arena/index', {
      title: 'Arena',
      loadArena: true,
      roomId: 321513,
      componentId: 39763,
      seed: req.user._id
    });
  } else {
    req.flash('info', { msg: "You've already coded your way into TCO14. Your code is below." });
    res.redirect('/account');
  }
};

exports.success = function(req, res) {

  if (typeof req.user.goldenTicket === 'undefined') {

    nextRegistrationCode()
      .then(function(code) {
        updateUser(req.user, code)
          .then(function(code) {
            res.render('arena/success', {
              title: 'Success',
              goldenTicket: code
            });
          }) ;
      })
      .fail(function(err) {
        // TODO -- add 500 page
        console.log(err)
      });

  } else {
    req.flash('info', { msg: "You've already coded your way into TCO14. Your code is below." });
    res.redirect('/account');
  }        

};

var updateUser = function(user, code) {
  console.log(code);
  var deferred = Q.defer();  
  User.findByIdAndUpdate(user._id, { $set: { goldenTicket: code }}, function(err, doc){
    deferred.resolve(code);
  });  
  return deferred.promise;  
}

var nextRegistrationCode = function() {
  var deferred = Q.defer(); 
  User.find({}).sort({goldenTicket: 'descending'}).limit(1).exec(function(err, items) {
    if (!items[0].goldenTicket) {
      deferred.resolve(1000); 
    } else {
      deferred.resolve(items[0].goldenTicket + 1);
    }
  }); 
  return deferred.promise;  
}
