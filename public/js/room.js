let socket;
let room;

socket = io(`http://${location.host}/room`);
socket.on('connect', () => {
	console.log('socket connection established');	
	$('.players, .questions').html('')
})
socket.on('room-registered', r => {
	console.log('room registered with key: %s', r.roomKey);
	room = r; // set local copy of room to remote copy
	$('#view-lobby .key').text(r.roomKey); // display this room's key
})
socket.on('player-registered', player => {
	console.log('new player has connected: %s', JSON.stringify(player));

	room.players[player.socketId] = player; // register this player on the local copy
	addPlayerToPage(player);

	if(Object.keys(room.players).length === room.minPlayers) {
		console.log('display start');
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
		roundHandlers[++room.round.current](); // start round one
	},
	acceptQuestionSubmission: message => {
		room.questions[message.args.qid].submissions[message.from] = message.args.answer;
		room.players[message.from].submissionsComplete[message.args.qid] = true;
		
		$(`.question[data-question-id="${message.args.qid}"]`)
			.find(`.answer[data-player-id="${message.from}"]`)
			.find('.content').text(message.args.answer);

		checkRoundStatus(message);

		// if(allComplete(room.players[message.from])) console.log('%s is finished!', message.from);

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

let roundHandlers = {
	1: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.roundOne; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
		room.questions[q.id] = { article: q.article, submissions: {} };

		addQuestionToPage(q);

		for(let pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
			addAnswerToQuestion(q, room.players[pid]);
		}

		socket.emit('relay', { // relay the question to everyone in the room
			from: room.roomKey, to: room.roomKey, request: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
		})

		startTimer(room.round.timer.limit);

	},
	2: function() {
		$('.questions').html(''); // clear questions
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
			addQuestionToPage(q);
			addAnswerToQuestion(q, room.players[p1]);
			addAnswerToQuestion(q, room.players[p2]);
		}
	},
	3: function() {
		alert('demo is over :)');
	}
}

function startTimer(t) {
	if(t <= 0) console.log('time has round out!'); // do something here which halts progress
	else setTimeout(startTimer.bind(null, --startTimer), 1000);
}

function checkRoundStatus(m){
	let playerDone = true;
	let questionsComplete = true;
	for(let i in room.players[m.from].submissionsComplete) {
		if(!room.players[m.from].submissionsComplete[i]) playerDone = false;
	}
	if(playerDone) { // if the player has finished their questions
		console.log('player (%s) has completed their questions', m.from); // notify the client
		for(let i in room.questions) { // then iterate through the room questions
			for(let j in room.questions[i].submissions) { // making sure they're all done
				if (room.questions[i].submissions[j] === null) questionsComplete = false;
			}
		}		
		if(questionsComplete) { // if all questions are complete
			roundHandlers[++room.round.current](); // start next round
		}
	}	
}

function addPlayerToPage(player) {
	let frag = fragment($('#template-player').html());
	$(frag).find('.player').attr('data-player-id', player.socketId);
	$(frag).find('.player .name').text(player.name);
	$('#view-lobby .players').append(frag);	
}

function addQuestionToPage(question) {
	let frag = fragment($('#template-question').html());
	$(frag).find('.question').attr('data-question-id', question.id);
	$(frag).find('.question .id').text(question.id);
	$(frag).find('.question .answer').text(question.socketId);
	$('#view-lobby .questions').append(frag);	
}

function addAnswerToQuestion(q, player) {
	let frag = fragment($('#template-answer').html());
	$(frag).find('.answer').attr('data-player-id', player.socketId);
	$(frag).find('.answer .player').text(player.name);
	$(frag).find('.answer .content').text('Pending');
	$(`.question[data-question-id="${q.id}"] .answers`).append(frag);
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