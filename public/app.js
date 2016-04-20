var image = document.getElementById('stream');
var socket = io.connect('/stream');
socket.on('image', function(data){
  image.src = 'data:image/jpeg;base64,' + data.data;
});
