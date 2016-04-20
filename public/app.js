var image = document.getElementById('stream');
var socket = io.connect('/stream');
var log = $('#log');

socket.on('image', function(data){
  image.src = 'data:image/jpeg;base64,' + data.data;

  if (data.save) $('<img src="'+image.src+'" />').prependTo(log);
  //console.log(nuevo.appendTo(log));

  //if (data.save) log.append('<img src="'+image.src = 'data:image/jpeg;base64,' + data.data+'"/>');


});
