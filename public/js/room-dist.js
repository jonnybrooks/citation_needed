'use strict';

var socket = undefined;
var room = undefined;

socket = io('http://' + location.host + '/room');
socket.on('connect', function () {}); // on connect callback
socket.on('room-registered', function (r) {
	room = r; // set local copy of room to remote copy
	$('#room-key .key').text(r.roomKey); // display this room's key
});
socket.on('player-registered', function (player) {
	room.players[player.socketId] = player; // register this player on the local copy
	addPlayerToLobby(player); // add this player to the lobby

	if (Object.keys(room.players).length === room.minPlayers) {
		socket.emit('relay', {
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton' // display the start button on p1
		});
	}
});

socket.on('relay', function (message) {
	commands[message.command] ? commands[message.command](message) : console.log('no response handler exists for ' + message.command);
});

/*
	commands: object containing functions invoked remotely by a socket request
*/

var commands = {
	triggerNextStep: function triggerNextStep(message) {
		if (room.round === 0) {
			createDummyPlayers(4);
			generateGameSequence();
		}
		gameSequence.next();
	},
	acceptQuestionSubmission: function acceptQuestionSubmission(message) {
		room.questions[message.args.qid].submissions[message.from] = message.args.answer;
		room.players[message.from].submissionsComplete[message.args.qid] = true;
		checkAnswerPhaseStatus(message);
	},
	acceptVoteSubmission: function acceptVoteSubmission(message) {
		room.votes[message.from] = message.args.vote;
		checkVotePhaseStatus(message);
	}
};

/*
	gamePhases: phases of the games which act as elements in the game sequence steps[]
*/

