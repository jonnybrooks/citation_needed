'use strict';

var socket = undefined;
var room = undefined;

socket = io('http://' + location.host + '/room');
socket.on('connect', function () {
	console.log('socket connection established');
	$('.players, .questions').html('');
});
socket.on('room-registered', function (r) {
	console.log('room registered with key: %s', r.roomKey);
	room = r; // set local copy of room to remote copy
	$('#view-lobby .key').text(r.roomKey); // display this room's key
});
socket.on('player-registered', function (player) {
	console.log('new player has connected: %s', JSON.stringify(player));

	room.players[player.socketId] = player; // register this player on the local copy
	addPlayerToPage(player);

	if (Object.keys(room.players).length === room.minPlayers) {
		socket.emit('relay', {
			from: room.roomKey,
			to: Object.keys(room.players)[0],
			request: 'displayStartButton'
		});
	}
});

socket.on('relay', function (message) {
	responses[message.request] ? responses[message.request](message) : console.log('no response handler exists for ' + message.request);
});

// $('body').hide();

var responses = {
	startTheGame: function startTheGame(message) {
		roundTwo();
	},
	acceptQuestionSubmission: function acceptQuestionSubmission(message) {
		room.questions[message.args.qid].submissions[message.from] = message.args.answer;
		room.players[message.from].submissionsComplete[message.args.qid] = true;

		$('.question[data-question-id="' + message.args.qid + '"]').find('.answer[data-player-id="' + message.from + '"]').find('.content').text(message.args.answer);

		if (allComplete(room.players[message.from])) console.log('%s is finished!', message.from);
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

	addQuestionToPage(q);

	for (var pid in room.players) {
		room.questions[q.id].submissions[pid] = null;
		room.players[pid].submissionsComplete[q.id] = false;
		addAnswerToQuestion(q, room.players[pid]);
	}

	socket.emit('relay', { // relay the question to everyone in the room
		from: room.roomKey, to: room.roomKey, request: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
	});
}

// in round two, everyone submits two excerpts
function roundTwo() {
	$('.questions').html(''); // clear questions
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
		addQuestionToPage(q);
		addAnswerToQuestion(q, room.players[p1]);
		addAnswerToQuestion(q, room.players[p2]);
	}
}

function addPlayerToPage(player) {
	var frag = fragment($('#template-player').html());
	$(frag).find('.player').attr('data-player-id', player.socketId);
	$(frag).find('.player .name').text(player.name);
	$('#view-lobby .players').append(frag);
}

function addQuestionToPage(question) {
	var frag = fragment($('#template-question').html());
	$(frag).find('.question').attr('data-question-id', question.id);
	$(frag).find('.question .id').text(question.id);
	$(frag).find('.question .answer').text(question.socketId);
	$('#view-lobby .questions').append(frag);
}

function addAnswerToQuestion(q, player) {
	var frag = fragment($('#template-answer').html());
	$(frag).find('.answer').attr('data-player-id', player.socketId);
	$(frag).find('.answer .player').text(player.name);
	$(frag).find('.answer .content').text('Pending');
	$('.question[data-question-id="' + q.id + '"] .answers').append(frag);
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

function allComplete(p) {
	for (var i in p.submissionsComplete) {
		if (!p.submissionsComplete[i]) return false;
	}
	return true;
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
