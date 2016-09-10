let socket; 
let player;

socket = io('http://localhost:8888/player');
socket.on('connect', () => {
	console.log('socket connection established');

	$('body').off('click', '#view-player-registration .submit');
	$('body').on('click', '#view-player-registration .submit', e => {
		let roomKey = $('#view-player-registration .roomKey').val();
		let name = $('#view-player-registration .name').val();

		player = new Player({ // instantiate the player
			socketId: `/player#${socket.id}`,
			roomKey: roomKey, 
			name: name
		});

		socket.emit('register', player); // register the player with the server
	})
})

socket.on('player-registered', rk => {
	console.log('player registered on room with key: %s', rk);
})
socket.on('disconnect', () => {
	console.log('disconnected from server');
})
socket.on('force-disconnect', () => {
	console.log('server issued a forced-disconnect request');
})

socket.on('relay', message => {
	responses[message.request] ? 
		responses[message.request](message) : 
		console.log(`no response handler exists for ${message.request}`);	
})

// $('body').hide();

let responses = {
	'displayThisQuestion': message => console.log(message.args.question)
}

function Player(conf) {	
	this.socketId = conf.socketId;
	this.roomKey = conf.roomKey;
	this.name = conf.name;	
}

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}