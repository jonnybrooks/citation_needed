let socket;
let room;

socket = io('http://localhost:8888/room'); // connect to the socket server
// socket = io('http://cn.jonathan-brooks.co.uk/room'); // connect to the socket server
socket.on('connect', () => {
	console.log('socket connection established');	
	$('#view-lobby .players').html('')
})
socket.on('room-registered', r => {
	console.log('room registered with key: %s', r.roomKey);
	room = r; // set local copy of room to remote copy
	$('#view-lobby .key').text(r.roomKey); // display this room's key
})
socket.on('player-registered', player => {
	console.log('new player has connected: %s', JSON.stringify(player));
	let frag = fragment($('#template-player').html());

	room.players[player.socketId] = player; // register this player on the local copy

	$(frag).find('.player .name').text(player.name);
	$(frag).find('.player .id').text(player.socketId);
	$('#view-lobby .players').append(frag);	

	if(Object.keys(room.players).length === room.maxPlayers) {
		socket.emit('relay', {
			from: room.roomKey,
			to: Object.keys(room.players)[0],
			request: 'displayStartButton'
		})
	}
	
})

socket.on('relay', message => {
	responses[message.request] ? 
		responses[message.request](message) : 
		console.log(`no response handler exists for ${message.request}`);	
})

// $('body').hide();

let responses = {
	startTheGame: message => {
		roundOne();
	},
	acceptQuestionSubmission: message => {
		console.log(message.args);
	}	
}

let questionPool  = {
	roundOne: [
		{id: 0, excerpt: 'they hunt in packs0', article: 'grannies'},
		{id: 1, excerpt: 'they hunt in packs1', article: 'grannies'},
		{id: 2, excerpt: 'they hunt in packs2', article: 'grannies'},
		{id: 3, excerpt: 'they hunt in packs3', article: 'grannies'},
		{id: 4, excerpt: 'they hunt in packs4', article: 'grannies'},
		{id: 5, excerpt: 'they hunt in packs5', article: 'grannies'},
	],
	roundTwo: [
		{id: 0, article: 'dung beetle0'},
		{id: 1, article: 'dung beetle1'},
		{id: 2, article: 'dung beetle2'},
		{id: 3, article: 'dung beetle3'},
		{id: 4, article: 'dung beetle4'}
	]
}

// in round one, everyone submits one article title
function roundOne () {
	let players = Object.keys(room.players); // get player ids
	let questions = questionPool.roundOne; // get this rounds question pool
	let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
	room.questions[q.id] = { article: q.article, submissions: {} };
	for(let pid in room.players) {
		room.questions[q.id].submissions[pid] = null;
		room.players[pid].submissionsComplete[q.id] = false;
	}
	socket.emit('relay', { // relay the question to everyone in the room
		from: room.roomKey, to: room.roomKey, request: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
	})	
}

// in round two, everyone submits two excerpts
function roundTwo () {
	let players = shuffle(Object.keys(room.players)); // get player ids and randomize
	let questions = questionPool.roundTwo; // get this rounds question pool
	for(let i = 0; i < players.length; i++) {
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
		let p1 = players[i];
		let p2 = players[i+1] || players[0];
		room.questions[q.id] = { question: q.article, submissions: {} };
		room.questions[q.id].submissions[p1] = null;
		room.questions[q.id].submissions[p2] = null;
		room.players[p1].submissionsComplete[q.id] = false;
		room.players[p1].submissionsComplete[q.id] = false;

		socket.emit('relay', {
			from: room.roomKey, to: p1, request: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
		})
		socket.emit('relay', {
			from: room.roomKey, to: p2, request: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
		})
	}
}

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}

function shuffle(array) {
	let currentIndex = array.length, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}