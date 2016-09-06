var rk = genRoomKey(4); // generate the roomKey
var socket; // declare the socket

document.getElementById('key').innerHTML = rk; // display this room's key

socket = io('http://localhost:8888'); // connect to the socket server
socket.on('established', function () {
	console.log('established');
	socket.emit('create', {type: 'room', _roomKey: rk}); // generate the room
});

function genRoomKey(len) {
	let id = '';
	for(let i = 0; i < len; i++) {
		id+=Math.floor(Math.random() * 10);
	}
	return id;
}