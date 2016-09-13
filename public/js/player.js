let socket; 
let player;

socket = io(`http://${location.host}/player`);
socket.on('connect', () => {
	console.log('socket connection established');
})

socket.on('player-registered', p => {
	// console.log('player registered on room with key: %s', rk);
	player = p;	

	$('.display-name span').text(player.name);
	$('.view').hide().filter('#view-lobby').show(); // go to lobby once player registered
})

socket.on('player-refused', () => {
	alert('Unable to join this room, it is probably full.');	
})

socket.on('relay', message => {
	responses[message.request] ? 
		responses[message.request](message) : 
		console.log(`no response handler exists for ${message.request}`);	
})

// response list for server requests

let responses = {
	displayStartButton: message => {
		$('.submit-game-start').addClass('show');
	},
	prepareQuestion: message => {
		// console.log('qid: %s, article: %s ', message.args.qid, message.args.question)
		let round = message.args.round;
		let view = `#view-submit-answer-round-${round}`;

		player.submissionsComplete[message.args.qid] = false;

		$(view).find('.submit-answer[data-question-id=""]').eq(0)
			.attr('data-question-id', message.args.qid)
			.find('.question').text(message.args.question);
		$('.view').hide().filter(view).show(); // show only the correct view
	}
}

$('.submit-player').on('submit', function(e) {
	e.preventDefault();
	let form = $(this).serializeArray();
	socket.emit('attempt-registration', { roomKey: form[0].value, name: form[1].value }); // register the player with the server
})

$('.submit-answer').on('submit', function(e) {
	e.preventDefault();
	let form = $(this).serializeArray();

	let message = { 
		from: player.socketId, 
		to: player.roomKey, 
		request: 'acceptQuestionSubmission', 
		args: { 
			qid: $(this).attr('data-question-id'), 
			answer: form[0].value
		}
	}

	if($(this).is('.final')) $('.view').hide().filter('#view-lobby').show(); // go back to lobby if this is last question
	else $(this).hide().next().show(); // otherwise show the next question
	
	player.submissionsComplete[$(this).attr('data-question-id')] = true;
	socket.emit('relay', message);
})

$('.submit-game-start').on('submit', function(e) {
	e.preventDefault();
	$(this).hide();

	let message = { 
		to: player.roomKey, 
		request: 'startTheGame', 		
	}
	
	socket.emit('relay', message);

})

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}