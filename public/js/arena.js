var editor;
var socket =  io.connect('https://arenaws.topcoder.com');
var roomID  = $('#roomId').val();
var componentID  = $('#componentId').val();
var roundID = parseInt($('#roundId').val());
var isPracticeRoomOpen = false;
var allSystemTestsPass = true;
var json;

$(function(){
  editor = ace.edit('editor');
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode('ace/mode/java');
  $('#successBtn').hide();
  $('#testResultsPanel').hide();
});  

function login() {
  console.log('Logging into arena...');
  socket.emit('SSOLoginRequest', {sso: $.cookie('tcsso')});
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
  $('#testResultsPanel').show();
  $("#testresults").find('tr').slice(1).remove();
  allSystemTestsPass = true;
  setTimeout(function(){
    if (allSystemTestsPass === true) {
      $('#successBtn').show();
    }
  }, 3000);
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
  var indicator = 'success';
  if (data.resultData.succeeded === false) indicator = 'danger';
  var html = '<tr class='+indicator+'><td>'+data.resultData.succeeded+'</td><td>'+data.resultData.expectedValue+'</td><td>'+data.resultData.returnValue+'</td><td>'+S(data.resultData.args).replaceAll(',', ', ').s;+'</td></tr>';
  $('#testresults tr').first().after(html);
  // set indicator that a least one test failed
  if (data.resultData.succeeded === false) allSystemTestsPass = false;
});  


// after logging in
socket.on('CreateRoundListResponse', function (data) {
  if (!isPracticeRoomOpen) {
    isPracticeRoomOpen = true;
    console.log('Entering practice room: ' + roomID);
    socket.emit('MoveRequest', { moveType: 4, roomID: roomID });
    socket.emit('EnterRequest', { roomID: -1 });      
  }
});  

// after moving to a room, open a problem
socket.on('CreateProblemsResponse', function (data) {
  if (data.roundID === roundID) {
    socket.emit('OpenComponentForCodingRequest', { componentID: componentID }); 
    growl('info', 'Loading a random problem.');
  }
});  

socket.on('GetProblemResponse', function (data) {
  $('#loading').hide();
  $('#problem').fadeIn( "slow" )
  console.log('Here is the problem!!');
  console.log(data);
  var problem = data.problem.primaryComponent;
  $('#title').text(data.problem.name);
  $('#instruction').html(parseIntro(problem.intro));
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
  if (!S(data.message).contains('successful')) {
    growl('danger', data.message, 5000);
  }
});

// after compiling chode
socket.on('PopUpGenericResponse', function (data) {

  var type = 'info';
  var delay = 3000;
  var showModal = true;

  if (data.message === 'You cannot compile blank code.' || S(data.message).contains('cannot submit')) {
    type = 'danger';
  } else if (S(data.message).contains('code compiled successfully')) {
    // always submit when code successfully compiles
    socket.emit('SubmitRequest', { componentID: componentID });
    console.log("Submitting code for " + componentID);
    type = 'success'
  } else if (S(data.message).contains('error')) {
    type = 'danger';
    delay = 100000;
  } else if (data.title === 'Multiple Submission') {
    showModal = false;
    //console.log('Confirming resubmission for ' + componentID);
    socket.emit('GenericPopupRequest', { popupType: 14, button: 0, surveyData: [parseInt(componentID)] });
  } else if (data.title === 'Test Results') {
    delay = 6000; 
    data.message = S(data.message).replaceAll('\n', '<br/>').s
  }

  if (showModal) growl(type, data.message, delay);

});

function parseIntro(obj) {
  var intro = '';
  for (j=0;j<obj.children.length;j++) {
    if (obj.children[j].children) {
      for (i=0;i<obj.children[j].children.length;i++) {
        var child = obj.children[j].children[i];
        if (child.editableText) {
          intro += child.editableText;
        } else if (child.description) {
          intro += child.description;
        } else {
          intro += child.text;
        }
      }
    } else {
      if (obj.children[j].editableText) {
        intro += obj.children[j].editableText;
      } else if (obj.children[j].description) {
        intro += obj.children[j].description;
      } else {
        intro += obj.children[j].text;
      }
    }
  }

  intro = S(intro.trim()).replaceAll('\n\n\n\n', '<br><br>').s
  intro = S(intro.trim()).replaceAll('\n\n', '<br><br>').s
  intro = S(intro).replaceAll('\n', ' ').s
  return intro;

}

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
