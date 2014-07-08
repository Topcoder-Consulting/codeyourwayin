var Q = require("q");
var User = require('../models/User');
var Problem = require('../models/Problem');
var DiscountCode = require('../models/DiscountCode');
var verification = require("../lib/verification.js");

exports.test = function(req, res) {

  verification.test();

  res.render('home', {
    title: 'Home'
  });
};

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
          componentId: problem[0].componentId
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

    verification.checkCode(req.cookies.tcsso, req.body.roomId, req.body.componentId)
      .then(function(result) {
        getDiscountCode()
          .then(function(code) {
            updateUser(req.user, code)
              .then(function(code) {
                res.render('arena/success', {
                  title: 'Success',
                  goldenTicket: code
                })
              })
          })
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
  var deferred = Q.defer();  
  User.findByIdAndUpdate(user._id, { $set: { goldenTicket: code }}, function(err, doc){
    deferred.resolve(code);
  });  
  return deferred.promise;  
}

// finds an available discount code and reserves it
var getDiscountCode = function() {
  var deferred = Q.defer(); 
  DiscountCode.findOneAndUpdate({available: 1}, { $set: {available: 0 }}, function(err, record) {
    if (err) deferred.resolve('NO_CODES_AVAILABLE'); 
    if (!err) deferred.resolve(record.code); 
  }); 
  return deferred.promise;  
}
