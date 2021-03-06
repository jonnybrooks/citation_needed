let socket;
let room;

socket = io(`http://${location.host}/room`);
socket.on('connect', () => {}) // on connect callback
socket.on('room-registered', r => {
	room = r; // set local copy of room to remote copy
	$('#room-key .key').text(r.roomKey); // display this room's key
	gamePhases.lobby();
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
	gamePhases: phases of the games which act as elements in the game sequence steps[]
*/

let gamePhases = {
	lobby: function(){
		$('.host')
			.attr('href', `${location.host}/player`)
			.find('span').text(`${location.host}/player`); // set the host link text for the players
		oneShotSfx("keyboard-mashing.mp3"); // play the keyboard sound
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
				waitOnSpeech('citation-needed', 1500);
				getQuestionPool()
					.then(qp => room.questionPool = qp)
					.catch(error => {
						alert("Sorry, there appears to have been an error retrieving the questions!\n"
							+ "Please reload the page and try again.");					
						throw new Error(`Server responded with: ${error}`);
					})
			}
		})
	},
	describeRound: function(round) {
		if(round === 1) {
			waitOnSpeech('welcome')
			.then(() => waitOnSpeech('pre-round1'))
			.then(() => changeToView(`describe-round-${round}`))
			.then(() => _revealNextInstruction(0))
			.then(() => waitOnSpeech('guessed-appearance-desc-1', 1000))
			.then(() => _revealNextInstruction(1))
			.then(() => waitOnSpeech('guessed-appearance-desc-2'))
			.then(() => _revealNextInstruction(2))
			.then(() => waitOnSpeech('guessed-appearance-desc-3'))
			.then(() => _revealNextInstruction(3))
			.then(() => waitOnSpeech('guessed-appearance-desc-4'))
			.then(() => _revealNextInstruction(4))
			.then(() => waitOnSpeech('guessed-appearance-desc-5'))
			.then(() => _revealNextInstruction(5))
			.then(() => waitOnSpeech('guessed-appearance-desc-6'))
			.then(() => _revealNextInstruction(6))
			.then(gameSequence.next)
		}
		else if(round === 2) {
			waitOnSpeech('pre-round2')
			.then(() => changeToView(`describe-round-${round}`))
			.then(() => _revealNextInstruction(0))
			.then(() => waitOnSpeech('excerpt-opinions-desc-1', 1000))
			.then(() => _revealNextInstruction(1))
			.then(() => waitOnSpeech('excerpt-opinions-desc-2'))
			.then(() => _revealNextInstruction(2))
			.then(() => waitOnSpeech('excerpt-opinions-desc-3'))
			.then(() => _revealNextInstruction(3))
			.then(() => waitOnSpeech('excerpt-opinions-desc-4'))
			.then(() => _revealNextInstruction(4))
			.then(() => waitOnSpeech('excerpt-opinions-desc-5'))
			.then(() => _revealNextInstruction(5))
			.then(() => waitOnSpeech('excerpt-opinions-desc-6'))
			.then(() => _revealNextInstruction(6))
			.then(gameSequence.next)
		}	
		else if(round === 3) {
			waitOnSpeech('pre-round3')
			.then(() => changeToView(`describe-round-${round}`))
			.then(() => _revealNextInstruction(0))
			.then(() => waitOnSpeech('you-complete-me-desc-1', 1000))
			.then(() => _revealNextInstruction(1))
			.then(() => waitOnSpeech('you-complete-me-desc-2'), 500)
			.then(() => _revealNextInstruction(2))
			.then(() => waitOnSpeech('you-complete-me-desc-3'), 500)
			.then(() => _revealNextInstruction(3))
			.then(() => waitOnSpeech('you-complete-me-desc-4'), 500)
			.then(() => _revealNextInstruction(4))
			.then(() => waitOnSpeech('you-complete-me-desc-5'), 500)
			.then(() => _revealNextInstruction(5))
			.then(() => waitOnSpeech('you-complete-me-desc-6'), 500)
			.then(() => _revealNextInstruction(6))
			.then(gameSequence.next)
		}
		function _revealNextInstruction(index){
			oneShotSfx("swoop-in.mp3", 500); // play swoop sound
			$(`#view-describe-round-${round} li`).eq(index).addClass('show');
		}			
	},
	guessTheArticle: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = room.questionPool.guessTheArticle; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random

		room.questions[q.id] = { question: q.excerpt, submissions: {} };
		room.round = 1;

		room.questions[q.id].submissions[room.roomKey] = q.article;

		for(let pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
		}

		addContentToAnswerPhase(q.excerpt) // add content to view, setting the question to the excerpt
		.then(() => changeToView(`answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => {
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
		})
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');	
			socket.emit('relay', { // relay the question to everyone in the room
				from: room.roomKey, to: room.roomKey, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
			})
			room.timer.limit = 60;
			startTimer(room.timer.limit)
				.then(() => waitOnSpeech("guessed-appearance-end", 1000))
		})
	},
	excerptBattle: function() {
		let players = shuffle(Object.keys(room.players)); // get player ids and randomize
		let questions = room.questionPool.excerptBattle; // get this rounds question pool
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

			wait(5000).then(() => {
				socket.emit('relay', {
					from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				})
				socket.emit('relay', {
					from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				})	
			})
		}

		addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
		.then(() => changeToView(`answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => {
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
		})
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');
			room.timer.limit = 90; // set the time limit to 60 seconds
			startTimer(room.timer.limit)
				.then(() => waitOnSpeech("excerpt-opinions-end", 1000))
		})
	},	
	editBattle: function() {
		let players = shuffle(Object.keys(room.players)); // get player ids and randomize
		let questions = room.questionPool.editBattle; // get this rounds question pool
		room.round = 3;

		for(let i = 0; i < players.length; i++) {
			let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
			let p1 = players[i];
			let p2 = players[i+1] || players[0];
			room.questions[q.id] = { question: q.excerpt, submissions: {} };
			room.questions[q.id].submissions[p1] = null;
			room.questions[q.id].submissions[p2] = null;
			room.players[p1].submissionsComplete[q.id] = false;
			room.players[p1].submissionsComplete[q.id] = false;

			wait(5000).then(() => {
				socket.emit('relay', {
					from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 3 }
				})
				socket.emit('relay', {
					from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 3 }
				})	
			})
		}

		addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
		.then(() => changeToView(`answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => {
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
		}) // update the view
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');
			room.timer.limit = 90; // set the time limit to 90 seconds
			startTimer(room.timer.limit)
				.then(() => waitOnSpeech("you-complete-me-end", 1000))
		})
	},
	voting: function() {
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		let q = room.questions[qid]; // get question in the final position
		if(room.round === 1) {
			for(let pid in room.players) {
				room.votes[pid] = null; // set every player's vote to null
			}
			addContentToVotingPhase(q);
			changeToView(`voting-phase`);
			socket.emit('relay', { 
				from: room.roomKey, to: room.roomKey, command: 'prepareVote', args: { answers: q.submissions }
			})
		}
		else if(room.round === 2 || room.round === 3) {
			for(let pid in room.players) {
				let send = true;
				for(let subpid in q.submissions) {
					if(pid === subpid) send = false;
				}
				if(send) {
					room.votes[pid] = null; // set every player's vote to null
					socket.emit('relay', { 
						from: room.roomKey, to: pid, command: 'prepareVote', args: { answers: q.submissions }
					})
				}
			}
			addContentToVotingPhase(q)
			.then(() => changeToView(`voting-phase`))
		}
		room.timer.limit = 30;
		startTimer(room.timer.limit)
	},
	scoring: function(){
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		let r3Player = room.players[Object.keys(room.questions[qid].submissions)[0]];
		let citations = 0;

		if(room.round === 1) {
			let correctAnswer = `.answer[data-player-id="${room.roomKey}"]`;
			let scoringAnswers = $('.answer[data-will-score]').not(correctAnswer); // get all scoring answers that aren't correct
			let sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array
			sequence.push($(correctAnswer)[0]); //  and push the correct one to the end of the sequence
			revealVotesSequentially(sequence).then(gameSequence.next) // then reveal them in order			
		}
		if(room.round === 2 || room.round === 3) {
			let scoringAnswers = $('.answer[data-will-score]'); // get all scoring answers that aren't correct
			let sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array			
			revealVotesSequentially(sequence).then(gameSequence.next) // then reveal them in order
		}

		for(let pid in room.players) {
			room.players[pid].previousScore = room.players[pid].score; // set all the previous scores
		}
		
		for(let i in room.votes) {
			if(room.votes[i] === room.roomKey) room.players[i].score += 100; // score for correct answers
			if(room.players[room.votes[i]]) room.players[room.votes[i]].score += 100; // and for votes on players
		}
		delete room.questions[qid]; // delete question in the final position
		room.votes = {}; // clear the votes		
	},
	leaderboard: function() {
		addPlayersToLeaderboard(room.players);
		changeToView('leaderboard');
		updateLeaderboard()
			.then(() => wait(1000))
			.then(gameSequence.next);
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
		let max = 0;
		let winners = [];		
		for(var pid in room.players) {
			if(room.players[pid].score > max) {
				max = room.players[pid].score;
				winners.length = 0;
				winners.push(pid);
			} else if(room.players[pid].score == max) {
				winners.push(pid);
			}
		}
		let backdrop = $(`#view-leaderboard .player[data-player-id="${winners[0]}"]`);
		let frag = fragment(backdrop[0].outerHTML);		
		let tmln = new TimelineMax();

		let winningPlayers = winners.map(winner => room.players[winner].name).join(' and ');

		$('#view-leaderboard .winning-player').text(`${winningPlayers} win${winners.length > 1 ? "" : "s"}!`);
		$(frag).find('.content-wrapper').remove();		
		$(frag).find('.player')
			.addClass('backdrop')
			.css({ position: 'fixed', transform: 'none', top: backdrop.offset().top, left: backdrop.offset().left, right: 'auto', bottom: 'auto', zIndex: 100, margin: 0 })
			.appendTo('#view-leaderboard');

		tmln.to('#view-leaderboard .backdrop', 0.5, { top: 0, right: 0, bottom: 0, left: 0, width: $(window).width(), height: $(window).width(), borderRadius: 0, ease: Power4.easeInOut })
			.set('#view-leaderboard .backdrop', { width: 'auto', height: 'auto' })		
			.to('#view-leaderboard .winning-player', 
				0.8, 
				{ top: '40%', ease: Power4.easeInOut, onStart: oneShotSfx, onStartParams: ["endgame-muzak.mp3", "250"] })
	},
	todo: function() {
		changeToView('todo');
	}
}

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
	establishes how many voting & scoring phases are necessary (based on the number of players)
	and pushes these steps to the gameSequence steps[] array
