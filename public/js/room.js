let socket;
let room;

socket = io(`http://${location.host}/room`);
socket.on('connect', () => {}) // on connect callback
socket.on('room-registered', r => {
	room = r; // set local copy of room to remote copy
	$('#room-key .key').text(r.roomKey); // display this room's key
})
socket.on('player-registered', player => {
	room.players[player.socketId] = player; // register this player on the local copy
	addPlayerToLobby(player); // add this player to the lobby

	if(Object.keys(room.players).length === room.minPlayers) {
		socket.emit('relay', { 
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton' // display the start button on p1
		})
	}	
})

socket.on('relay', message => {
	commands[message.command] ? 
		commands[message.command](message) : 
		console.log(`no response handler exists for ${message.command}`);
})

/*
	commands: object containing functions invoked remotely by a socket request
*/

let commands = {
	triggerNextStep: message => {
		if(room.round === 0) {
			createDummyPlayers(8);
			addPlayersToAnswerPhase();
			generateGameSequence();		
		}
		gameSequence.next();
	},
	acceptQuestionSubmission: message => {
		room.questions[message.args.qid].submissions[message.from] = message.args.answer;
		room.players[message.from].submissionsComplete[message.args.qid] = true;		
		checkAnswerPhaseStatus(message);

	},	
	acceptVoteSubmission: message => {
		room.votes[message.from] = message.args.vote;
		checkVotePhaseStatus(message);
	}	
}

/*
	questionPool: question pool, for use during the testing phase
	will be updated the load from a mongoDB in the future I imagine
*/

let questionPool  = {
	roundOne: [
		{id: 0, excerpt: 'What is your favourite colour?', article: 'Blue, no, green!'},
		{id: 1, excerpt: 'What is your quest?', article: 'I seek the Holy Grail'},
		{id: 2, excerpt: 'What is your name?', article: 'Arthur, King of the Britains'},
		{id: 3, excerpt: 'What is the air speed velocity of a fully laden Swallow?', article: 'An African or a European Swallow?'},
		{id: 4, excerpt: 'None shall pass', article: 'NONE SHALL PASS'},
		{id: 5, excerpt: 'We are the knights who say...', article: 'Nee!'}
	],
	roundTwo: [
		{id: 0, article: 'Blue, no, green!'},
		{id: 1, article: 'I seek the Holy Grail'},
		{id: 2, article: 'Arthur, King of the Britains'},
		{id: 3, article: 'An African or a European Swallow?'},
		{id: 4, article: 'NONE SHALL PASS'},
		{id: 5, article: 'Nee!'}
	],
	roundThree: [
		{id: 0, article: 'Blue, no, green!'},
		{id: 1, article: 'I seek the Holy Grail'},
		{id: 2, article: 'Arthur, King of the Britains'},
		{id: 3, article: 'An African or a European Swallow?'},
		{id: 4, article: 'NONE SHALL PASS'},
		{id: 5, article: 'Nee!'}
	]
}

/*
	gamePhases: phases of the games which act as elements in the game sequence steps[]
*/

