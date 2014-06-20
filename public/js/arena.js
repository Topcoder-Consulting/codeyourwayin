
var socket =  io.connect('https://arenaws.topcoder.com');

var roomID = 321513;
var componentID = 39286;  


function login() {
  var username = 'jeffdonthemic';
  var password = 'mypass';
  console.log('Logging into arena...');
  socket.emit('LoginRequest', {username: username, password: password});

  growl('success', 'Logging into the arena.');

}

function compile() {
  //var componentID = $('#problemForm #componentID').val();
  var code = $('#code').val();
  var language = $('#language').val();
  socket.emit('CompileRequest', { componentID: componentID, language: language, code: code });
}  

function growl(type, message) {

  if (type.trim() === 'error.') {
    type = "error";
  }

  $.bootstrapGrowl(message, {
    type: 'success', // (null, 'info', 'error', 'success')
    offset: {from: 'top', amount: 60},
    align: 'right',
    width: 'auto',
    delay: 3000,
    allow_dismiss: false,
    stackup_spacing: 10
  });

}

socket.on('connect', function() {
  console.log('Client has connected to the server!');
  login();
});  

// after logging in
socket.on('CreateRoundListResponse', function (data) {
  if(data.type && data.type === 1) {
    if(data.roundData) {
      growl('info', 'Entering practice room');
      console.log('Found practice rooms ' + data.roundData[0].contestName);
      console.log('Entering room: ' + data.roundData[0].contestName + ' - ' + data.roundData[0].practiceRoomID);
      socket.emit('MoveRequest', { moveType: 4, roomID: data.roundData[0].practiceRoomID });
      socket.emit('EnterRequest', { roomID: -1 });          
    }
  }
});  

// after moving to a room, open a problem
socket.on('CreateProblemsResponse', function (data) {
  //console.log(data);
  if (typeof data.problems[0] != 'undefined') {
    console.log('Received CreateProblemsResponse. Opening problem: ' + data.problems[0].components[0].componentID);
    socket.emit('OpenComponentForCodingRequest', { componentID: data.problems[0].components[0].componentID });
  }
});  

socket.on('GetProblemResponse', function (data) {
  console.log('Received GetProblemResponse -- ');
  console.log(data);
});  

socket.on('OpenComponentResponse', function (data) {
  console.log('Received OpenComponentResponse -- ');
  console.log(data);
});  

// after compiling chode
socket.on('PopUpGenericResponse', function (data) {
  console.log('Received PopUpGenericResponse --');
  console.log(data);
  growl(String(data.title.toLowerCase()), data.message);
});
