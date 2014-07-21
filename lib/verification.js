/**
/ this code no longer being used
**/

var io = require('socket.io-client');
var Q = require("q");

exports.checkCode = function(sso, roomID, componentID, user) {

  var deferred = Q.defer();
  var allSystemTestsPass = true;
  var awaitingTestResults = false;
  var hasLoggedIn = false;
  var hasEnteredRoom = false;
  var hasOpenedComponent = false;
  var hasStartedSystemTests = false;
  console.log(user.profile.name + '|' + 'Starting code check.....'); 

  var socket = io.connect('https://arenaws.topcoder.com');

  // if we don't get a response back for 15 seconds, fail the check
  setTimeout(function(){
    if (!awaitingTestResults) {
      console.log(user.profile.name + '|' + 'Code check timedout because the server did not return a response within 20 seconds.');
      deferred.reject('Sorry! The server appears to be busy and did not return a response. Please submit your code again.');
    }
  }, 25000);     

  // if we are already connected to the socket, then just run the tests.
  if (socket.socket.connected) {
    console.log(user.profile.name + '|' + 'Already connected to the server! Now logging in....');
    socket.emit('SSOLoginRequest', {sso: sso});
  }  

  // listen for connection to the server
  socket.on('connect', function() {
    console.log(user.profile.name + '|' + 'Client has connected to the server! Now logging in....');
    socket.emit('SSOLoginRequest', {sso: sso});
  });

  // after logging in
  socket.on('UserInfoResponse', function(data) {
    if (!hasLoggedIn) {
      console.log(user.profile.name + '|' + 'Logged in as: ' + data.userInfo.handle);      
      console.log(user.profile.name + '|' + 'Moving to practice room: ' + roomID);
      socket.emit('MoveRequest', { moveType: 4, roomID: roomID });
      socket.emit('EnterRequest', { roomID: -1 }); 
      hasLoggedIn = true;   
    }
  });

  // after moving into a practice room - open the component
  socket.on('RoomInfoResponse', function(data) {
    if (!hasEnteredRoom) {
      console.log(user.profile.name + '|' + 'Successfully entered practice room: ' + data.name + ' (' + data.roomID + ')');
      console.log(user.profile.name + '|' + 'Opening component '+componentID+'...');
      socket.emit('OpenComponentForCodingRequest', { componentID: componentID }); 
      hasEnteredRoom = true;   
    }
  });

  // get their current code (roomid, componentid, language, code) & run tests
  socket.on('OpenComponentResponse', function(data) {
    if (!hasStartedSystemTests) {
      console.log(user.profile.name + '|' + 'Running all system tests...');
      socket.emit('PracticeSystemTestRequest', { roomID: roomID, componentIds: [componentID] });
      hasStartedSystemTests = true;
    }
  });

  // individual system test results
  socket.on('PracticeSystemTestResultResponse', function(data) {
    // wait 3 seconds so all tests return and check for success
    if (!awaitingTestResults) {
      console.log(user.profile.name + '|' + 'Started getting results back. Checking for success in 3 seconds....')
      awaitingTestResults = true;
      setTimeout(function(){
        console.log(user.profile.name + '|' + 'Checking for success now!!');
        if (allSystemTestsPass === true) {
          console.log(user.profile.name + '|' + 'All tests passed!');
          deferred.resolve('passed');
        } else {
          console.log(user.profile.name + '|' + 'At least one test failed!');
          deferred.reject('Your code did not pass all system tests.');
        }
      }, 3000);  
    }
    console.log('Test result: ' + data.resultData.succeeded);
    if (data.resultData.succeeded === false) allSystemTestsPass = false;
  });

  socket.on('PopUpGenericResponse', function (data) {
    console.log(data);  
  });

  socket.on('connect_error',function(err) {
      deferred.reject(err);
  });

  socket.on('error', function(err) {
      deferred.reject(err);
  }); 

  return deferred.promise; 
}