var gamePhases = {
	lobby: function lobby() {
		$('.host').attr('href', location.host + '/player').find('span').text(location.host + '/player');

		$('.typed').typed({
			strings: ['The <a>English</a> have terrible teeth due to bad parenting.', '<a>Wasps</a> are in fact just angry little <a>Bees</a>.', '60% of the time it works <em>every</em> time.'],
			typeSpeed: 0,
			backSpeed: -200,
			backDelay: 2000,
			callback: function callback() {
				$('#view-lobby .typed-cursor').addClass('hide');
				$('#view-lobby .type-wrapper').addClass('slide-left');
				$('#view-lobby .player').addClass('show');
				waitOnSpeech('citation-needed', 1500);
				// temp
				setTimeout(function () {
					return $('.player').addClass('joined');
				}, 2000);
				// end temp
				getQuestionPool().then(function (qp) {
					return room.questionPool = qp;
				}).then(commands.triggerNextStep);
			}
		});
	},
	describeRound: function describeRound(round) {
		if (round === 1) {
			waitOnSpeech('welcome').then(function () {
				return waitOnSpeech('pre-round1');
			}).then(function () {
				return changeToView('describe-round-' + round);
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(0).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-1', 1000);
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(1).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-2');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(2).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-3');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(3).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-4');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(4).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-5');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(5).addClass('show');
			}).then(function () {
				return waitOnSpeech('guess-the-article-desc-6');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(6).addClass('show');
			}).then(gameSequence.next);
		} else {
			waitOnSpeech('pre-round1').then(function () {
				return changeToView('describe-round-' + round);
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(0).addClass('show');
			}).then(function () {
				return waitOnSfx('correct-v1', 1000);
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(1).addClass('show');
			}).then(function () {
				return waitOnSfx('correct-v2');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(2).addClass('show');
			}).then(function () {
				return waitOnSfx('intro');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(3).addClass('show');
			}).then(function () {
				return waitOnSfx('select');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(4).addClass('show');
			}).then(function () {
				return waitOnSfx('wrong');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(5).addClass('show');
			}).then(function () {
				return waitOnSfx('correct-v1');
			}).then(function () {
				return $('#view-describe-round-' + round + ' li').eq(6).addClass('show');
			}).then(gameSequence.next);
		}
	},
	guessTheArticle: function guessTheArticle() {
		var players = Object.keys(room.players); // get player ids
		var questions = room.questionPool.guessTheArticle; // get this rounds question pool
		var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random

		room.questions[q.id] = { question: q.excerpt, submissions: {} };
		room.round = 1;

		room.questions[q.id].submissions[room.roomKey] = q.article;

		for (var pid in room.players) {
			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;
		}

		addContentToAnswerPhase(q.excerpt) // add content to view, setting the question to the excerpt
		.then(function () {
			return changeToView('answer-phase');
		}) // show the answer phase view
		.then(function () {
			return wait(50);
		}) // delay neccesary for weird reveal behaviour
		.then(function () {
			return $('#view-answer-phase .question-anchor').addClass('reveal');
		}) // update the view
		.then(function () {
			return wait(5000);
		}).then(function () {
			$('#view-answer-phase .question-anchor').addClass('tuck');
			// temp
			$('#view-answer-phase .player').addClass('answered'); // show player as answered in lobby
			// end temp			
			socket.emit('relay', { // relay the question to everyone in the room
				from: room.roomKey, to: room.roomKey, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 1 }
			});
			room.timer.limit = 1;
			startTimer(room.timer.limit);
		});
	},
	excerptBattle: function excerptBattle() {
		var players = shuffle(Object.keys(room.players)); // get player ids and randomize
		var questions = room.questionPool.excerptBattle; // get this rounds question pool
		room.round = 2;

		var _loop = function (i) {
			var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
			var p1 = players[i];
			var p2 = players[i + 1] || players[0];
			room.questions[q.id] = { question: q.article, submissions: {} };
			room.questions[q.id].submissions[p1] = null;
			room.questions[q.id].submissions[p2] = null;
			room.players[p1].submissionsComplete[q.id] = false;
			room.players[p1].submissionsComplete[q.id] = false;

			wait(5000).then(function () {
				socket.emit('relay', {
					from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				});
				socket.emit('relay', {
					from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				});
			});
		};

		for (var i = 0; i < players.length; i++) {
			_loop(i);
		}

		addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
		.then(function () {
			return changeToView('answer-phase');
		}) // show the answer phase view
		.then(function () {
			return wait(50);
		}) // delay neccesary for weird reveal behaviour
		.then(function () {
			return $('#view-answer-phase .question-anchor').addClass('reveal');
		}) // update the view
		.then(function () {
			return wait(5000);
		}).then(function () {
			$('#view-answer-phase .question-anchor').addClass('tuck');
			// temp
			$('#view-answer-phase .player').addClass('answered'); // show player as answered in lobby
			// end temp			
			room.timer.limit = 1; // set the time limit to 60 seconds
			startTimer(room.timer.limit);
		});
	},
	editBattle: function editBattle() {
		var players = shuffle(Object.keys(room.players)); // get player ids and randomize
		var questions = room.questionPool.editBattle; // get this rounds question pool
		room.round = 2;

		var _loop2 = function (i) {
			var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
			var p1 = players[i];
			var p2 = players[i + 1] || players[0];
			room.questions[q.id] = { question: q.article, submissions: {} };
			room.questions[q.id].submissions[p1] = null;
			room.questions[q.id].submissions[p2] = null;
			room.players[p1].submissionsComplete[q.id] = false;
			room.players[p1].submissionsComplete[q.id] = false;

			wait(5000).then(function () {
				socket.emit('relay', {
					from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				});
				socket.emit('relay', {
					from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 2 }
				});
			});
		};

		for (var i = 0; i < players.length; i++) {
			_loop2(i);
		}

		addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
		.then(function () {
			return changeToView('answer-phase');
		}) // show the answer phase view
		.then(function () {
			return wait(50);
		}) // delay neccesary for weird reveal behaviour
		.then(function () {
			return $('#view-answer-phase .question-anchor').addClass('reveal');
		}) // update the view
		.then(function () {
			return wait(5000);
		}).then(function () {
			$('#view-answer-phase .question-anchor').addClass('tuck');
			// temp
			$('#view-answer-phase .player').addClass('answered'); // show player as answered in lobby
			// end temp			
			room.timer.limit = 1; // set the time limit to 60 seconds
			startTimer(room.timer.limit);
		});
	},
	coopCitationNeeded: function coopCitationNeeded() {
		var players = Object.keys(room.players); // get player ids
		var questions = room.questionPool.coopCitationNeeded; // get this rounds question pool
		room.round = 3;

		var _loop3 = function (pid) {
			var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random		
			room.questions[q.id] = { question: q.article, submissions: {} };

			room.questions[q.id].submissions[pid] = null;
			room.players[pid].submissionsComplete[q.id] = false;

			addContentToAnswerPhase(null, true) // add content to view with phoneVisible set to true
			.then(function () {
				return changeToView('answer-phase');
			}) // show the answer phase view
			.then(function () {
				return wait(50);
			}) // delay neccesary for weird reveal behaviour
			.then(function () {
				return $('#view-answer-phase .question-anchor').addClass('reveal');
			}) // update the view
			.then(function () {
				return wait(5000);
			}).then(function () {
				$('#view-answer-phase .question-anchor').addClass('tuck');
				// temp
				$('#view-answer-phase .player').addClass('answered'); // show player as answered in lobby
				// end temp
				socket.emit('relay', { // relay the question to everyone in the room
					from: room.roomKey, to: pid, command: 'prepareQuestion', args: { qid: q.id, question: q.article, round: 3 }
				});
				room.timer.limit = 1; // set the time limit to 60 seconds
				startTimer(room.timer.limit);
			});
		};

		for (var pid in room.players) {
			_loop3(pid);
		}
	},
	voting: function voting() {
		var qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		var q = room.questions[qid]; // get question in the final position	

		if (room.round === 1) {

			// temp
			//q = {excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare arcu vel risus interdum mattis. Aliquam semper neque quis maximus efficitur. Sed eget aliquam est, ut aliquam erat.", submissions: {}}
			var subs = ['Archipelago', 'Dances with Wolves (film)', 'Acid reflux', 'Quantum Leap', 'Gone with the wind', 'OMG (Abbreviation)', 'Christmas', 'Minced oath'];
			var sub_i = 0;
			var p1 = null;
			//end temp

			for (var pid in room.players) {
				room.votes[pid] = null; // set every player's vote to null

				// temp
				p1 = p1 === null ? pid : p1;
				q.submissions[pid] = subs[sub_i++];
				//room.votes[pid] = p1;				
				//room.votes[pid] = room.roomKey;
				room.votes[pid] = Object.keys(room.players)[rand(0, Object.keys(room.players).length - 1)];
				//room.votes[p1] = room.roomKey;
				// end temp
			}

			addContentToVotingPhase(q);

			// temp			
			addVotesToVotingPhase(room.votes);
			// end temp

			changeToView('voting-phase');

			socket.emit('relay', {
				from: room.roomKey, to: room.roomKey, command: 'prepareVote', args: { answers: q.submissions }
			});
		} else if (room.round === 2) {

			// temp
			//console.log(JSON.stringify(room, null, '\t'));
			var subs = ['Archipelago', 'Dances with Wolves (film)'];
			var sub_i = 0;
			for (var pid in q.submissions) {
				q.submissions[pid] = subs[sub_i++];
			}
			// end temp			

			for (var pid in room.players) {
				var send = true;
				for (var subpid in q.submissions) {
					if (pid === subpid) send = false;
				}
				if (send) {
					room.votes[pid] = null; // set every player's vote to null
					//temp
					room.votes[pid] = Object.keys(q.submissions)[rand(0, Object.keys(q.submissions).length - 1)];
					//end temp
					socket.emit('relay', {
						from: room.roomKey, to: pid, command: 'prepareVote', args: { answers: q.submissions }
					});
				}
			}
			addContentToVotingPhase(q).then(function () {
				// temp
				addVotesToVotingPhase(room.votes);
				// end temp				
				changeToView('voting-phase');
			});
		} else if (room.round === 3) {
			var subid = Object.keys(q.submissions)[0]; // get the first submission in the list

			// temp
			var answers = ['Archipelago', 'wrong', '[CITATION NEEDED]'];
			q.submissions[subid] = 'Arhcipelago';
			// end temp	

			for (var pid in room.players) {
				if (subid === pid) continue;
				room.votes[pid] = null; // set every player's vote to null
				//temp
				room.votes[pid] = answers.splice(Math.floor(Math.random() * answers.length), 1)[0];
				//end temp
				socket.emit('relay', {
					from: room.roomKey,
					to: pid,
					command: 'prepareQuestion',
					args: { qid: q.id, question: q.submissions[subid], round: '3-vote' }
				});
			}
			addContentToVotingPhase(q).then(function () {
				// temp
				addVotesToVotingPhase(room.votes);
				// end temp				
				changeToView('voting-phase');
			});
		}
		startTimer(room.timer.limit);
	},
	scoring: function scoring() {
		var qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		var r3Player = room.players[Object.keys(room.questions[qid].submissions)[0]];
		var citations = 0;

		if (room.round === 1) {
			var correctAnswer = '.answer[data-player-id="' + room.roomKey + '"]';
			var scoringAnswers = $('.answer[data-will-score]').not(correctAnswer); // get all scoring answers that aren't correct
			var sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array
			sequence.push($(correctAnswer)[0]); //  and push the correct one to the end of the sequence
			revealVotesSequentially(sequence).then(gameSequence.next);
		}
		if (room.round === 2) {
			var scoringAnswers = $('.answer[data-will-score]'); // get all scoring answers that aren't correct
			var sequence = shuffle($(scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array			
			revealVotesSequentially(sequence).then(gameSequence.next);
		}
		if (room.round === 3) {
			// ROUND 3 SCORES BASED ON IF PLAYER SUBMISSIONS MATCH THE ARTICLE TITLE
			// CITATIONS WILL HAVE TO RSULT IN A DIFFERENT ANIMATION			
			gameSequence.next();
		}

		for (var pid in room.players) {
			room.players[pid].previousScore = room.players[pid].score; // set all the previous scores
		}

		for (var i in room.votes) {
			if (room.round === 3 && room.votes[i] === '[CITATION NEEDED]') citations++; // for round 3, count the citations
			else {
				// for every other round
				if (room.votes[i] === room.roomKey) room.players[i].score += 100; // score for correct answers
				if (room.players[room.votes[i]]) room.players[room.votes[i]].score += 100; // and for votes on players
			}
		}
		if (room.round === 3) {
			if (citations >= Math.ceil(Object.keys(room.votes).length / 2)) {
				// if most votes are citations
				r3Player.score -= 100; // deduct points from the submitting player
			} else {
				citations = 0; // reset citations
				// update this with comments, think the logic needs to change slightly
				// to score players who successfully citate bullshit answers
				for (var i in room.votes) {
					if (room.votes[i] !== room.questions[qid].question) continue;
					room.players[i].score += 50;
					citations++;
				}
				r3Player.score += 50 * (citations === 0 ? 0 : citations < Object.keys(room.votes).length ? 1 : 2);
			}
		}
		delete room.questions[qid]; // delete question in the final position
		room.votes = {}; // clear the votes		
	},
	leaderboard: function leaderboard() {
		addPlayersToLeaderboard(room.players);
		changeToView('leaderboard');
		updateLeaderboard().then(function () {
			return wait(1000);
		}).then(gameSequence.next);
	},
	sendTriggerPrompt: function sendTriggerPrompt() {
		socket.emit('relay', {
			from: room.roomKey, to: room.roomKey, command: 'displayLobby'
		});
		socket.emit('relay', {
			from: room.roomKey, to: Object.keys(room.players)[0], command: 'displayStartButton'
		});
	},
	endGame: function endGame() {
		var max = 0;
		var winner = null;
		for (var pid in room.players) {
			if (room.players[pid].score > max) {
				max = room.players[pid].score;
				winner = pid;
			}
		}
		var backdrop = $('#view-leaderboard .player[data-player-id="' + winner + '"]');
		var frag = fragment(backdrop[0].outerHTML);
		var tmln = new TimelineMax();
		$('#view-leaderboard .winning-player').text(room.players[winner].name + ' wins!');
		$(frag).find('.content-wrapper').remove();
		$(frag).find('.player').addClass('backdrop').css({ position: 'fixed', transform: 'none', top: backdrop.offset().top, left: backdrop.offset().left, right: 'auto', bottom: 'auto', zIndex: 100, margin: 0 }).appendTo('#view-leaderboard');

		// change this animation sequence
		// endgame winner announcement should NOT be fixed position
		tmln.to('#view-leaderboard .backdrop', 0.5, { top: 0, right: 0, bottom: 0, left: 0, width: $(window).width(), height: $(window).width(), borderRadius: 0, ease: Power4.easeInOut }).set('#view-leaderboard .backdrop', { width: 'auto', height: 'auto' }).to('#view-leaderboard .winning-player', 0.8, { top: '40%', ease: Power4.easeInOut }).to('#view-leaderboard .winning-player', 0.5, { autoAlpha: 0, ease: Power4.easeInOut, delay: 2 }).to('#view-leaderboard .backdrop', 1, { top: '100%', ease: Power4.easeInOut, onComplete: gameSequence.next }, '-=0.5');
	},
	todo: function todo() {
		changeToView('todo');
	}
};

gamePhases.lobby();

/*
	gameSequence: the game sequence object represents the discrete steps that make up the game
*/

var gameSequence = {
	current: -1,
	steps: [],
	next: function next() {
		var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		setTimeout((function () {
			gameSequence.steps[++gameSequence.current](args);
		}).bind(gameSequence), 1100);
	}
};

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
	for (var i in room.players) {
		gameSequence.steps.push(gamePhases.voting);
		gameSequence.steps.push(gamePhases.scoring);
	}
	gameSequence.steps.push(gamePhases.leaderboard);
	gameSequence.steps.push(gamePhases.describeRound.bind(null, 3));
	gameSequence.steps.push(gamePhases.editBattle);
	for (var i in room.players) {
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
function startTimer(t) {
	$('.countdown .timer').text(t); // set the timer
	if (t === room.timer.limit) {
		drawCountdown(); // start filling the countdown timer
		room.timer.active = true; // when first called
	}
	if (!room.timer.active) return; // return if tne timer has been cancelled
	else if (t === 0) {
		drawCountdown(true); // finish the timer
		return wait(1000).then(gameSequence.next);
	} else setTimeout(startTimer.bind(null, --t), 1000); // decrement the timer
}

/*
	checkAnswerPhaseStatus: check the status of the answer phase (called whenever a player submits an answer)		
*/

function checkAnswerPhaseStatus(m) {
	var playerDone = true;
	for (var i in room.players[m.from].submissionsComplete) {
		if (!room.players[m.from].submissionsComplete[i]) playerDone = false;
	}
	if (playerDone) {
		// if the player has finished their questions
		var questionsComplete = true;
		$('#view-answer-phase .player[data-player-id="' + m.from + '"]').addClass('answered'); // show player as answered in lobby
		for (var i in room.questions) {
			// then iterate through the room questions
			for (var j in room.questions[i].submissions) {
				// making sure they're all done
				if (room.questions[i].submissions[j] === null) questionsComplete = false;
			}
		}
		if (questionsComplete) {
			// if all questions are complete
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
	var votingDone = true;
	for (var i in room.votes) {
		if (room.votes[i] === null) votingDone = false;
	}
	if (votingDone) {
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
	var p = $('div[data-player-id=""]').eq(0);
	$(p).attr('data-player-id', player.socketId);
	$(p).find('.name').text(player.name);
	$(p).addClass('joined');
}

/*
	addContentToAnswerPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToAnswerPhase(question, phoneVisible) {
	return new Promise(function (resolve, reject) {
		var vcFrag = fragment($('#template-answer-phase-content').html());
		if (phoneVisible) $(vcFrag).find('.answer-phase-content').addClass('phone-visible');
		$(vcFrag).find('.answer-phase-content .question').text(question);
		for (var pid in room.players) {
			var pFrag = fragment($('#template-player').html());
			$(pFrag).find('.player').attr('data-player-id', pid);
			$(pFrag).find('.player .name').text(room.players[pid].name);
			$(vcFrag).find('.players').append(pFrag);
		}
		$('#view-answer-phase').html(vcFrag);
		resolve();
	});
}

/*
	addContentToVotingPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToVotingPhase(q) {
	return new Promise(function (resolve, reject) {
		var randomKeys = shuffle(Object.keys(q.submissions));
		var fragVc = fragment($('#template-voting-phase-content').html()); // create the new content
		var tmln = new TimelineMax();

		$(fragVc).find('.voting-phase-content'); // queue the content for reveal
		$(fragVc).find('.question').text(q.question); // set the quesiton on this view	
		for (var i = 0; i < randomKeys.length; i++) {
			var fragA = fragment($('#template-answer').html());
			var pid = randomKeys[i];

			$(fragA).find('.answer').attr('data-player-id', pid);
			if (pid !== room.roomKey) {
				$(fragA).find('.answer .score').addClass('player-' + room.players[pid].number + '-bg coloured');
			}
			$(fragA).find('.answer .content').text(q.submissions[pid]);
			$(fragVc).find('.answers').append(fragA); // append this answer to the answers element
		}

		$(fragVc).appendTo('#view-voting-phase');
		tmln.to('#view-voting-phase .queued', 1, { top: 0, ease: Power4.easeOut, onComplete: function onComplete() {
				return $('.voting-phase-content').not('.queued').remove();
			} }).set('#view-voting-phase .queued', { className: '-=queued', onComplete: resolve });
	});
}

/*
	addVotesToVotingPhase: add the votes sequentially to their respective answers in the voting phase view
	they are hidden by default, and revealed by the reveal votes function	
*/

function addVotesToVotingPhase(votes) {
	for (var pid in votes) {
		var frag = fragment($('#template-vote').html());
		$(frag).find('.vote').attr('data-player-id', pid);
		$(frag).find('.vote').addClass('player-' + room.players[pid].number + '-bg');
		$('.answer[data-player-id="' + votes[pid] + '"]').attr('data-will-score', 'true').find('.votes').append(frag);
	}
}

/*
	addPlayersToLeaderboard: add the players to the leaderboard
*/

function addPlayersToLeaderboard(players) {
	if ($('#view-leaderboard .player').length > 0) {
		//return TweenLite.set('#view-leaderboard .content-wrapper', { clearProps: 'all' }); // reset the player fade-in
		return;
	}
	for (var pid in players) {
		var frag = fragment($('#template-player').html());
		$(frag).find('.player').attr('data-player-id', pid).addClass('player-' + room.players[pid].number + '-bg coloured');
		$(frag).find('.player .name').text(room.players[pid].name);
		$(frag).find('.player .score').text(room.players[pid].score);
		$('#view-leaderboard .players').append(frag);
	}
}

/*
	revealVotesSequentially: uses a promise reduction sequence to reveal the votes whilst preserving it's
	asynchronous behaviour. calls the next step in the game sequence once it's finished	
*/

function revealVotesSequentially(answers) {
	return new Promise(function (resolve, reject) {
		answers.reduce(function (p, answer) {
			return p.then(function () {
				return wait(1000).then(function () {
					return revealVote(answer);
				});
			});
		}, Promise.resolve()).then(resolve);
	});
}

/*
	revealVote: helper function for revealing the votes in sequence, with... dramatic pauses
*/

function revealVote(answer) {
	return new Promise(function (resolve, reject) {
		var votes = $(answer).find('.vote').length;
		var offset = 0.25;
		var staggerDuration = 0.8;
		var correctFloat = 0;
		var floatDuration = (votes - 1) * offset + staggerDuration;
		var tmln = new TimelineMax();

		$('#view-voting-phase .answer').removeClass('fade').not(answer).addClass('fade'); // isolate the showcased answer
		$(answer).find('.score').text(votes * 100); // set the score in the view		

		if ($(answer).attr('data-player-id') === room.roomKey) {
			if (votes <= 0) return resolve();
			correctFloat = (votes - 1) * offset;
			$(answer).find('.vote').each(function () {
				var pn = room.players[$(this).attr('data-player-id')].number; // get the player number for the score class
				var score = $(answer).find('.score').eq(-1); // get the last score element in the answer
				var clone = $(score).clone().removeClass().addClass('score player-' + pn + '-bg coloured'); // clone the score element
				$(clone).insertAfter($(score)); // and append it to the answer
			});
			$(answer).find('.score').eq(0).remove(); // delete the old score
			$(answer).find('.score').text('100'); // set them all to +100
		}

		tmln.staggerTo($(answer).find('.vote'), staggerDuration, { width: '100%', ease: Power4.easeOut, delay: 2 }, offset * -1) // reveal the votes
		.to(answer, floatDuration, { y: '-=' + 15 * votes + 'px', ease: Power2.easeOut }, '-=' + floatDuration) // rise the answer proportionately
		.to(answer, 0.6, { y: 0, ease: Power4.easeInOut, delay: 1 }) // then slam the answer down
		.staggerTo($(answer).find('.score'), 1.5, { y: '-=200px', ease: Power3.easeOut }, offset, '-=0.6') // float the score up
		.staggerTo($(answer).find('.score'), 0.5, { opacity: 1, ease: Power3.easeIn }, offset, '-=' + (correctFloat + 1.5)) // with a fade in
		.staggerTo($(answer).find('.score'), 1, { opacity: 0, ease: Power2.easeOut }, offset, '-=' + (correctFloat + 0.5), resolve);
	});
}

/*
	drawCountdown: draws the circular clock timer thingy, with an optional argument to draw the
	end frames if all submissions are recieved before timeout
*/

function drawCountdown(end) {
	var countdown = '#view-' + $('#view-container').attr('data-current-view') + ' .countdown'; // only target the countdown on the active view
	if (!end) return TweenLite.to(countdown + ' .circle', room.timer.limit, { strokeDashoffset: 0, ease: Linear.easeNone }); // continue animation if there's time left
	var tmln = new TimelineMax(); // otherwise create the timeline for the timeout animation
	tmln.to(countdown + ' .circle', 1, { strokeDashoffset: 0, ease: Power4.easeInOut }) // finish the border outline
	.to(countdown + ' .timer', 0.3, { opacity: 0, ease: Power2.easeOut }, '-=0.5') // fade out the time figure
	.to(countdown + ' .circle', 0.8, { transformOrigin: '50% 50%', scale: 0.7, ease: Back.easeInOut.config(1.3) }) // scale the circle down a bit
	.to(countdown + ' .circle', 0.3, { fillOpacity: 1, stroke: '#f00', ease: Power2.easeOut }, '-=0.3') // change it's colour to red
	.to(countdown + ' .white-box', 0.3, { fillOpacity: 1, ease: Power2.easeOut }, '-=0.3') // fade in the white bar
	.from(countdown + ' .white-box', 0.3, { x: 100, ease: Power4.easeInOut }, '-=0.4');
}

/*
	updateLeaderboard: updates the circular leaderboard with a nice scale/offset proportionate to score
*/

function updateLeaderboard() {
	return new Promise(function (resolve, reject) {
		var totalScore = 0;
		var averageScore = 0;
		for (var pid in room.players) {
			totalScore += room.players[pid].score;
		}
		averageScore = totalScore / Object.keys(room.players).length;
		var _loop4 = function (pid) {
			var $player = $('#view-leaderboard .player[data-player-id="' + pid + '"]'); // get this player from the DOM
			var offset = (room.players[pid].score - averageScore) / 2 * -1; // calculate the y offset based on deviation from the mean
			var percent = room.players[pid].score / totalScore * (100 / 4) + '%'; // calculate percentage width as a ratio of the total score
			var tmln = new TimelineMax();
			var initialWidth = $player.width(); // get the initial width of the player circles
			var newWidth = undefined;

			$player.find('.score').text(room.players[pid].score); // set the player's score in the view

			tmln.set($player, { width: percent, onComplete: function onComplete() {
					// first, set the width as percentage
					newWidth = $player.width(); // in order to get absolute in pixels						
				}
			}).set($player, { width: initialWidth }) // then set it back to it's initial width, ready for tweening
			.to($player, 4, { height: newWidth, width: newWidth, ease: Power3.easeInOut, delay: 0.5 }) // tween the width and height
			// .staggerTo('.circle', 1.8, { ease: Elastic.easeOut.config(0.4, 0.15), scale: 3, delay: 1 }, 0.2); tween with a staggered pop
			.to($player, 3, { y: offset, ease: Power3.easeInOut }, '-=3') // and tween the y offset
			.staggerTo('#view-leaderboard .content-wrapper', 1.2, { opacity: 1, ease: Power4.easeInOut }, 0.1, 4, resolve);
		};

		// mean of the scores

		for (var pid in room.players) {
			_loop4(pid);
		}
	});
}

/*
	createDummyPlayers: create dummy players for fast forwarding through the connection process
	for testing
*/

function createDummyPlayers(amount) {
	for (var i = 0; i < amount; i++) {
		var id = Math.random();
		room.players[id] = new Player({
			socketId: id,
			roomKey: room.roomKey,
			name: 'Player ' + (i + 1),
			number: Object.keys(room.players).length + 1
		});
	}
}

/*
	getQuestionPool: get question pool from remote JSON
*/

function getQuestionPool() {
	return new Promise(function (resolve, reject) {
		jQuery.getJSON('questions.json', function (data) {
			return resolve(data);
		}).fail(function (e) {
			return console.log('error: %s', e);
		});
	});
}

/*
	changeToView: helper function for switching the view (and obscuring the others during the transition)
*/

function changeToView(view) {
	$('.view').removeClass('obscure').not('#view-' + view).addClass('obscure'); // obscure the inactive views
	$('#view-container').attr('data-current-view', view); // transition to the new active view
}

/*
	fragment: creates a document fragment for appending to the DOM
*/

function fragment(htmlStr) {
	var frag = document.createDocumentFragment();
	var temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) {
		frag.appendChild(temp.firstChild);
	}
	return frag;
}

/*
	shuffle: randomise and array
*/

function shuffle(array) {
	var currentIndex = array.length,
	    temporaryValue = undefined,
	    randomIndex = undefined;
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

function waitOnSpeech(name) {
	var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	var immediate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

	return new Promise(function (resolve, reject) {
		var audio = new Audio('../audio/speech/' + name + '.mp3');
		$(audio).on('ended', resolve);
		setTimeout(function (e) {
			return audio.play();
		}, delay);
		if (immediate) resolve();
	});
}

/*
	waitOnSfx: wait for the sfx clip to finish before continuing
*/

function waitOnSfx(name) {
	var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	var immediate = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

	return new Promise(function (resolve, reject) {
		var audio = new Audio('../audio/sfx/' + name + '.wav');
		$(audio).on('ended', resolve);
		setTimeout(function (e) {
			return audio.play();
		}, delay);
		if (immediate) resolve();
	});
}

/*
	wait: wait for "delay" seconds before continuing with the next thenable
*/

function wait(delay) {
	return new Promise(function (resolve, reject) {
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
/*
// temp
$('.typed').text('60% of the time it works <em>every</em> time.');
$('#view-lobby .typed-cursor').addClass('hide');
$('#view-lobby .type-wrapper').addClass('slide-left');
$('#view-lobby .player').addClass('show');
//waitOnSpeech('citation-needed', 1500);
	setTimeout(() => $('.player').addClass('joined'), 5000);
setTimeout(commands.triggerNextStep, 2000);
// end temp	
*/
// then reveal them in order			
// then reveal them in order
// after fade out, resolve the promise
// and move it into view
// then fade in the player names
