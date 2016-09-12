'use strict';

var socket = undefined;
var player = undefined;

socket = io('http://localhost:8888/player');
// socket = io('http://cn.jonathan-brooks.co.uk/player'); // connect to the socket server
socket.on('connect', function () {
	console.log('socket connection established');
});

socket.on('player-registered', function (p) {
	// console.log('player registered on room with key: %s', rk);

	player = p;

	$('.display-name span').text(player.name);
	$('.view').hide().filter('#view-lobby').show(); // go to lobby once player registered
});
socket.on('player-refused', function () {
	// console.log('player registered on room with key: %s', rk);
	$('.display-name span').text(player.name);
	$('.view').hide().filter('#view-lobby').show(); // go to lobby once player registered
});

socket.on('relay', function (message) {
	responses[message.request] ? responses[message.request](message) : console.log('no response handler exists for ' + message.request);
});

// response list for server requests

var responses = {
	displayStartButton: function displayStartButton(message) {
		$('.submit-game-start').addClass('ready');
	},
	prepareQuestion: function prepareQuestion(message) {
		// console.log('qid: %s, article: %s ', message.args.qid, message.args.question)
		var round = message.args.round;
		var view = '#view-submit-answer-round-' + round;
		$(view).find('.submit-answer[data-question-id=""]').eq(0).attr('data-question-id', message.args.qid).find('.question').text(message.args.question);
		$('.view').hide().filter(view).show(); // show only the correct view
	}
};

$('.submit-player').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();
	socket.emit('attempt-registration', { roomKey: form[0].value, name: form[1].value }); // register the player with the server
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

	if ($(this).is('.final')) $('.view').hide().filter('#view-lobby').show(); // go back to lobby if this is last question
	else $(this).hide().next().show(); // otherwise show the next question

	socket.emit('relay', message);
});

$('.submit-game-start').on('submit', function (e) {
	e.preventDefault();
	$(this).hide();

	var message = {
		to: player.roomKey,
		request: 'startTheGame'
	};

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