*/

function generateGameSequence() {
	gameSequence.steps.push(gamePhases.describeRound.bind(null, 1));
	gameSequence.steps.push(gamePhases.guessTheArticle);
	gameSequence.steps.push(gamePhases.voting);
	gameSequence.steps.push(gamePhases.scoring);
	gameSequence.steps.push(gamePhases.leaderboard);
	gameSequence.steps.push(gamePhases.describeRound.bind(null, 2));	
	gameSequence.steps.push(gamePhases.excerptBattle);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);
		gameSequence.steps.push(gamePhases.scoring);
	}	
	gameSequence.steps.push(gamePhases.leaderboard);
	gameSequence.steps.push(gamePhases.describeRound.bind(null, 3));
	gameSequence.steps.push(gamePhases.editBattle);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);		
		gameSequence.steps.push(gamePhases.scoring);
	}	
	gameSequence.steps.push(gamePhases.leaderboard);			
	gameSequence.steps.push(gamePhases.endGame);
	gameSequence.steps.push(gamePhases.todo);
}

/*
	startTimer: starts the timer and initiates/finishes the circular timer
*/
function startTimer(time) {
	return new Promise((resolve, reject) => {
		function _recurse(t) {
			$('.countdown .timer').text(t); // set the timer
			if(t === room.timer.limit) {
				drawCountdown(); // start filling the countdown timer
				room.timer.active = true; // when first called
			}
			if(!room.timer.active) {
				return resolve(); // return if tne timer has been cancelled
			}
		 	else if(t === 0) {
		 		drawCountdown(true) // finish the countdown
					.then(resolve); // proceed to next step // finish the timer
		 		return;
		 	}
			else setTimeout(_recurse.bind(null, --t), 1000); // decrement the timer
		}
		_recurse(time);
	})
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
			drawCountdown(true) // finish the countdown
				.then(gameSequence.next); // proceed to next step
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
		drawCountdown(true) // finish the countdown
			.then(gameSequence.next); // proceed to next step
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
	oneShotSfx("new-player-jingle.mp3", 1250);
}

