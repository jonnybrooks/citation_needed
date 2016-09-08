let socket;
let room;
let roomKey = genRoomKey(4);

$('#view-lobby .key').text(roomKey); // display this room's key

socket = io('http://localhost:8888/room'); // connect to the socket server
socket.on('connect', () => {
	console.log('socket connection established');
	room = new Room({	// create the room
		socketId: `/room#${socket.id}`, 
		roomKey: roomKey, 
		maxPlayers: 2 
	})
	socket.emit('register', roomKey ); // register the room with the server
})
socket.on('room-registered', rk => {
	console.log('room registered with key: %s', rk);
})
socket.on('player-registered', player => {
	console.log('new player has connected: %s', JSON.stringify(player));
	room.players[player.socketId] = player; // add this player to the local room	

	let frag = fragment($('#t-player').html());

	$(frag).find('.player .name').text(player.name);
	$(frag).find('.player .id').text(player.socketId);
	$('#view-lobby .players').append(frag);
})

socket.on('relay', message => {
	actions[message.action] ? actions[message.action](message) : console.log('Action does not exist');
})

$('body').hide();

let actions = {
	'getPlayerList': message => {
		socket.emit('relay', {
			from: message.to,
			to: message.from,
			action: 'printPlayerList',
			args: { pl: room.players }				
		})
	}
}


function Room(conf) {
	this.roomKey = conf.roomKey;
	this.socketId = conf.socketId;
	this.maxPlayers = conf.maxPlayers;
	this.players = {};
}

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}

function genRoomKey(len) {
	let rk = '';
	for(let i = 0; i < len; i++) {
		rk+=Math.floor(Math.random() * 10);
	}
	return rk;
}