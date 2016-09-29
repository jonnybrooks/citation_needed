let socket;
let room;

socket = io(`http://${location.host}/room`);
socket.on('connect', () => {
	// console.log('socket connection established');	
	// $('.players, .questions').html('')
})
socket.on('room-registered', r => {
	// console.log('room registered with key: %s', r.roomKey);
	room = r; // set local copy of room to remote copy
	$('#room-key .key').text(r.roomKey); // display this room's key
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

let commands = {
	triggerNextStep: message => {
		if(room.round === 0) generateGameSequence();
		$('.questions').html(''); // clear questions
		gameSequence.next();
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
		{id: 0, excerpt: 'roundOne 0', article: 'computer0'},
		{id: 1, excerpt: 'roundOne 1', article: 'computer1'},
		{id: 2, excerpt: 'roundOne 2', article: 'computer2'},
		{id: 3, excerpt: 'roundOne 3', article: 'computer3'},
		{id: 4, excerpt: 'roundOne 4', article: 'computer4'},
		{id: 5, excerpt: 'roundOne 5', article: 'computer5'}
	],
	roundTwo: [
		{id: 0, article: 'roundTwo 0'},
		{id: 1, article: 'roundTwo 1'},
		{id: 2, article: 'roundTwo 2'},
		{id: 3, article: 'roundTwo 3'},
		{id: 4, article: 'roundTwo 4'},
		{id: 5, article: 'roundTwo 5'}
	],
	roundThree: [
		{id: 0, article: 'roundThree 0'},
		{id: 1, article: 'roundThree 1'},
		{id: 2, article: 'roundThree 2'},
		{id: 3, article: 'roundThree 3'},
		{id: 4, article: 'roundThree 4'},
		{id: 5, article: 'roundThree 5'}
	]
}

let gamePhases = {
	lobby: function(){
		$('.host').attr('href', `${location.host}/player`).find('span').text(`${location.host}/player`);
		$('.typed').typed({			
			strings: [
				"The <a>English</a> have terrible teeth due to bad parenting.", 
				"<a>Wasps</a> are in fact just angry little <a>Bees</a>.",
				"60% of the time it works <em>every</em> time."
			],
			typeSpeed: 0,
			backSpeed: -200,
			backDelay: 2000,
			callback: function() {
				$('.typed-cursor').addClass('hide');
				$('.type-wrapper').addClass('slide-left');
				$('.player').addClass('show');
				setTimeout(function(){
					var audio = new Audio('../speech/001-title.mp3');
					audio.play();
				}, 1500);
				setTimeout(function(){
					$('.player').addClass('joined');
				}, 3000);
			}
		})
	},
	roundOne: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.roundOne; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
		
		room.questions[q.id] = { question: q.excerpt, submissions: {} };
		room.round = 1;

		addQuestionToPage(q);

		room.questions[q.id].submissions[room.roomKey] = q.article;

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
		let players = shuffle(Object.keys(room.players)); // get player ids and randomize
		let questions = questionPool.roundTwo; // get this rounds question pool
		room.round = 2;
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
	roundThree: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.roundThree; // get this rounds question pool
		room.round = 3;

		for(let pid in room.players) {
			let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random		
			room.questions[q.id] = { question: q.article, submissions: {} };
			addQuestionToPage(q);

			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
			addAnswerToQuestion(q, room.players[pid]);

			socket.emit('relay', { // relay the question to everyone in the room
				from: room.roomKey, to: pid, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 3 }
			})
		}
		startTimer(room.timer.limit);
	},
	voting: function() {
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		let q = room.questions[qid]; // get question in the final position

		if(room.round === 1) {
			for(let i in room.players) {
				room.votes[i] = null; // set every player's vote to null
			}
			socket.emit('relay', { 
				from: room.roomKey, to: room.roomKey, command: 'prepareVote', args: { answers: q.submissions }
			})
		}
		else if(room.round === 2) {
			for(let i in room.players) {
				let send = true;
				for(let j in q.submissions) {
					if(i === j) send = false;
				}
				if(send) {
					room.votes[i] = null; // set every player's vote to null
					socket.emit('relay', { 
						from: room.roomKey, to: i, command: 'prepareVote', args: { answers: q.submissions }
					})
				}
			}
		}
		else if(room.round === 3) {
			let pid = Object.keys(q.submissions)[0];
			for(let i in room.players) {
				if(pid === i) continue;
				room.votes[i] = null; // set every player's vote to null
				socket.emit('relay', { 
					from: room.roomKey, 
					to: i, 
					command: 'prepareQuestion', 
					args: { qid: q.id, question: q.submissions[pid], round: '3-vote' }
				})				
			}			
		}
		startTimer(room.timer.limit);
	},
	scoring: function(){
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		let r3Player = room.players[Object.keys(room.questions[qid].submissions)[0]];
		let citations = 0;
		for(let i in room.votes) {
			if(room.round === 3 && room.votes[i] === "[CITATION NEEDED]") citations++;
			else {
				if(room.votes[i] === room.roomKey) room.players[i].score += 100;
				if(room.players[room.votes[i]]) room.players[room.votes[i]].score += 100;	
			}
		}
		if(room.round === 3){
			if(citations >= Math.ceil(Object.keys(room.votes).length / 2)) {
				r3Player.score -= 100;
			}
			else {
				citations = 0;
				for(let i in room.votes) {
					if(room.votes[i] !== room.questions[qid].question) continue;
					room.players[i].score += 50;
					citations++;
				}
				r3Player.score += 50 * (citations === 0 ? 0 : citations < Object.keys(room.votes).length ? 1 : 2);
			}
		}
		$('.questions').html('');
		for(let i in room.players) {
			$('.questions').append(`<div><p> player ${room.players[i].name} now has a score of: ${room.players[i].score} points </p></div>`);
		}
		delete room.questions[qid]; // delete question in the final position
		room.votes = {}; // clear the votes
		gameSequence.next();
	},
	sendTriggerPrompt: function() {
		socket.emit('relay', { 
			from: room.roomKey, to: room.roomKey, command: 'displayLobby'
		})
		socket.emit('relay', { 
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton'
		})
	},
	endGame: function() {
		let max = -99999;
		let winners = [];
		for(let i in room.players) {
			max = room.players[i].score > max ? room.players[i].score : max;
		}
		for(let i in room.players) {
			if(room.players[i].score >= max) winners.push(room.players[i].name);
		}
		$('.questions').html(`Players ${winners.join(' and ')} are victorious!`);
	}
}

