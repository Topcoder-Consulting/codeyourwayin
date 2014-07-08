var io = require('socket.io-client');
var Q = require("q");

exports.login = function(sso) {

  io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
  });  

  var socket = io.connect('https://arenaws.topcoder.com');

  socket.on('connect', function() {
    console.log('Client has connected to the server! Now logging in....');
    socket.emit('SSOLoginRequest', {sso: sso});
  });

  // after logging in
  socket.on('UserInfoResponse', function(data) {
    console.log('Logged in as: ' + data.userInfo.handle);
  });  

  socket.on('connect_error',function(err) {
    console.log('connect_error');
      console.log(err);
  });

  socket.on('error', function(err) {
    console.log('error');
      console.log(err);
  });   

}

exports.checkCode = function(sso, roomID, componentID) {

  var deferred = Q.defer();
  var allSystemTestsPass = true;

  var socket = io.connect('https://arenaws.topcoder.com');

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
    // wait 3 seconds so all tests return and check for success
    setTimeout(function(){
      if (allSystemTestsPass === true) {
        deferred.resolve('passed');
      } else {
        deferred.reject('You code did not pass system tests.');
      }
    }, 3000);  
  });

  // individual system test results
  socket.on('PracticeSystemTestResultResponse', function(data) {
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