/*
	addContentToAnswerPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToAnswerPhase(question, phoneVisible) {	
	return new Promise((resolve, reject) => {
		let vcFrag = fragment($('#template-answer-phase-content').html());
		if(phoneVisible) $(vcFrag).find('.answer-phase-content').addClass('phone-visible');
		$(vcFrag).find('.answer-phase-content .question').html(question);
		for(let pid in room.players) {
			let pFrag = fragment($('#template-player').html());
			$(pFrag).find('.player').attr('data-player-id', pid);
			$(pFrag).find('.player .name').text(room.players[pid].name);
			$(vcFrag).find('.players').append(pFrag);
		}
		$('#view-answer-phase').html(vcFrag);
		resolve();
	})	
}

/*
	addContentToVotingPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToVotingPhase(q) {
	return new Promise((resolve, reject) => {
		let randomKeys = shuffle(Object.keys(q.submissions));
		let fragVc = fragment($('#template-voting-phase-content').html()) // create the new content
		let tmln = new TimelineMax();

		$(fragVc).find('.voting-phase-content'); // queue the content for reveal
		$(fragVc).find('.question').html(q.question); // set the quesiton on this view	
		for(let i = 0; i < randomKeys.length; i++){
			let fragA = fragment($('#template-answer').html());
			let pid = randomKeys[i];

			$(fragA).find('.answer').attr('data-player-id', pid);
			if(pid !== room.roomKey) {
				$(fragA).find('.answer .score').addClass(`player-${room.players[pid].number}-bg coloured`);
			}		
			$(fragA).find('.answer .content').text(q.submissions[pid]);
			$(fragVc).find('.answers').append(fragA); // append this answer to the answers element
		}

		$(fragVc).appendTo('#view-voting-phase');
		tmln.to('#view-voting-phase .queued', 1, { 
				top: 0, 
				ease: Power4.easeOut, 
				onStart: oneShotSfx,
				onStartParams: ["swoop-in.mp3"],
				onComplete: () => $('.voting-phase-content').not('.queued').remove() 
			})
			.set('#view-voting-phase .queued', {className: '-=queued', onComplete: resolve})
	})	
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
		$(`.answer[data-player-id="${votes[pid]}"]`).attr('data-will-score', 'true').find('.votes').append(frag);
	}	
}

/*
	addPlayersToLeaderboard: add the players to the leaderboard
*/