gamePhases.lobby();

let gameSequence = {
	current: -1,
	steps: [],
	next: function(args = {}){
		// console.log('moving to process: %s', this.current + 1);
		setTimeout(function(){ this.steps[++this.current](args) }.bind(this), 1100);
	}
}

function generateGameSequence() {
	gameSequence.steps.push(gamePhases.roundOne);
	gameSequence.steps.push(gamePhases.voting);
	gameSequence.steps.push(gamePhases.scoring);
	gameSequence.steps.push(gamePhases.sendTriggerPrompt);
	gameSequence.steps.push(gamePhases.roundTwo);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);
		gameSequence.steps.push(gamePhases.scoring);
	}	
	gameSequence.steps.push(gamePhases.sendTriggerPrompt);
	gameSequence.steps.push(gamePhases.roundThree);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);		
		gameSequence.steps.push(gamePhases.scoring);
	}
	gameSequence.steps.push(gamePhases.endGame);
}

function startTimer(t) {
	$('.timer').text(t); // set the timer
	if(t === room.timer.limit) {
		room.timer.active = true; // when first called
	}
	if(!room.timer.active) return; // return if tne timer has been cancelled
 	else if(t === 0) {
 		// console.log('timeout!');
 		return gameSequence.next(); // move to next phase
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
			gameSequence.next(); // move to next phase
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
		gameSequence.next(); // move to next phase
	}
}

function addPlayerToPage(player) {
	let p = $('div[data-player-id=" "]').eq(0);
	$(p).attr('data-player-id', player.socketId);
	$(p).find('.name').text(player.name);
	$(p).addClass('joined');
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