let gamePhases = {
	lobby: function(){
		$('.host').attr('href', `${location.host}/player`).find('span').text(`${location.host}/player`);
		/*
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
				$('#view-lobby .typed-cursor').addClass('hide');
				$('#view-lobby .type-wrapper').addClass('slide-left');
				$('#view-lobby .player').addClass('show');
				waitOnAudio('../speech/001-title.mp3', 1500);
				// temp
				setTimeout(() => $('.player').addClass('joined'), 2000);
				setTimeout(commands.triggerNextStep, 3000);
				// end temp
			}
		})
		*/		
		
		// temp
		$('.typed').text('60% of the time it works <em>every</em> time.');
		$('#view-lobby .typed-cursor').addClass('hide');
		$('#view-lobby .type-wrapper').addClass('slide-left');
		$('#view-lobby .player').addClass('show');
		//waitOnAudio('../speech/001-title.mp3', 1500);

		setTimeout(() => $('.player').addClass('joined'), 5000);
		setTimeout(commands.triggerNextStep, 2000);		
		// end temp		
	},
	describeRound: function(round) {
		if(round === 1){
			$('#view-lobby .player').each(function(){
				// if ($(this).attr('data-player-id') === "") $(this).removeClass('show'); // hide the empty player slots
			})
			waitOnAudio('../speech/002-intro.mp3')
			.then(e => waitOnAudio('../speech/003-round1-intro.mp3'))
			.then(e => $('#view-container').attr('data-current-view', `describe-round-${round}`))
			.then(e => $('.description li').eq(0).addClass('show'))
			.then(e => waitOnAudio('../speech/004-round1-desc.mp3', 1000))				
			.then(e => $('.description li').eq(1).addClass('show'))
			.then(e => waitOnAudio('../speech/005-round1-desc.mp3'))				
			.then(e => $('.description li').eq(2).addClass('show'))
			.then(e => waitOnAudio('../speech/006-round1-desc.mp3'))				
			.then(e => $('.description li').eq(3).addClass('show'))
			.then(e => waitOnAudio('../speech/007-round1-desc.mp3'))				
			.then(e => $('.description li').eq(4).addClass('show'))
			.then(e => waitOnAudio('../speech/008-round1-desc.mp3'))				
			.then(e => $('.description li').eq(5).addClass('show'))
			.then(e => waitOnAudio('../speech/009-round1-desc.mp3'))				
			.then(e => $('.description li').eq(6).addClass('show'))	
			.then(e => gameSequence.next())
		}		
	},
	roundOne: function() {

		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.roundOne; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random

		room.questions[q.id] = { question: q.excerpt, submissions: {} };
		room.round = 1;

		$('#view-answer-phase .question').text(q.excerpt);
		room.questions[q.id].submissions[room.roomKey] = q.article;

		for(let pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
		}

		$('#view-container').attr('data-current-view', `answer-phase`); // show the question
		$('#view-answer-phase .question-anchor').addClass('reveal');

		setTimeout(() => {		
			$('#view-answer-phase .question-anchor').addClass('tuck');			
			// temp
			$(`#view-answer-phase .player`).addClass('answered'); // show player as answered in lobby
			// end temp			
			socket.emit('relay', { // relay the question to everyone in the room
				from: room.roomKey, to: room.roomKey, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
			})
			room.timer.limit = 5; // set the time limit to 60 seconds
			startTimer(room.timer.limit);
		}, 5000);
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

			// temp
			//q = {excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare arcu vel risus interdum mattis. Aliquam semper neque quis maximus efficitur. Sed eget aliquam est, ut aliquam erat.", submissions: {}}
			let subs = ["Archipelago", "Dances with Wolves (film)", "Acid reflux", "Quantum Leap", "Gone with the wind", "OMG (Abbreviation)", "Christmas", "Expanding magazine file", "Minced oath"]
			let sub_i = 0;
			let p1 = null;			
			//end temp

			for(let pid in room.players) {
				room.votes[pid] = null; // set every player's vote to null

				// temp
				p1 = p1 === null ? pid : p1;
				q.submissions[pid] = subs[sub_i++];
				room.votes[pid] = p1;
				//room.votes[pid] = pid;
				// end temp
			}

			addAnswersToVotingPhase(q.submissions);

			// temp			
			addVotesToVotingPhase(room.votes);			
			// end temp

			$('#view-voting-phase .question').text(q.question);
			$('#view-container').attr('data-current-view', `voting-phase`);

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
		room.timer.limit = 3; // set the time limit to 30 seconds
		startTimer(room.timer.limit);
	},
	scoring: function(){
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		//let r3Player = room.players[Object.keys(room.questions[qid].submissions)[0]];
		//let citations = 0;

		if(room.round === 1) {
			let correctAnswer = `.answer[data-player-id="${room.roomKey}"]`;
			let scoringAnswers = $('.answer[data-will-score]').not(correctAnswer); // get all scoring answers that aren't correct
			let sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array
			sequence.push($(correctAnswer)[0]); //  and push the correct one to the end of the sequence
			revealVotesSequentially(sequence); // then reveal them in order
		}

		/*
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
		for(let i in room.players) {
			$('.questions').append(`<div><p> player ${room.players[i].name} now has a score of: ${room.players[i].score} points </p></div>`);
		}
		*/
		delete room.questions[qid]; // delete question in the final position
		room.votes = {}; // clear the votes		
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
		$('#view-container').attr('data-current-view', 'endgame');

		/*
		let max = -99999;
		let winners = [];
		for(let i in room.players) {
			max = room.players[i].score > max ? room.players[i].score : max;
		}
		for(let i in room.players) {
			if(room.players[i].score >= max) winners.push(room.players[i].name);
		}
		console.log(`Players ${winners.join(' and ')} are victorious!`);
		*/
	}
}

gamePhases.lobby();

/*
	gameSequence: the game sequence object represents the discrete steps that make up the game
*/

let gameSequence = {
	current: -1,
	steps: [],
	next: function(args = {}){
		setTimeout(function(){ gameSequence.steps[++gameSequence.current](args) }.bind(gameSequence), 1100);
	}
}

/*
	generateGameSequence: called when the game is initialised
	established how many voting/scoring phases are necessary, based on the number of players
	and pushes these steps to the gameSequence steps[]
*/

