var io = require('socket.io-client');
var Q = require("q");

exports.checkCode = function(sso, roomID, componentID) {

  var deferred = Q.defer();
  var allSystemTestsPass = true;
  var awaitingTestResults = false;
  console.log('Starting code check.....'); 

  var socket = io.connect('https://arenaws.topcoder.com');

  // if we don't get a response back for 15 seconds, fail the check
  setTimeout(function(){
    if (!awaitingTestResults) {
      console.log('Code check timedout because the server did not return a response.');
      deferred.reject('Sorry! The server appears to be busy and did not return a response. Please submit your code again.');
    }
  }, 15000);     

  socket.on('connect', function() {
    console.log('Client has connected to the server! Now logging in....');
    socket.emit('SSOLoginRequest', {sso: sso});
  });

  // after logging in
  socket.on('UserInfoResponse', function(data) {
    console.log('Logged in as: ' + data.userInfo.handle);
    console.log('Moving to practice room: ' + roomID);
    socket.emit('MoveRequest', { moveType: 4, roomID: roomID });
    socket.emit('EnterRequest', { roomID: -1 });    
  });

  // after moving into a practice room - open the component
  socket.on('RoomInfoResponse', function(data) {
    console.log('Successfully entered practice room: ' + data.name + ' (' + data.roomID + ')');
    console.log('Opening component '+componentID+'...');
    socket.emit('OpenComponentForCodingRequest', { componentID: componentID }); 
  });

  // get their current code (roomid, componentid, language, code) & run tests
  socket.on('OpenComponentResponse', function(data) {
    console.log('Running all system tests...');
    socket.emit('PracticeSystemTestRequest', { roomID: roomID, componentIds: [componentID] });
  });

  // individual system test results
  socket.on('PracticeSystemTestResultResponse', function(data) {
    // wait 3 seconds so all tests return and check for success
    if (!awaitingTestResults) {
      console.log('Started getting results back. Checking for success in 3 seconds....')
      awaitingTestResults = true;
      setTimeout(function(){
        console.log('Checking for success now!!')
        if (allSystemTestsPass === true) {
          deferred.resolve('passed');
        } else {
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