var Q = require("q");
var User = require('../models/User');
var Problem = require('../models/Problem');
var DiscountCode = require('../models/DiscountCode');
var verification = require("../lib/verification.js");
var moment = require("moment");

/**
 * GET /
 * Arena!!
 */

exports.index = function(req, res) {
  if (typeof req.user.goldenTicket === 'undefined') {

    getProblem(req.user)
      .then(function(problem) {
        res.render('arena/index', {
          title: 'Arena',
          loadArena: true,
          roundId: problem.roundId,
          roomId: problem.roomId,
          componentId: problem.componentId
        });      
      })
      .fail(function(err) {
        console.log(err)
      });        

  } else {
    req.flash('info', { msg: "You've already coded your way into TCO14. Your code is below." });
    res.redirect('/arena/results');
  }
};

exports.submit = function(req, res) {

  console.log(req.user.profile.name + ' submitted code.');
  if (typeof req.user.goldenTicket === 'undefined') {

    verification.checkCode(req.cookies.tcsso, req.body.roomId, req.body.componentId)
      .then(function(result) {
        getDiscountCode()
          .then(function(code) {
            updateUser(req.user, code)
              .then(function(code) {
                res.redirect('/arena/results');
              })
          })
      })
      .fail(function(err) {
        console.log('Error running all system tests: '+err);
        req.flash('errors', { msg: err.toString() });
        res.redirect('/arena');
      });

  } else {
    req.flash('info', { msg: "You've already coded your way into TCO14. Your code is below." });
    res.redirect('/arena/results');
  }        

};

exports.results = function(req, res) {

  res.render('arena/results', {
    title: 'Results'
  });
};

exports.test = function(req, res) {

  verification.checkCode(req.cookies.tcsso, req.query.roomId, req.query.componentId);

  res.render('home', {
    title: 'Home'
  });
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

var getProblem = function(user) {

  var deferred = Q.defer(); 
  var fetchNewProblem = true;

  // add a day to the last time they got a new problem
  var expiresAt = moment(user.lastNewProblemDate).add(process.env.DATE_EXPIRE_UNIT, parseInt(process.env.DATE_EXPIRE_AMOUNT));
  // if the time has not expired, return their last problem
  if (moment().diff(expiresAt, 'minutes') < 0) fetchNewProblem = false;
  // if this is their first time getting a problem
  if (typeof user.lastNewProblemDate === 'undefined') fetchNewProblem = true;

  if (fetchNewProblem) {
    console.log('Fetching new problem....');
    // choose a random problem and return it
    Problem.count({ event: 'tco14' }, function(err, ct) {
      var r = Math.floor(Math.random() * ct);
      Problem.find({ event: 'tco14' }).limit(1).skip(r).exec(function(err, problem) {
        // update their user with the new problem
        User.findById(user.id, function (err, user){
          user.lastNewProblemDate =Date();
          user.problems.push(problem[0]);
          user.save();
        });      
        // return this problem
        deferred.resolve(problem[0]); 
      });
    });    

  } else {
    // return their last problem
    deferred.resolve(user.problems[user.problems.length-1]);     
  }

  return deferred.promise;  
}
