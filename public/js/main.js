let rk = genRoomKey(4); // generate the roomKey
let socket; // declare the socket

socket = io('http://localhost:8888/room'); // connect to the socket server
socket.on('connect', () => {
	console.log('established');
	changeView('lobby');	
	$('#view-lobby .key').text(rk); // display this room's key
	socket.emit('create', { _roomKey: rk }); // generate the room
})
socket.on('player-connect', obj => {
	console.log('new player has connected: %s', JSON.stringify(o.player));
	let frag = fragment($('#t-player').html());

	console.dir($('#t-player').length);

	$(frag).find('.player .name').text(obj.player.name);
	$(frag).find('.player .id').text(obj.player._socketId);
	$('#view-lobby .players').append(frag);
})

function changeView(view) {
	let frag = fragment($(`#v-view-${view}`).html());
	$('#view-container').html(frag);
}

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}

function genRoomKey(len) {
	let id = '';
	for(let i = 0; i < len; i++) {
		id+=Math.floor(Math.random() * 10);
	}
	return id;
}