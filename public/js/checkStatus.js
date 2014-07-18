(function poll() {
   setTimeout(function() {
     $.ajax({
       type: 'GET',
       url: "/arena/status", 
       success: function(status) {
         if (status === 'Passed') {
            window.location = "/arena/results";
         } else if (status === 'Failed') {
            window.location = "/arena?failure=true";
         } else {
            growl('info', status);
            poll();
         }
       },
       failure: function(err) {
         console.log('Error getting status: ' + err);    
         growl('danger', err);
       }
     });
    }, 5000);
})();

function growl(type, message) {
  $.bootstrapGrowl(message, {
    type: type, // (null, 'info', 'danger', 'success')
    offset: {from: 'top', amount: 60},
    align: 'right',
    width: 'auto',
    allow_dismiss: false,
    stackup_spacing: 10
  });
}