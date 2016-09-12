'use strict';

var socket = undefined;
var room = undefined;

socket = io('http://localhost:8888/room'); // connect to the socket server
// socket = io('http://192.168.0.26:8888/room'); // connect to the socket server
socket.on('connect', function () {
	// console.log('socket connection established');	
	$('#view-lobby .players').html('');
});
socket.on('room-registered', function (rk) {
	// console.log('room registered with key: %s', rk);
	$('#view-lobby .key').text(rk); // display this room's key
	room = new Room({ // create the room
		socketId: '/room#' + socket.id,
		roomKey: rk,
		maxPlayers: 1,
		maxPlayers: 1
	});
});
socket.on('register-player', function (player) {
	// console.log('room registered with key: %s', rk);
	if (Object.keys(room.players).length < room.maxPlayers) {
		// if room is at capacity
		room.players[player.socketId] = player; // add this player to the local room
		socket.emit('registration-accept', player); // allow entry to this player			
	} else {
		socket.emit('registration-reject', player); // refuse entry to this player
	}
});
socket.on('player-registered', function (player) {
	// console.log('new player has connected: %s', JSON.stringify(player));
	var frag = fragment($('#template-player').html());

	$(frag).find('.player .name').text(player.name);
	$(frag).find('.player .id').text(player.socketId);
	$('#view-lobby .players').append(frag);

	if (Object.keys(room.players).length === room.minPlayers) {
		socket.emit('relay', {
			from: room.roomKey,
			to: Object.keys(room.players)[0],
			request: 'displayStartButton' // show start button
		});
	}
});

socket.on('relay', function (message) {
	responses[message.request] ? responses[message.request](message) : console.log('no response handler exists for ' + message.request);
});

// $('body').hide();

var responses = {
	startTheGame: function startTheGame(message) {
		roundOne();
	},
	acceptQuestionSubmission: function acceptQuestionSubmission(message) {
		console.log(message.args);
	}
};

var questionPool = {
	roundOne: [{ id: 0, excerpt: 'they hunt in packs0', article: 'grannies' }, { id: 1, excerpt: 'they hunt in packs1', article: 'grannies' }, { id: 2, excerpt: 'they hunt in packs2', article: 'grannies' }, { id: 3, excerpt: 'they hunt in packs3', article: 'grannies' }, { id: 4, excerpt: 'they hunt in packs4', article: 'grannies' }, { id: 5, excerpt: 'they hunt in packs5', article: 'grannies' }],
	roundTwo: [{ id: 0, article: 'dung beetle0' }, { id: 1, article: 'dung beetle1' }, { id: 2, article: 'dung beetle2' }, { id: 3, article: 'dung beetle3' }, { id: 4, article: 'dung beetle4' }]
};

// in round one, everyone submits one article title
function roundOne() {
	var players = Object.keys(room.players); // get player ids
	var questions = questionPool.roundOne; // get this rounds question pool
	var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
	room.questions[q.id] = { article: q.article, submissions: {} };
	for (var pid in room.players) {
		room.questions[q.id].submissions[pid] = null;
		room.players[pid].submissionsComplete[q.id] = false;
	}
	socket.emit('relay', { // relay the question to everyone in the room
		from: room.roomKey, to: room.roomKey, request: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
	});
}

// in round two, everyone submits two excerpts
function roundTwo() {
	var players = shuffle(Object.keys(room.players)); // get player ids and randomize
	var questions = questionPool.roundTwo; // get this rounds question pool
	for (var i = 0; i < players.length; i++) {
		var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
		var p1 = players[i];
		var p2 = players[i + 1] || players[0];
		room.questions[q.id] = { question: q.article, submissions: {} };
		room.questions[q.id].submissions[p1] = null;
		room.questions[q.id].submissions[p2] = null;
		room.players[p1].submissionsComplete[q.id] = false;
		room.players[p1].submissionsComplete[q.id] = false;

		socket.emit('relay', {
			from: room.roomKey, to: p1, request: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
		});
		socket.emit('relay', {
			from: room.roomKey, to: p2, request: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
		});
	}
}

function Room(conf) {
	this.roomKey = conf.roomKey;
	this.socketId = conf.socketId;
	this.maxPlayers = conf.maxPlayers;
	this.minPlayers = conf.minPlayers;
	this.players = {};
	this.questions = {};
	this.timer = null;
}

function fragment(htmlStr) {
	var frag = document.createDocumentFragment();
	var temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
}

function shuffle(array) {
	var currentIndex = array.length,
	    temporaryValue = undefined,
	    randomIndex = undefined;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}
