var editor;

$(function(){
  editor = ace.edit('editor');
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode('ace/mode/java');
  $('#successBtn').hide();
});  

var socket =  io.connect('https://arenaws.topcoder.com');

//var roomID = 321513; // 13125
//var componentID = 39763; // 39286;  // 39763

var roomID  = $('#roomId').val();
var componentID  = $('#componentId').val();
var roundID = 15941;  // 13674  - srm 616
var isPracticeRoomOpen = false;
var json;

function login() {
  var username = 'jeffdonthemic';
  var password = 'FMGY9s9VoR';
  console.log('Logging into arena...');
  socket.emit('LoginRequest', {username: username, password: password});
  growl('info', 'Logging you into the arena.');
}

function compile() {
  socket.emit('CompileRequest', { 
    componentID: componentID, language: $('#language').val(), code: editor.getValue() 
  });
}  

function success() {
  $('#hidden').submit();
}  

// practiceSystemTestProblem
function testProblem() {
    var args = $('#args').val();
    try {
      args = prepareTestArgs(JSON.parse('{"args": [' + args + ']}')['args']);
    } catch (e) {
      growl('danger', 'Testing arguments are in invalid format.');
      return;
    }
    socket.emit('TestRequest', { args: args, componentID: componentID });    
}

function submit() {
  socket.emit('PracticeSystemTestRequest', { roomID: roomID, componentIds: [componentID] });
  //socket.emit('SubmitRequest', { componentID: componentID });
}

socket.on('connect', function() {
  console.log('Client has connected to the server!');
  login();
});  

socket.on('PracticeSystemTestResponse', function(data) {
  console.log('====== PracticeSystemTestResponse')
  console.log(data)
});  

socket.on('PracticeSystemTestResultResponse', function(data) {
  console.log('====== PracticeSystemTestResultResponse')
  console.log(data)
});  


// after logging in
socket.on('CreateRoundListResponse', function (data) {
  if (!isPracticeRoomOpen) {
    isPracticeRoomOpen = true;
    console.log('Entering practice room: ' + roomID);
    socket.emit('MoveRequest', { moveType: 4, roomID: roomID });
    socket.emit('EnterRequest', { roomID: -1 });      
  }
  // if(data.type && data.type === 1) {
  //   if(data.roundData) {
  //     growl('info', 'Entering practice room');
  //     console.log('Found practice rooms ' + data.roundData[0].contestName);
  //     console.log('Entering room: ' + data.roundData[0].contestName + ' - ' + data.roundData[0].practiceRoomID);
  //     socket.emit('MoveRequest', { moveType: 4, roomID: data.roundData[0].practiceRoomID });
  //     socket.emit('EnterRequest', { roomID: -1 });          
  //   }
  // }
});  

// after moving to a room, open a problem
socket.on('CreateProblemsResponse', function (data) {
  if (data.roundID === roundID) {
    socket.emit('OpenComponentForCodingRequest', { componentID: componentID }); 
    growl('info', 'Loading a random problem.');
    //console.log(data);
    //console.log('Opening first problem...');   
  }
});  

socket.on('GetProblemResponse', function (data) {
  $('#loading').hide();
  $('#problem').fadeIn( "slow" )
  console.log('Here is the problem!!');
  console.log(data);
  json = data.problem.primaryComponent;
  var problem = data.problem.primaryComponent;
  $('#title').text(data.problem.name);
  $('#instruction').text(S(problem.intro.text).replaceAll('null', '').s);
  var paramTypes = _.pluck(problem.allParamTypes[0], 'description');
  var paramNames = _.pluck(problem.allParamNames[0]);

  // definition
  var definition = '<b>Definition</b>';
  definition += '<br/>&nbsp;&nbsp;Class: ' +problem.className;
  definition += '<br/>&nbsp;&nbsp;Method: ' +problem.methodName + ' (be sure your method is public)';
  definition += '<br/>&nbsp;&nbsp;Parameters: ' + _.pluck(problem.allParamTypes[0], 'description').join(', ');
  definition += '<br/>&nbsp;&nbsp;Returns: ' + _.pluck(problem.allReturnTypes, 'description').join(', '); 
  definition += '<br/>&nbsp;&nbsp;Method signature: ' + _.pluck(problem.allReturnTypes, 'description').join(', ') + ' ' + problem.methodName + '(';
  for (i = 0; i<paramTypes.length;i++) {
    definition += paramTypes[i] + ' ' + paramNames[i];
    if (i < paramTypes.length-1) definition += ', ';
  }
  definition += ')';
  $('#definition').html(definition);

  // constraints
  var constraints = '<b>Constraints</b>';
  for (i = 0; i<problem.constraints.length;i++) {
    constraints += '<br/>&nbsp;&nbsp;' + problem.constraints[i].text;
  }
  $('#constraints').html(constraints);

});  

// response from submitting solution
socket.on('SubmitResultsResponse', function (data) {
  console.log('Received SubmitResultsResponse: ');
  console.log(data);
  var type = 'danger';
  if (S(data.message).contains('successful')) {
    type = 'success';
    $('#successBtn').show();
  }
  growl(type, data.message, 5000);
});

// after compiling chode
socket.on('PopUpGenericResponse', function (data) {
  console.log('Received PopUpGenericResponse --');
  console.log(data);

  var type = 'info';
  var delay = 3000;
  var showModal = true;

  if (data.message === 'You cannot compile blank code.' || S(data.message).contains('cannot submit')) {
    type = 'danger';
  } else if (S(data.message).contains('code compiled successfully')) {
    type = 'success'
  } else if (S(data.message).contains('error')) {
    type = 'danger';
    delay = 100000;
  } else if (data.title === 'Multiple Submission') {
    showModal = false;
    console.log('Confirming resubmission for ' + componentID);
    socket.emit('GenericPopupRequest', { popupType: 14, button: 0, surveyData: [parseInt(componentID)] });
  } else if (data.title === 'Test Results') {
    delay = 6000; 
    data.message = S(data.message).replaceAll('\n', '<br/>').s
  }

  if (showModal) growl(type, data.message, delay);

});

function changeLanguage() {
  var mode = 'java';
  if ($('#language').val() === '3') mode = 'c_cpp';
  if ($('#language').val() === '4') mode = 'csharp';
  if ($('#language').val() === '5') mode = 'vbscript';
  if ($('#language').val() === '6') mode = 'python';
  editor.getSession().setMode('ace/mode/' + mode);
}

function growl(type, message, delay) {
  var allow_dismiss = false;
  if (typeof delay === 'undefined') delay = 2000;
  if (type === 'danger') allow_dismiss = true
  $.bootstrapGrowl(message, {
    type: type, // (null, 'info', 'danger', 'success')
    offset: {from: 'top', amount: 60},
    align: 'right',
    width: 'auto',
    delay: delay,
    allow_dismiss: allow_dismiss,
    stackup_spacing: 10
  });
}

function prepareTestArgs(args) {
  if (args instanceof Array) {
    for (var i = 0; i < args.length; i++) {
      args[i] = prepareTestArgs(args[i]);
    }
    return args;
  } else if (args instanceof Object) {
    throw 'Invalid argument.';
  } else {
    return String(args);
  }
}
