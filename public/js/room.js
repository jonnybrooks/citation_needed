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
			createDummyPlayers(4);			
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
	guessTheArticle: [
		{id: 0, excerpt: 'What is your favourite colour?', article: 'Blue, no, green!'},
		{id: 1, excerpt: 'What is your quest?', article: 'I seek the Holy Grail'},
		{id: 2, excerpt: 'What is your name?', article: 'Arthur, King of the Britains'},
		{id: 3, excerpt: 'What is the air speed velocity of a fully laden Swallow?', article: 'An African or a European Swallow?'},
		{id: 4, excerpt: 'None shall pass', article: 'NONE SHALL PASS'},
		{id: 5, excerpt: 'We are the knights who say...', article: 'Nee!'}
	],
	excerptBattle: [
		{id: 0, article: 'Blue, no, green!'},
		{id: 1, article: 'I seek the Holy Grail'},
		{id: 2, article: 'Arthur, King of the Britains'},
		{id: 3, article: 'An African or a European Swallow?'},
		{id: 4, article: 'NONE SHALL PASS'},
		{id: 5, article: 'Nee!'},
		{id: 6, article: 'Ya arm\'s off!'},
		{id: 7, article: 'Breathe, sweet Concorde'},
		{id: 8, article: 'He\'s going to tell (He\'s going to tell)'}
	],
	coopCitationNeeded: [
		{id: 0, article: 'Blue, no, green!'},
		{id: 1, article: 'I seek the Holy Grail'},
		{id: 2, article: 'Arthur, King of the Britains'},
		{id: 3, article: 'An African or a European Swallow?'},
		{id: 4, article: 'NONE SHALL PASS'},
		{id: 5, article: 'Nee!'},
		{id: 6, article: 'Ya arm\'s off!'},
		{id: 7, article: 'Breathe, sweet Concorde'},
		{id: 8, article: 'He\'s going to tell (He\'s going to tell)'}
	],	
	editBattle: [
		{id: 0, excerpt: 'The first law of thermodynamics is ____', article: 'The first law of thermodynamics'},
		{id: 1, excerpt: 'The second law of thermodynamics is ____', article: 'The second law of thermodynamics'},
		{id: 4, excerpt: 'The third law of thermodynamics is ____', article: 'The third law of thermodynamics'},
		{id: 2, excerpt: 'The fourth law of thermodynamics is ____', article: 'The fourth law of thermodynamics'},
		{id: 3, excerpt: 'The fifth law of thermodynamics is ____', article: 'The fifth law of thermodynamics'},
		{id: 5, excerpt: 'The sixth law of thermodynamics is ____', article: 'The sixth law of thermodynamics'}
	],
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
				waitOnAudio('title-card', 1500);
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
		//waitOnAudio('title-card', 1500);

		setTimeout(() => $('.player').addClass('joined'), 5000);
		setTimeout(commands.triggerNextStep, 2000);
		// end temp	
			
	},
	describeRound: function(round) {
		if(round === 1) {
			waitOnAudio('welcome')
			.then(() => waitOnAudio('pre-round1'))
			.then(() => $('#view-container').attr('data-current-view', `describe-round-${round}`))
			.then(() => $(`#view-describe-round-${round} li`).eq(0).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-1', 1000))
			.then(() => $(`#view-describe-round-${round} li`).eq(1).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-2'))
			.then(() => $(`#view-describe-round-${round} li`).eq(2).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-3'))
			.then(() => $(`#view-describe-round-${round} li`).eq(3).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-4'))
			.then(() => $(`#view-describe-round-${round} li`).eq(4).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-5'))
			.then(() => $(`#view-describe-round-${round} li`).eq(5).addClass('show'))
			.then(() => waitOnAudio('guess-the-article-desc-6'))
			.then(() => $(`#view-describe-round-${round} li`).eq(6).addClass('show'))
			.then(gameSequence.next)
		}
		else {
			waitOnAudio('003-round1-intro')
			.then(() => $('#view-container').attr('data-current-view', `describe-round-${round}`))
			.then(() => $(`#view-describe-round-${round} li`).eq(0).addClass('show'))
			.then(() => waitOnAudio('004-round1-desc', 1000))
			.then(() => $(`#view-describe-round-${round} li`).eq(1).addClass('show'))
			.then(() => waitOnAudio('005-round1-desc'))
			.then(() => $(`#view-describe-round-${round} li`).eq(2).addClass('show'))
			.then(() => waitOnAudio('006-round1-desc'))
			.then(() => $(`#view-describe-round-${round} li`).eq(3).addClass('show'))
			.then(() => waitOnAudio('007-round1-desc'))
			.then(() => $(`#view-describe-round-${round} li`).eq(4).addClass('show'))
			.then(() => waitOnAudio('008-round1-desc'))
			.then(() => $(`#view-describe-round-${round} li`).eq(5).addClass('show'))
			.then(() => waitOnAudio('009-round1-desc'))
			.then(() => $(`#view-describe-round-${round} li`).eq(6).addClass('show'))
			.then(gameSequence.next)
		}			
	},
	guessTheArticle: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.guessTheArticle; // get this rounds question pool
		let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random

		room.questions[q.id] = { question: q.excerpt, submissions: {} };
		room.round = 1;

		room.questions[q.id].submissions[room.roomKey] = q.article;

		for(let pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
		}

		addContentToAnswerPhase(q.excerpt) // add content to view, setting the question to the excerpt
		.then(() => $('#view-container').attr('data-current-view', `answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => $('#view-answer-phase .question-anchor').addClass('reveal')) // update the view
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');			
			// temp
			$(`#view-answer-phase .player`).addClass('answered'); // show player as answered in lobby
			// end temp			
			socket.emit('relay', { // relay the question to everyone in the room
				from: room.roomKey, to: room.roomKey, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
			})
			room.timer.limit = 1;
			startTimer(room.timer.limit);
		})
	},
	excerptBattle: function() {
		let players = shuffle(Object.keys(room.players)); // get player ids and randomize
		let questions = questionPool.excerptBattle; // get this rounds question pool
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
		.then(() => $('#view-container').attr('data-current-view', `answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => $('#view-answer-phase .question-anchor').addClass('reveal')) // update the view
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');			
			// temp
			$(`#view-answer-phase .player`).addClass('answered'); // show player as answered in lobby
			// end temp			
			room.timer.limit = 1; // set the time limit to 60 seconds
			startTimer(room.timer.limit);
		})
	},	
	editBattle: function() {
		let players = shuffle(Object.keys(room.players)); // get player ids and randomize
		let questions = questionPool.editBattle; // get this rounds question pool
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
		.then(() => $('#view-container').attr('data-current-view', `answer-phase`)) // show the answer phase view
		.then(() => wait(50)) // delay neccesary for weird reveal behaviour
		.then(() => $('#view-answer-phase .question-anchor').addClass('reveal')) // update the view
		.then(() => wait(5000))
		.then(() => {
			$('#view-answer-phase .question-anchor').addClass('tuck');			
			// temp
			$(`#view-answer-phase .player`).addClass('answered'); // show player as answered in lobby
			// end temp			
			room.timer.limit = 1; // set the time limit to 60 seconds
			startTimer(room.timer.limit);
		})
	},
	coopCitationNeeded: function() {
		let players = Object.keys(room.players); // get player ids
		let questions = questionPool.coopCitationNeeded; // get this rounds question pool
		room.round = 3;

		for(let pid in room.players) {
			let q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random		
			room.questions[q.id] = { question: q.article, submissions: {} };			

			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;

			addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
			.then(() => $('#view-container').attr('data-current-view', `answer-phase`)) // show the answer phase view
			.then(() => wait(50)) // delay neccesary for weird reveal behaviour
			.then(() => $('#view-answer-phase .question-anchor').addClass('reveal')) // update the view
			.then(() => wait(5000))
			.then(() => {
				$('#view-answer-phase .question-anchor').addClass('tuck');
				// temp
				$(`#view-answer-phase .player`).addClass('answered'); // show player as answered in lobby
				// end temp
				socket.emit('relay', { // relay the question to everyone in the room
					from: room.roomKey, to: pid, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 3 }
				})
				room.timer.limit = 1; // set the time limit to 60 seconds
				startTimer(room.timer.limit);
			})
		}		
	},
	voting: function() {
		let qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		let q = room.questions[qid]; // get question in the final position	

		if(room.round === 1) {

			// temp
			//q = {excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare arcu vel risus interdum mattis. Aliquam semper neque quis maximus efficitur. Sed eget aliquam est, ut aliquam erat.", submissions: {}}
			let subs = ["Archipelago", "Dances with Wolves (film)", "Acid reflux", "Quantum Leap", "Gone with the wind", "OMG (Abbreviation)", "Christmas", "Minced oath"]
			let sub_i = 0;
			let p1 = null;			
			//end temp

			for(let pid in room.players) {
				room.votes[pid] = null; // set every player's vote to null

				// temp
				p1 = p1 === null ? pid : p1;
				q.submissions[pid] = subs[sub_i++];
				//room.votes[pid] = p1;				
				//room.votes[pid] = room.roomKey;
				room.votes[pid] = Object.keys(room.players)[rand(0, Object.keys(room.players).length-1)];
				//room.votes[p1] = room.roomKey;
				// end temp
			}

			addContentToVotingPhase(q);

			// temp			
			addVotesToVotingPhase(room.votes);
			// end temp
			
			$('#view-container').attr('data-current-view', `voting-phase`);

			socket.emit('relay', { 
				from: room.roomKey, to: room.roomKey, command: 'prepareVote', args: { answers: q.submissions }
			})
		}
		else if(room.round === 2) {

			// temp
			//console.log(JSON.stringify(room, null, '\t'));
			let subs = ["Archipelago", "Dances with Wolves (film)"]
			let sub_i = 0;					
			for(let pid in q.submissions) {
				q.submissions[pid] = subs[sub_i++];				
			}
			// end temp			

			for(let pid in room.players) {
				let send = true;
				for(let subpid in q.submissions) {
					if(pid === subpid) send = false;
				}
				if(send) {
					room.votes[pid] = null; // set every player's vote to null
					//temp
					room.votes[pid] = Object.keys(q.submissions)[rand(0, Object.keys(q.submissions).length-1)];
					//end temp
					socket.emit('relay', { 
						from: room.roomKey, to: pid, command: 'prepareVote', args: { answers: q.submissions }
					})
				}
			}
			addContentToVotingPhase(q)
			.then(() => {				
				// temp
				addVotesToVotingPhase(room.votes);			
				// end temp				
				$('#view-container').attr('data-current-view', `voting-phase`);
			})
		}
		else if(room.round === 3) {
			let subid = Object.keys(q.submissions)[0]; // get the first submission in the list

			// temp
			let answers = ['Archipelago', 'wrong', '[CITATION NEEDED]'];
			q.submissions[subid] = "Arhcipelago";
			// end temp	

			for(let pid in room.players) {
				if(subid === pid) continue;
				room.votes[pid] = null; // set every player's vote to null
				//temp
				room.votes[pid] = answers.splice(Math.floor(Math.random() * answers.length), 1)[0];
				//end temp
				socket.emit('relay', { 
					from: room.roomKey, 
					to: pid, 
					command: 'prepareQuestion', 
					args: { qid: q.id, question: q.submissions[subid], round: '3-vote' }
				})				
			}
			addContentToVotingPhase(q)
			.then(() => {				
				// temp
				addVotesToVotingPhase(room.votes);			
				// end temp				
				$('#view-container').attr('data-current-view', `voting-phase`);
			})
		}
		startTimer(room.timer.limit);
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
		if(room.round === 2) {
			let scoringAnswers = $('.answer[data-will-score]'); // get all scoring answers that aren't correct
			let sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array			
			revealVotesSequentially(sequence).then(gameSequence.next) // then reveal them in order
		}
		if(room.round === 3) {
			// ROUND 3 SCORES BASED ON IF PLAYER SUBMISSIONS MATCH THE ARTICLE TITLE
			// CITATIONS WILL HAVE TO RSULT IN A DIFFERENT ANIMATION			
			gameSequence.next();
		}

		for(let pid in room.players) {
			room.players[pid].previousScore = room.players[pid].score; // set all the previous scores
		}
		
		for(let i in room.votes) {
			if(room.round === 3 && room.votes[i] === "[CITATION NEEDED]") citations++; // for round 3, count the citations
			else { // for every other round
				if(room.votes[i] === room.roomKey) room.players[i].score += 100; // score for correct answers
				if(room.players[room.votes[i]]) room.players[room.votes[i]].score += 100; // and for votes on players
			}
		}
		if(room.round === 3){
			if(citations >= Math.ceil(Object.keys(room.votes).length / 2)) { // if most votes are citations 
				r3Player.score -= 100; // deduct points from the submitting player
			}
			else {
				citations = 0; // reset citations
				// update this with comments, think the logic needs to change slightly
				// to score players who successfully citate bullshit answers
				for(let i in room.votes) {
					if(room.votes[i] !== room.questions[qid].question) continue;
					room.players[i].score += 50;
					citations++;
				}
				r3Player.score += 50 * (citations === 0 ? 0 : citations < Object.keys(room.votes).length ? 1 : 2);
			}
		}
		delete room.questions[qid]; // delete question in the final position
		room.votes = {}; // clear the votes		
	},
	leaderboard: function() {
		addPlayersToLeaderboard(room.players);
		$('#view-container').attr('data-current-view', 'leaderboard');
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
		$('#view-container').attr('data-current-view', 'endgame');
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
	establishes how many voting & scoring phases are necessary (based on the number of players)
	and pushes these steps to the gameSequence steps[] array
*/

function generateGameSequence() {
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 1));
	gameSequence.steps.push(gamePhases.guessTheArticle);
	gameSequence.steps.push(gamePhases.voting);
	gameSequence.steps.push(gamePhases.scoring);
	gameSequence.steps.push(gamePhases.leaderboard);
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 2));
	gameSequence.steps.push(gamePhases.excerptBattle);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);
		gameSequence.steps.push(gamePhases.scoring);
	}	
	gameSequence.steps.push(gamePhases.leaderboard);
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 3));
	gameSequence.steps.push(gamePhases.editBattle);
	for(let i in room.players) {
		gameSequence.steps.push(gamePhases.voting);		
		gameSequence.steps.push(gamePhases.scoring);
	}	
	gameSequence.steps.push(gamePhases.leaderboard);	
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
	addContentToAnswerPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToAnswerPhase(question, phoneVisible) {	
	return new Promise((resolve, reject) => {
		let vcFrag = fragment($('#template-answer-phase-content').html());
		if(true) $(vcFrag).find('.answer-phase-content').addClass('phone-visible'); // EDIT TRUE TO phoneVisible
		$(vcFrag).find('.answer-phase-content .question').text(question);
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
		$(fragVc).find('.question').text(q.question); // set the quesiton on this view	
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
		tmln.to('#view-voting-phase .queued', 1, { top: 0, ease: Power4.easeOut, onComplete: () => $('.voting-phase-content').not('.queued').remove() })
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
	if($('#view-leaderboard .player').length > 0) return;
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
			
		tmln.staggerTo($(answer).find('.vote'), staggerDuration, { width: '100%', ease: Power4.easeOut, delay: 2 }, (offset * -1)) // reveal the votes
			.to(answer, floatDuration, { y: `-=${15 * votes}px`, ease: Power2.easeOut }, `-=${floatDuration}`) // rise the answer proportionately
			.to(answer, 0.6, { y: 0, ease: Power4.easeInOut, delay: 1}) // then slam the answer down
			.staggerTo($(answer).find('.score'), 1.5, { y: "-=200px", ease: Power3.easeOut }, offset, "-=0.6") // float the score up
			.staggerTo($(answer).find('.score'), 0.5, { opacity: 1, ease: Power3.easeIn}, offset, `-=${correctFloat + 1.5}`) // with a fade in
			.staggerTo($(answer).find('.score'), 1, { opacity: 0, ease: Power2.easeOut }, offset, `-=${correctFloat + 0.5}`, resolve) // after fade out, resolve the promise
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
	drawCountdown: draws the circular clock timer thingy, with an optional argument to draw the
	end frames if all submissions are recieved before timeout
*/

function drawCountdown(end) {
	let countdown = `#view-${$('#view-container').attr('data-current-view')} .countdown`;
	if(!end) return TweenLite.to(`${countdown} .circle`, room.timer.limit, { strokeDashoffset: 0, ease: Linear.easeNone });
	let tmln = new TimelineMax();
	tmln.to(`${countdown} .circle`, 1, { strokeDashoffset: 0, ease: Power4.easeInOut })
		.to(`${countdown} .timer`, 0.3, { opacity: 0, ease: Power2.easeOut }, '-=0.5')
  		.to(`${countdown} .circle`, 0.8, { transformOrigin: '50% 50%', scale: 0.7, ease: Back.easeInOut.config(1.3) })
    	.to(`${countdown} .circle`, 0.3, { fillOpacity: 1, stroke: '#f00', ease: Power2.easeOut }, '-=0.3')      
    	.to(`${countdown} .white-box`, 0.3, { fillOpacity: 1, ease: Power2.easeOut }, '-=0.3')
    	.from(`${countdown} .white-box`, 0.3, { x: 100, ease: Power4.easeInOut }, '-=0.4')
}

/*
	updateLeaderboard: updates the circular leaderboard with a nice scale/offset proportionate to score
*/

function updateLeaderboard() {
	return new Promise((resolve, reject) => {
		let totalScore = 0;
		let averageScore = 0;
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
				// .staggerTo('.circle', 1.8, { ease: Elastic.easeOut.config(0.4, 0.15), scale: 3, delay: 1 }, 0.2); tween with a staggered pop
				.to($player, 3, { y: offset, ease: Power3.easeInOut }, "-=3") // and tween the y offset
				.staggerTo('#view-leaderboard .content-wrapper', 1.2, { opacity: 1, ease: Power4.easeInOut }, 0.1, 4, resolve) // then fade in the player names
		}
	})		
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
	rand: get a random number
*/

function rand(min, max) {
	return Math.round(min + Math.random() * (max - min));
}

/*
	waitOnAudio: wait for the audio clip to finish before continuing
*/

function waitOnAudio(name, delay = 0, immediate = false) {
	return new Promise(function(resolve, reject){
		let audio = new Audio(`../speech/${name}.mp3`);
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
	this.previousScore = null;
	this.submissionsComplete = {};	
}