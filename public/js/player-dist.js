'use strict';

var socket = undefined;
var player = undefined;

// window.innerWidth <= 800 ? alert('mobile .rev-1') : null;

// socket = io('http://localhost:8888/player');
socket = io('http://192.168.0.26:8888/player'); // connect to the socket server
socket.on('connect', function () {
	console.log('socket connection established');
});

socket.on('player-registered', function (rk) {
	console.log('player registered on room with key: %s', rk);
	$('.display-name span').text(player.name);
});
socket.on('disconnect', function () {
	console.log('disconnected from server');
});
socket.on('force-disconnect', function () {
	console.log('server issued a forced-disconnect request');
});

socket.on('relay', function (message) {
	responses[message.request] ? responses[message.request](message) : console.log('no response handler exists for ' + message.request);
});

// response list for server requests

var responses = {
	prepareQuestion: function prepareQuestion(message) {
		// console.log('qid: %s, article: %s ', message.args.qid, message.args.question)
		var round = message.args.round;
		var view = '#view-submit-answer-round-' + round;
		$(view).find('.submit-answer[data-question-id=""]').eq(0).attr('data-question-id', message.args.qid).find('.question').text(message.args.question);
		$('.view').hide().filter(view).show(); // show only the correct view
	}
};

function Player(conf) {
	this.socketId = conf.socketId;
	this.roomKey = conf.roomKey;
	this.name = conf.name;
	this.submissionsComplete = {};
}

$('.submit-player').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();
	player = new Player({ // instantiate the player
		socketId: '/player#' + socket.id,
		roomKey: form[0].value,
		name: form[1].value
	});

	socket.emit('register', player); // register the player with the server
});
$('.submit-answer').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();

	var message = {
		from: player.socketId,
		to: player.roomKey,
		request: 'acceptQuestionSubmission',
		args: {
			qid: $(this).attr('data-question-id'),
			answer: form[0].value
		}
	};

	console.log(message);

	if ($(this).is('.final')) $('.view').hide().filter('#view-lobby').show(); // go back to lobby is this last question
	else $(this).hide().next().show(); // otherwise show the next question

	socket.emit('relay', message);
});

function fragment(htmlStr) {
	var frag = document.createDocumentFragment();
	var temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
}