function addPlayersToLeaderboard(players) {
	if($('#view-leaderboard .player').length > 0) {
		return;
	}
	for(let pid in players) {		
		let frag = fragment($('#template-player').html());
		$(frag).find('.player').attr('data-player-id', pid).addClass(`player-${room.players[pid].number}-bg coloured`);		
		$(frag).find('.player .name').text(room.players[pid].name);
		$(frag).find('.player .score').text(room.players[pid].score);
		$('#view-leaderboard .players').append(frag);
	}	
}

/*
	revealVotesSequentially: uses a promise reduction sequence to reveal the votes whilst preserving it's
	asynchronous behaviour. calls the next step in the game sequence once it's finished	
*/

function revealVotesSequentially (answers){
	return new Promise((resolve, reject) => {
		answers.reduce((p, answer) => {
			return p.then(() => wait(1000).then(() => revealVote(answer)));
		}, Promise.resolve())
		.then(resolve);
	})	
}

/*
	revealVote: helper function for revealing the votes in sequence, with... dramatic pauses
*/

function revealVote(answer){
	return new Promise((resolve, reject) => {
		let votes = $(answer).find('.vote').length;
		let offset = 0.25;
		let staggerDuration = 0.8;
		let correctFloat = 0;
		let floatDuration = ((votes-1) * offset) + staggerDuration;		
		let tmln = new TimelineMax();

		$('#view-voting-phase .answer').removeClass('fade').not(answer).addClass('fade'); // isolate the showcased answer
		$(answer).find('.score').text(votes * 100); // set the score in the view		

		if($(answer).attr('data-player-id') === room.roomKey) {
			if(votes <= 0) return resolve();
			correctFloat = (votes-1) * offset;
			$(answer).find('.vote').each(function(){
				let pn = room.players[$(this).attr('data-player-id')].number; // get the player number for the score class
				let score = $(answer).find('.score').eq(-1); // get the last score element in the answer
				let clone = $(score).clone().removeClass().addClass(`score player-${pn}-bg coloured`) // clone the score element
				$(clone).insertAfter($(score)); // and append it to the answer
			})
			$(answer).find('.score').eq(0).remove(); // delete the old score
			$(answer).find('.score').text('100'); // set them all to +100
		}
			
		tmln.staggerTo( // reveal the votes
				$(answer).find('.vote'), 
				staggerDuration, 
				{ width: '100%', ease: Power4.easeOut, delay: 2, onStart: _incrementalVoteSfx, onStartParams: ["{self}"] }, 
				(offset * -1))
			.to(answer, floatDuration, { y: `-=${15 * votes}px`, ease: Power2.easeOut }, `-=${floatDuration}`) // rise the answer proportionately
			.to(answer, 0.6, { y: 0, ease: Power4.easeInOut, delay: 1}) // then slam the answer down
			.staggerTo( // float the score up
				$(answer).find('.score'), 
				1.5, 
				{ y: "-=200px", ease: Power3.easeOut, onStart: oneShotSfx, onStartParams: ["score-jingle.mp3", "250"]},
				offset, 
				"-=0.6")
			.staggerTo($(answer).find('.score'), 0.5, { opacity: 1, ease: Power3.easeIn}, offset, `-=${correctFloat + 1.5}`) // with a fade in
			.staggerTo($(answer).find('.score'), 1, { opacity: 0, ease: Power2.easeOut }, offset, `-=${correctFloat + 0.5}`, resolve) // after fade out, resolve the promise

		function _incrementalVoteSfx(tween){
			oneShotSfx(`vote-beep-pitch${(votes - 1) - $(tween.target).index()}.mp3`);
		}
	})
}

