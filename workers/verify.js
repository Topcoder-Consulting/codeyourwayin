var Q = require("q");
var io = require('socket.io-client');
var User = require('../models/User');
var DiscountCode = require('../models/DiscountCode');

process.on('message',function(data){

  var user = data.user
  var sso = data.sso;
  var roomID = data.roomID;
  var componentID = data.componentID;

  console.log(user)

  var awaitingTestResults = false;
  var allSystemTestsPass = true;

  var socket = io.connect('https://arenaws.topcoder.com');

  console.log(user.profile.name + '|' + 'Forking process and running all system tests.'); 

  if (socket.socket.connected) {
    console.log(user.profile.name + '|' + 'Already connected to the server! Now logging in....');
  }    

  // listen for connection to the server
  socket.on('connect', function() {
    console.log(user.profile.name + '|' + 'Client has connected to the server! Now logging in....');
    socket.emit('SSOLoginRequest', {sso: sso});
    // tell the main process we are running tests
    process.send('Processing');
  });

  // after logging in
  socket.on('UserInfoResponse', function(data) {
    console.log(user.profile.name + '|' + 'Logged in as: ' + data.userInfo.handle);      
    console.log(user.profile.name + '|' + 'Moving to practice room: ' + roomID);
    socket.emit('MoveRequest', { moveType: 4, roomID: roomID });
    socket.emit('EnterRequest', { roomID: -1 }); 
  });

  // after moving into a practice room - open the component
  socket.on('RoomInfoResponse', function(data) {
    console.log(user.profile.name + '|' + 'Successfully entered practice room: ' + data.name + ' (' + data.roomID + ')');
    console.log(user.profile.name + '|' + 'Opening component '+componentID+'...');
    socket.emit('OpenComponentForCodingRequest', { componentID: componentID }); 
  });

  // get their current code (roomid, componentid, language, code) & run tests
  socket.on('OpenComponentResponse', function(data) {
    console.log(user.profile.name + '|' + 'Running all system tests...');
    socket.emit('PracticeSystemTestRequest', { roomID: roomID, componentIds: [componentID] });
  });

  // individual system test results
  socket.on('PracticeSystemTestResultResponse', function(data) {
    // wait 3 seconds so all tests return and check for success
    if (!awaitingTestResults) {
      console.log(user.profile.name + '|' + 'Started getting results back. Checking for status in 3 seconds....')
      awaitingTestResults = true;
      setTimeout(function(){
        console.log(user.profile.name + '|' + 'Checking status of all tests....');
        if (allSystemTestsPass === true) {
          console.log(user.profile.name + '|' + 'All tests passed!');
          process.send('Passed');
          process.send(true);
        } else {
          console.log(user.profile.name + '|' + 'At least one test failed!');
          process.send('Failed');
          process.send(false);
        }
      }, 3000);  
    }    
    console.log(user.profile.name + '|' + 'Test result: ' + data.resultData.succeeded);
    // set a flag if at least ONE test fails
    if (data.resultData.succeeded === false) allSystemTestsPass = false;
  });

  socket.on('PopUpGenericResponse', function (data) {
    console.log(user.profile.name + '|' + 'PopUpGenericResponse:')
    console.log(data);  
  });

  socket.on('disconnect',function(err) {
    console.log(user.profile.name + '|' + 'The client has been disconnected');
  });  

  socket.on('connect_error',function(err) {
    console.log(user.profile.name + '|' + 'connect_error');
    console.log(err);
  });

  socket.on(user.profile.name + '|' + 'error', function(err) {
    console.log('error');
    console.log(err);
  });   

});

process.on('uncaughtException',function(err){
    console.log(err);
})

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