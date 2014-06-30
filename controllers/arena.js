var Q = require("q");
var User = require('../models/User');
var Problem = require('../models/Problem');

/**
 * GET /
 * Arena!!
 */

exports.index = function(req, res) {
  if (typeof req.user.goldenTicket === 'undefined') {

    // choose a random problem and return it
    Problem.count(function(err, ct) {
      var r = Math.floor(Math.random() * ct);
      Problem.find({ event: 'tco14' }).limit(1).skip(r).exec(function(err, problem) {

        res.render('arena/index', {
          title: 'Arena',
          loadArena: true,
          roundId: problem[0].roundId,
          roomId: problem[0].roomId,
          componentId: problem[0].componentId,
          seed: req.user._id
        });

      });
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

// find the highest number registration code and returns one greater. If not found, returns 1000.
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
