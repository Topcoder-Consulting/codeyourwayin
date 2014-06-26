var User = require('../models/User');
var Q = require("q");
var _ = require('lodash');
var request = require('request');

exports.findUser = function(tcjwt) {
  var deferred = Q.defer();
  fetchProfile(tcjwt)
    .then(function(user) {
      User.findOne({ email: user.email }, function(err, existingUser) {
        if (existingUser) user.exists = true;
        deferred.resolve(user);
      });        
    })
    .fail(function(err) {
      deferred.reject(err)
    });
  return deferred.promise; 
}


var fetchProfile = function(tcjwt) {
  var deferred = Q.defer();
  var options = {
      url: 'http://api.topcoder.com/v2/user/profile',
      headers: {
          'Authorization': 'Bearer ' + tcjwt
      }
  };          
  request(options, function callback(error, response, body) {
    var payload = JSON.parse(body);
    if (payload.error) deferred.reject(payload.error);
    if (!payload.error) {
      var payload = JSON.parse(body);
      // check for members without photos
      var picture = 'http://www.topcoder.com/' + payload.photoLink;
      if (picture === 'http://www.topcoder.com/') {
        picture = 'http://3a72mb4dqcfnkgfimp04jgyyd.wpengine.netdna-cdn.com/wp-content/themes/tcs-responsive/i/default-photo.png';
      }
      deferred.resolve({
        email: payload.emails[0].email, 
        handle: payload.handle, 
        picture: picture,
        password: '1nopass12345678',
        exists: false}
      );
    }
  } );      
  return deferred.promise;  
}