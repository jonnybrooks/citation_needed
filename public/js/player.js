var socket = io('http://localhost:8888');
socket.on('established', function () {
	console.log('established');	
});

document.getElementById('submit').addEventListener('click', function(e){
	socket.emit('create', {
		type: 'player', 
		_roomKey: document.getElementById('_roomKey').value, 
		name: document.getElementById('name').value
	})
})