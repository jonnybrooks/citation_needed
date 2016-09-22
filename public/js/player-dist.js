'use strict';

var socket = undefined;
var player = undefined;

socket = io('http://' + location.host + '/player');
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
	alert('Unable to join this room, it is probably full.');
});

socket.on('relay', function (message) {
	commands[message.command] ? commands[message.command](message) : console.log('no response handler exists for ' + message.command);
});

// response list for server commands

var commands = {
	displayLobby: function displayLobby(message) {
		$('.view').hide().filter('#view-lobby').show(); // go to lobby
	},
	displayStartButton: function displayStartButton(message) {
		$('.submit-game-start').addClass('show');
	},
	prepareQuestion: function prepareQuestion(message) {
		// console.log('qid: %s, article: %s ', message.args.qid, message.args.question)
		var round = message.args.round;
		var view = '#view-submit-answer-round-' + round;

		player.submissionsComplete[message.args.qid] = false;

		$(view).find('form[data-question-id=""]').eq(0).attr('data-question-id', message.args.qid).find('.question').text(message.args.question);
		$('.view').hide().filter(view).show(); // show only the correct view		
	},
	prepareVote: function prepareVote(message) {
		var answers = message.args.answers;
		for (var i in answers) {
			if (i === player.socketId) continue;
			var frag = fragment($('#template-vote').html());
			$(frag).find('.vote').attr('data-player-id', i).text(answers[i]);
			$('#view-submit-vote .submit-vote').append(frag);
		}

		$('.view').hide().filter('#view-submit-vote').show();
	}
};

$('.submit-player').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();
	socket.emit('attempt-registration', { roomKey: form[0].value, name: form[1].value }); // register the player with the server	
});

$('.submit-game-start').on('submit', function (e) {
	e.preventDefault();
	$(this).removeClass('show');

	var message = {
		to: player.roomKey,
		command: 'triggerNextStep'
	};

	socket.emit('relay', message);
});

$('.submit-answer').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();

	var message = {
		from: player.socketId,
		to: player.roomKey,
		command: 'acceptQuestionSubmission',
		args: {
			qid: $(this).attr('data-question-id'),
			answer: form[0].value
		}
	};

	if ($(this).is('.final')) $('.view').hide().filter('#view-lobby').show(); // go back to lobby if this is last question
	else $(this).hide().next().show(); // otherwise show the next question

	player.submissionsComplete[$(this).attr('data-question-id')] = true;
	socket.emit('relay', message);
	$(this).find('input:not(.submit)').val(''); // clear input values for next time
});

$('.submit-vote').on('click', '.submit.vote', function (e) {
	e.preventDefault();
	$(this).siblings('.decision').val($(this).attr('data-player-id'));
	$(this).parent().submit();
});

$('.submit-vote').on('click', '.submit.citation-needed', function (e) {
	e.preventDefault();
	$(this).siblings('.decision').val('[CITATION NEEDED]');
	$(this).parent().submit();
});

$('.submit-vote').on('submit', function (e) {
	e.preventDefault();
	var form = $(this).serializeArray();

	var message = {
		from: player.socketId,
		to: player.roomKey,
		command: 'acceptVoteSubmission',
		args: { vote: form[0].value }
	};

	socket.emit('relay', message);
	$('.view').hide().filter('#view-lobby').show(); // go back to lobby if this is last question
	$('.vote').remove(); // remove the old votes
	$(this).find('input:not(.submit)').val(''); // clear input values for next time
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