function generateGameSequence() {
	// gameSequence.steps.push(gamePhases.describeRound.bind(null, 1));
	gameSequence.steps.push(gamePhases.roundOne);
	gameSequence.steps.push(gamePhases.voting);
	gameSequence.steps.push(gamePhases.scoring);
	/*
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
	*/
	gameSequence.steps.push(gamePhases.endGame);
}

/*
	startTimer: starts the timer and initiates/finishes the circular timer
*/

function startTimer(t) {
	$('.countdown .timer').text(t); // set the timer
	if(t === room.timer.limit) {
		drawCountdown(); // start filling the countdown timer
		room.timer.active = true; // when first called
	}
	if(!room.timer.active) return; // return if tne timer has been cancelled
 	else if(t === 0) {
 		drawCountdown(true); // finish the timer
 		return wait(1000).then(gameSequence.next);
 	}
	else setTimeout(startTimer.bind(null, --t), 1000); // decrement the timer
}

/*
	checkAnswerPhaseStatus: check the status of the answer phase (called whenever a player submits an answer)		
*/

function checkAnswerPhaseStatus(m){
	let playerDone = true;
	for(let i in room.players[m.from].submissionsComplete) {
		if(!room.players[m.from].submissionsComplete[i]) playerDone = false;
	}
	if(playerDone) { // if the player has finished their questions
		let questionsComplete = true;
		$(`#view-answer-phase .player[data-player-id="${m.from}"]`).addClass('answered'); // show player as answered in lobby 
		for(let i in room.questions) { // then iterate through the room questions
			for(let j in room.questions[i].submissions) { // making sure they're all done
				if (room.questions[i].submissions[j] === null) questionsComplete = false;
			}
		}		
		if(questionsComplete) { // if all questions are complete
			room.timer.active = false; // disable the timer
			drawCountdown(true); // finish the countdown
			gameSequence.next(); // proceed to next step
		}
	}	
}

/*
	checkVotePhaseStatus: check the status of the voting phase (called whenever a player submits a vote)
*/

function checkVotePhaseStatus(m) {
	let votingDone = true;
	for(let i in room.votes) {
		if(room.votes[i] === null) votingDone = false;
	}
	if(votingDone) {
		addVotesToVotingPhase(room.votes); // add the votes to the view
		room.timer.active = false; // disable the timer
		drawCountdown(true); // finish the countdown
		gameSequence.next(); // proceed to next step
	}
}

/*
	addPlayerToLobby: creates a player fragment and adds it to the lobby view
*/

function addPlayerToLobby(player) {
	let p = $('div[data-player-id=""]').eq(0);
	$(p).attr('data-player-id', player.socketId);
	$(p).find('.name').text(player.name);
	$(p).addClass('joined');
}

/*
	addPlayersToAnswer: creates a player fragment and adds it to the answer phase view
*/

function addPlayersToAnswerPhase() {
	for(let p in room.players) {
		let frag = fragment($('#template-player').html());
		$(frag).find('.player').attr('data-player-id', room.players[p].socketId);
		$(frag).find('.player .name').text(room.players[p].name);		
		$('#view-answer-phase .players').append(frag);	
	}	
}

/*
	shuffle: randomise and array
*/

function addQuestionToPage(question) {
	let frag = fragment($('#template-question').html());
	$(frag).find('.question').attr('data-question-id', question.id);
	$(frag).find('.question .id').text(question.id);
	$(frag).find('.question .answer').text(question.socketId);
	$('#view-lobby .questions').append(frag);	
}

/*
	addAnswerToQuestion: legacy
*/

function addAnswerToQuestion(q, player) {
	let frag = fragment($('#template-answer').html());
	$(frag).find('.answer').attr('data-player-id', player.socketId);
	$(frag).find('.answer .player').text(player.name);
	$(frag).find('.answer .content').text('Pending');
	$(`#view-lobby .question[data-question-id="${q.id}"] .answers`).append(frag);
}

/*
	addAnswersToVotingPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addAnswersToVotingPhase(submissions) {
	let randomKeys = shuffle(Object.keys(submissions));
	for(let i = 0; i < randomKeys.length; i++){
		let frag = fragment($('#template-answer').html());
		let pid = randomKeys[i];
		$(frag).find('.answer').attr('data-player-id', pid);
		$(frag).find('.answer .content').text(submissions[pid]);
		$(`#view-voting-phase .answers`).append(frag);
	}
}

/*
	addVotesToVotingPhase: add the votes sequentially to their respective answers in the voting phase view
	they are hidden by default, and revealed by the reveal votes function	
*/

function addVotesToVotingPhase(votes) {
	for(let pid in votes) {
		let frag = fragment($('#template-vote').html());
		$(frag).find('.vote').attr('data-player-id', pid);
		$(frag).find('.vote').addClass(`player-${room.players[pid].number}-bg`);
		// $(frag).find('.vote .name').text(room.players[pid].name);
		// temp
		$(frag).find('.vote .name').text("");
		// end temp
		$(`.answer[data-player-id="${votes[pid]}"]`).attr('data-will-score', 'true').find('.votes').append(frag);
	}	
}