/*
	drawCountdown: draws the circular clock timer thingy, with an optional argument to draw the
	end frames if all submissions are recieved before timeout
*/

function drawCountdown(end) {
	return new Promise((resolve, reject) => {
		let countdown = `#view-${$('#view-container').attr('data-current-view')} .countdown`; // only target the countdown on the active view
		if(!end) {
			TweenLite.to(`${countdown} .circle`, room.timer.limit, { strokeDashoffset: 0, ease: Linear.easeNone }); // continue animation if there's time left
			return resolve();
		}
		let tmln = new TimelineMax(); // otherwise create the timeline for the timeout animation
		tmln.to(`${countdown} .circle`, 1, { strokeDashoffset: 0, ease: Power4.easeInOut }) // finish the border outline
			.to(`${countdown} .timer`, 0.3, { opacity: 0, ease: Power2.easeOut }, '-=0.5') // fade out the time figure
	  		.to(`${countdown} .circle`, 0.8, { transformOrigin: '50% 50%', scale: 0.7, ease: Back.easeInOut.config(1.3) }) // scale the circle down a bit
	    	.to(`${countdown} .circle`, 0.3, { fillOpacity: 1, stroke: '#f00', ease: Power2.easeOut }, '-=0.3') // change it's colour to red
	    	.to(`${countdown} .white-box`, 0.3, { fillOpacity: 1, ease: Power2.easeOut }, '-=0.3') // fade in the white bar
	    	.from( `${countdown} .white-box`, 0.3, { x: 100, ease: Power4.easeInOut, onStart: _resolveWithWhistle}, '-=0.4') // and move it into view

	    function _resolveWithWhistle() {
	    	waitOnSfx("timeout-whistle").then(resolve);
	    }
	})
}

