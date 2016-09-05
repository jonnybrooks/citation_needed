var socket = io('http://localhost:3000');
socket.on('connection', function () {
	console.log('established');
});