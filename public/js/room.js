let socket;
let room;

socket = io('http://localhost:8888/room'); // connect to the socket server
socket.on('connect', () => {
	console.log('socket connection established');	
})
socket.on('room-registered', rk => {
	console.log('room registered with key: %s', rk);
	$('#view-lobby .key').text(rk); // display this room's key
	room = new Room({	// create the room
		socketId: `/room#${socket.id}`, 
		roomKey: rk, 
		maxPlayers: 2
	})
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
	responses[message.request] ? 
		responses[message.request](message) : 
		console.log(`no response handler exists for ${message.request}`);	
})

$('body').hide();

let responses = {
	'relayPlayerList': message => {
		socket.emit('relay', {
			from: message.to,
			to: message.from,
			request: 'printPlayerList',
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