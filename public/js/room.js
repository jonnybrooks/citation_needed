let socket;
let room;

socket = io(`http://${location.host}/room`);
socket.on('connect', () => {
	// console.log('socket connection established');	
	$('.players, .questions').html('')
})
socket.on('room-registered', r => {
	// console.log('room registered with key: %s', r.roomKey);
	room = r; // set local copy of room to remote copy
	$('#view-lobby .key').text(r.roomKey); // display this room's key
})
socket.on('player-registered', player => {
	// console.log('new player has connected: %s', JSON.stringify(player));

	room.players[player.socketId] = player; // register this player on the local copy
	addPlayerToPage(player);

	if(Object.keys(room.players).length === room.minPlayers) {
		socket.emit('relay', { 
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton'
		})
	}
	
})

socket.on('relay', message => {
	commands[message.command] ? 
		commands[message.command](message) : 
		console.log(`no response handler exists for ${message.command}`);
})

// $('body').hide();

let commands = {
	startTheGame: message => {
		processSequence.next(); // start round one
	},
	acceptQuestionSubmission: message => {
		room.questions[message.args.qid].submissions[message.from] = message.args.answer;
		room.players[message.from].submissionsComplete[message.args.qid] = true;
		
		$(`.question[data-question-id="${message.args.qid}"]`)
			.find(`.answer[data-player-id="${message.from}"]`)
			.find('.content').text(message.args.answer);

		checkQuestionPhaseStatus(message);

	},	
	acceptVoteSubmission: message => {
		room.votes[message.from] = message.args.vote;
		checkVotePhaseStatus(message);
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

let gamePhases = {
	roundOne: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.roundOne; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
		room.questions[q.id] = { question: q.article, submissions: {} };

		addQuestionToPage(q);

		for(let pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
			addAnswerToQuestion(q, room.players[pid]);
		}

		socket.emit('relay', { // relay the question to everyone in the room
			from: room.roomKey, to: room.roomKey, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
		})

		startTimer(room.timer.limit);

	},
	roundTwo: function() {
		console.log('round two');
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
				from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
			})
			socket.emit('relay', {
				from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
			})
			addQuestionToPage(q);
			addAnswerToQuestion(q, room.players[p1]);
			addAnswerToQuestion(q, room.players[p2]);
		}
		startTimer(room.timer.limit);
	},
	voting: function() {
		let qid = Object.keys(room.questions)[0];
		let q = room.questions[qid]; // get question at top of queue

		room.votes[qid] = {};

		if(Object.keys(room.questions).length === 1) {
			for(let i in room.players) {
				room.votes[i] = null; // set every player's vote to null
			}
			socket.emit('relay', { 
				from: room.roomKey, to: room.roomKey, command: 'prepareVote', args: { answers: q.submissions }
			})
		}
		startTimer(room.timer.limit);
	},
	scoring: function(){
		for(let i in room.players) {
			let votes = 0;
			for(let j in room.votes) {
				if(room.votes[j] === i) votes++;
			}
			room.players[i].score += votes * 100;
			console.log("player %s now has a score of: %d points", room.players[i].score);
		}
		processSequence.next();
	},
	clearQuestions: function() {
		// console.log('clearing questions');
		room.questions = {};
		socket.emit('relay', { 
			from: room.roomKey, to: room.roomKey, command: 'displayLobby'
		})
		socket.emit('relay', { 
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton'
		})
	},
	endGame: function() {
		alert('demo is over :)');
	}
}

let processSequence = {
	current: -1,
	steps: [
		gamePhases.roundOne,
		gamePhases.voting,
		gamePhases.scoring,
		gamePhases.clearQuestions,
		// gamePhases.roundTwo,
		// gamePhases.voting,
		//gamePhases.clearQuestions,
		gamePhases.endGame
	],
	next: function(args = {}){
		console.log('moving to process: %s', this.current + 1);
		setTimeout(function(){ this.steps[++this.current](args) }.bind(this), 1100);
	}
}

function startTimer(t) {
	$('.timer').text(t); // set the timer
	if(t === room.timer.limit) {
		room.timer.active = true; // when first called
	}
	if(!room.timer.active) return; // return if tne timer has been cancelled
 	else if(t === 0) {
 		console.log('timeout!');
 		return processSequence.next(); // move to next phase
 	}
	else setTimeout(startTimer.bind(null, --t), 1000); // decrement the timer
}

function checkQuestionPhaseStatus(m){
	let playerDone = true;
	for(let i in room.players[m.from].submissionsComplete) {
		if(!room.players[m.from].submissionsComplete[i]) playerDone = false;
	}
	if(playerDone) { // if the player has finished their questions
		let questionsComplete = true;
		// sconsole.log('player (%s) has completed their questions', m.from); // notify the client
		for(let i in room.questions) { // then iterate through the room questions
			for(let j in room.questions[i].submissions) { // making sure they're all done
				if (room.questions[i].submissions[j] === null) questionsComplete = false;
			}
		}		
		if(questionsComplete) { // if all questions are complete
			room.timer.active = false; // disable the timer
			processSequence.next(); // move to next phase
		}
	}	
}

function checkVotePhaseStatus(m) {
	let votingDone = true;
	for(let i in room.votes) {
		if(room.votes[i] === null) votingDone = false;
	}
	if(votingDone) {
		room.timer.active = false; // disable the timer
		processSequence.next(); // move to next phase
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