/*
	updateLeaderboard: updates the circular leaderboard with a nice scale/offset proportionate to score
*/

function updateLeaderboard() {
	return new Promise((resolve, reject) => {
		let totalScore = 0;
		let averageScore = 0;
		let morphSounds = ["morph-1.mp3", "morph-2.mp3", "morph-3.mp3", "silence", "silence"];
		for(let pid in room.players) {
			totalScore += room.players[pid].score;
		}
		averageScore = totalScore / Object.keys(room.players).length; // mean of the scores

		for(let pid in room.players) {
			let $player = $(`#view-leaderboard .player[data-player-id="${pid}"]`); // get this player from the DOM
			let offset = ((room.players[pid].score - averageScore) / 2) * -1; // calculate the y offset based on deviation from the mean
			let percent = `${(room.players[pid].score / totalScore) * (100/4)}%`; // calculate percentage width as a ratio of the total score
			let tmln = new TimelineMax();	
			let initialWidth = $player.width(); // get the initial width of the player circles
			let newWidth;

			$player.find('.score').text(room.players[pid].score) // set the player's score in the view

			tmln.set($player, { width: percent, onComplete: () => { // first, set the width as percentage
						newWidth = $player.width(); // in order to get absolute in pixels						
					}
				})
				.set($player, { width: initialWidth }) // then set it back to it's initial width, ready for tweening
				.to($player, 4, { height: newWidth, width: newWidth, ease: Power3.easeInOut, delay: 0.5 }) // tween the width and height
				.to($player, 3, { y: offset, ease: Power3.easeInOut, onStart: _playRandomMorph }, "-=3") // and tween the y offset
				.staggerTo('#view-leaderboard .content-wrapper', 1.2, { opacity: 1, ease: Power4.easeInOut }, 0.1, 3, resolve) // then fade in the player names
		}
		function _playRandomMorph(){
			var randSound = morphSounds.splice(rand(0, morphSounds.length - 1), 1);
			randSound == "silence" ? null : oneShotSfx(randSound, 500);
		}
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
			name: `Player ${i+1}`,
			number: Object.keys(room.players).length + 1
		});
	}	
}

/*
	getQuestionPool: get question pool from remote JSON
*/

function getQuestionPool() {
	return new Promise((resolve, reject) => {
		$.getJSON('js/questions.json', data => {
			resolve(data);
		})
		.fail(e =>  {
			if(e.status == 200) {
				resolve(JSON.parse(e.responseText));
			}
			else {
				reject(e.statusText);
			}
		});
	})	
}

/*
	changeToView: helper function for switching the view (and obscuring the others during the transition)
*/

function changeToView(view) {
	if($('#view-container').attr('data-current-view') == view) return;
	$('.view').removeClass('obscure').not(`#view-${view}`).addClass('obscure'); // obscure the inactive views
	$('#view-container').attr('data-current-view', view); // transition to the new active view
	oneShotSfx("swoop-out.mp3", 500);
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
	shuffle: randomise an array
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
	rand: get a random number
*/

function rand(min, max) {
	return Math.round(min + Math.random() * (max - min));
}

/*
	waitOnSpeech: wait for the speech clip to finish before continuing
*/

function waitOnSpeech(name, delay = 0, immediate = false) {
	return new Promise(function(resolve, reject){
		let audio = new Audio(`../audio/speech/${name}.mp3`);
		$(audio).on('ended', resolve);
		setTimeout(e => audio.play(), delay);
		if(immediate) resolve();		
	});
}

/*
	waitOnSfx: wait for the sfx clip to finish before continuing
*/

function waitOnSfx(name, delay = 0, immediate = false) {
	return new Promise(function(resolve, reject){
		let audio = new Audio(`../audio/sfx/${name}.mp3`);
		$(audio).on('ended', resolve);
		setTimeout(e => audio.play(), delay);
		if(immediate) resolve();		
	});
}

/*
	oneShot: play audio immediately
*/

function oneShotSfx(name, delay = 5) {
	let audio = new Audio(`../audio/sfx/${name}`);
	setTimeout(e => audio.play(), delay);
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
	this.previousScore = null;
	this.submissionsComplete = {};	
}