/*
	revealVotesSequentially: uses a promise reduction sequence to reveal the votes whilst preserving it's
	asynchronous behaviour. calls the next step in the game sequence once it's finished	
*/

function revealVotesSequentially (answers){
	answers.reduce((p, answer) => {
		return p.then(() => revealVote(answer));		
	}, Promise.resolve())
	.then(gameSequence.next);
}

/*
	revealVote: helper function for revealing the votes in sequence, with... dramatic pauses
*/

function revealVote(answer){
	return new Promise((resolve, reject) => {
		$('.answer').removeClass('fade');
		$('.answer').not(answer).addClass('fade');
		wait(2000).then(() => {
			$(answer).find('.vote').each(function(i){
				setTimeout(() => {
					let score = $(answer).find('.vote').length;
					$(answer).find('.score .sign').text(score >= 0 ? '+' : '-');
					$(answer).find('.score .amount').text(score * 100);
					$(this).addClass('reveal');
					TweenLite.to(answer, 0.2, { y: "-=10px", ease: Power3.easeOut });
				}, i * 200);
			})
		})
		.then(() => {
			let delay = ($(answer).find('.vote').length * 200) + 2000;
			wait(delay).then(() => {
				let tl = new TimelineMax();
				tl.to(answer, 0.6, { y: 0, ease: Power4.easeInOut })
				  .to($(answer).find('.score'), 2, { y: "-=200px", ease: Power3.easeOut }, "-=0.6")
				  .to($(answer).find('.score'), 0.5, { opacity: 1, ease: Power3.easeIn}, "-=2")
				  .to($(answer).find('.score'), 1, { opacity: 0, ease: Power3.easeOut, onComplete: resolve }, "-=0.5")
			})
		})
	})
}

/*
	createDummyPlayers: create dummy players for fast forwarding through the connection process
	for testing
*/

function createDummyPlayers(amount) {
	for (let i = 0; i < amount; i++) {
		let id = Math.random();
		room.players[id] = new Player({
			socketId: id,
			roomKey: room.roomKey,
			name: `Player ${i}`,
			number: Object.keys(room.players).length + 1
		});
	}	
}

/*
	drawCountdown: draws the circular clock timer thingy, with an optional argument to draw the
	end frames if all submissions are recieved before timeout
*/

function drawCountdown(end) {
	let countdown = `#view-${$('#view-container').attr('data-current-view')} .countdown`;
	if(!end) return TweenLite.to(`${countdown} .circle`, room.timer.limit, { strokeDashoffset: 0, ease: Linear.easeNone });
	var tl = new TimelineMax();
	tl.to(`${countdown} .circle`, 1, { strokeDashoffset: 0, ease: Power4.easeInOut })
	  .to(`${countdown} .timer`, 0.3, { opacity: 0, ease: Power2.easeOut }, '-=0.5')
  	  .to(`${countdown} .circle`, 0.8, { transformOrigin: '50% 50%', scale: 0.7, ease: Back.easeInOut.config(1.3) })
      .to(`${countdown} .circle`, 0.3, { fillOpacity: 1, stroke: '#f00', ease: Power2.easeOut }, '-=0.3')      
      .to(`${countdown} .white-box`, 0.3, { fillOpacity: 1, ease: Power2.easeOut }, '-=0.3')
    .from(`${countdown} .white-box`, 0.3, { x: 100, ease: Power4.easeInOut }, '-=0.4')
}

/*
	fragment: creates a document fragment for appending to the DOM
*/

function fragment(htmlStr) {
	let frag = document.createDocumentFragment();
	let temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}

/*
	shuffle: randomise and array
*/

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

/*
	waitOnAudio: wait for the audio clip to finish before continuing
*/

function waitOnAudio(path, delay = 0, immediate = false) {
	return new Promise(function(resolve, reject){
		var audio = new Audio(path);
		$(audio).on('ended', resolve);
		setTimeout(e => audio.play(), delay);
		if(immediate) resolve();		
	});
}

/*
	wait: wait for "delay" seconds before continuing with the next thenable
*/

function wait(delay) {
	return new Promise(function(resolve, reject){
		setTimeout(resolve, delay);		
	});
}

/*
	Player: the player class, necessary for creating dummy players in testing
*/

function Player(conf) {	
	this.socketId = conf.socketId;
	this.roomKey = conf.roomKey;
	this.name = conf.name;
	this.number = conf.number;
	this.score = 0;
	this.submissionsComplete = {};	
}