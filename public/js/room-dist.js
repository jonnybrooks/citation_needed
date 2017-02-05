'use strict';

var socket = void 0;
var room = void 0;

socket = io('http://' + location.host + '/room');
socket.on('connect', function () {}); // on connect callback
socket.on('room-registered', function (r) {
	room = r; // set local copy of room to remote copy
	$('#room-key .key').text(r.roomKey); // display this room's key
	gamePhases.lobby();
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
			// temp
			createDummyPlayers(4);
			// end temp
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
		$('.host').attr('href', location.host + '/player').find('span').text(location.host + '/player'); // set the host link text for the players
		oneShotSfx("keyboard-mashing.mp3"); // play the keyboard sound
		$('.typed').typed({
			strings: ["The <a>English</a> have terrible teeth due to bad parenting.", "<a>Wasps</a> are in fact just angry little <a>Bees</a>.", "60% of the time it works <em>every</em> time."],
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
					for (var i = 0; i < room.players.length; i++) {
						addPlayerToLobby(room.players[i]);
					}
				}, 5000);
				// end temp
				getQuestionPool().then(function (qp) {
					return room.questionPool = qp;
				}).then(commands.triggerNextStep).catch(function (error) {
					alert("Sorry, there appears to have been an error retrieving the questions!\n" + "Please reload the page and try again.");
					throw new Error('Server responded with: ' + error);
				});
			}
		});

		/*
  // temp
  $('.typed').text('60% of the time it works <em>every</em> time.');
  $('#view-lobby .typed-cursor').addClass('hide');
  $('#view-lobby .type-wrapper').addClass('slide-left');
  $('#view-lobby .player').addClass('show');
  //waitOnSpeech('citation-needed', 1500);
  	setTimeout(() => {
  	console.log(room.players);
  	for(let i in room.players) {
  		addPlayerToLobby(room.players[i]);
  	}
  }, 5000);
  getQuestionPool()
  	.then(qp => room.questionPool = qp)
  	.then(commands.triggerNextStep)
  	.catch(error => {
  		alert("Sorry, there appears to have been an error retrieving the questions!\n"
  			+ "Please reload the page and try again.");					
  		throw new Error(`Server responded with: ${error}`);
  	})
  // end temp	
  */
	},
	describeRound: function describeRound(round) {
		if (round === 1) {
			waitOnSpeech('welcome').then(function () {
				return waitOnSpeech('pre-round1');
			}).then(function () {
				return changeToView('describe-round-' + round);
			}).then(function () {
				return _revealNextInstruction(0);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-1', 1000);
			}).then(function () {
				return _revealNextInstruction(1);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-2');
			}).then(function () {
				return _revealNextInstruction(2);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-3');
			}).then(function () {
				return _revealNextInstruction(3);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-4');
			}).then(function () {
				return _revealNextInstruction(4);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-5');
			}).then(function () {
				return _revealNextInstruction(5);
			}).then(function () {
				return waitOnSpeech('guessed-appearance-desc-6');
			}).then(function () {
				return _revealNextInstruction(6);
			}).then(gameSequence.next);
		} else if (round === 2) {
			waitOnSpeech('pre-round2').then(function () {
				return changeToView('describe-round-' + round);
			}).then(function () {
				return _revealNextInstruction(0);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-1', 1000);
			}).then(function () {
				return _revealNextInstruction(1);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-2');
			}).then(function () {
				return _revealNextInstruction(2);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-3');
			}).then(function () {
				return _revealNextInstruction(3);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-4');
			}).then(function () {
				return _revealNextInstruction(4);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-5');
			}).then(function () {
				return _revealNextInstruction(5);
			}).then(function () {
				return waitOnSpeech('excerpt-opinions-desc-6');
			}).then(function () {
				return _revealNextInstruction(6);
			}).then(gameSequence.next);
		} else if (round === 3) {
			waitOnSpeech('pre-round3').then(function () {
				return changeToView('describe-round-' + round);
			}).then(function () {
				return _revealNextInstruction(0);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-1', 1000);
			}).then(function () {
				return _revealNextInstruction(1);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-2');
			}, 500).then(function () {
				return _revealNextInstruction(2);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-3');
			}, 500).then(function () {
				return _revealNextInstruction(3);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-4');
			}, 500).then(function () {
				return _revealNextInstruction(4);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-5');
			}, 500).then(function () {
				return _revealNextInstruction(5);
			}).then(function () {
				return waitOnSpeech('you-complete-me-desc-6');
			}, 500).then(function () {
				return _revealNextInstruction(6);
			}).then(gameSequence.next);
		}
		function _revealNextInstruction(index) {
			oneShotSfx("swoop-in.mp3", 500); // play swoop sound
			$('#view-describe-round-' + round + ' li').eq(index).addClass('show');
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
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
		}).then(function () {
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

		var _loop = function _loop(i) {
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
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
		}).then(function () {
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
		room.round = 3;

		var _loop2 = function _loop2(i) {
			var q = questions.splice(Math.floor(Math.random() * questions.length), 1)[0]; // select a question at random
			var p1 = players[i];
			var p2 = players[i + 1] || players[0];
			room.questions[q.id] = { question: q.excerpt, submissions: {} };
			room.questions[q.id].submissions[p1] = null;
			room.questions[q.id].submissions[p2] = null;
			room.players[p1].submissionsComplete[q.id] = false;
			room.players[p1].submissionsComplete[q.id] = false;

			wait(5000).then(function () {
				socket.emit('relay', {
					from: room.roomKey, to: p1, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 2 }
				});
				socket.emit('relay', {
					from: room.roomKey, to: p2, command: 'prepareQuestion', args: { qid: q.id, question: q.excerpt, round: 2 }
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
			oneShotSfx("swoop-in.mp3", 1200); // play swoop sound
			$('#view-answer-phase .question-anchor').addClass('reveal'); // reveal the question
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
	voting: function voting() {
		var qid = Object.keys(room.questions)[Object.keys(room.questions).length - 1];
		var q = room.questions[qid]; // get question in the final position

		console.log(room.questions);
		console.log(qid);

		if (room.round === 1) {

			// temp
			//q = {excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ornare arcu vel risus interdum mattis. Aliquam semper neque quis maximus efficitur. Sed eget aliquam est, ut aliquam erat.", submissions: {}}
			var subs = ["Archipelago", "Dances with Wolves (film)", "Acid reflux", "Quantum Leap", "Gone with the wind", "OMG (Abbreviation)", "Christmas", "Minced oath"];
			var sub_i = 0;
			var _p = null;
			//end temp

			for (var pid in room.players) {
				room.votes[pid] = null; // set every player's vote to null

				// temp
				_p = _p === null ? pid : _p;
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
		} else if (room.round === 2 || room.round === 3) {

			// temp
			//console.log(JSON.stringify(room, null, '\t'));
			var _subs = ["Archipelago", "Dances with Wolves (film)"];
			var _sub_i = 0;
			for (var _pid in q.submissions) {
				q.submissions[_pid] = _subs[_sub_i++];
			}
			// end temp			

			for (var _pid2 in room.players) {
				var send = true;
				for (var subpid in q.submissions) {
					if (_pid2 === subpid) send = false;
				}
				if (send) {
					room.votes[_pid2] = null; // set every player's vote to null
					//temp
					room.votes[_pid2] = Object.keys(q.submissions)[rand(0, Object.keys(q.submissions).length - 1)];
					//end temp
					socket.emit('relay', {
						from: room.roomKey, to: _pid2, command: 'prepareVote', args: { answers: q.submissions }
					});
				}
			}
			addContentToVotingPhase(q).then(function () {
				// temp
				addVotesToVotingPhase(room.votes);
				// end temp				
				changeToView('voting-phase');
			});
		}
		room.timer.limit = 1;
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
			revealVotesSequentially(sequence).then(gameSequence.next); // then reveal them in order			
		}
		if (room.round === 2 || room.round === 3) {
			var _scoringAnswers = $('.answer[data-will-score]'); // get all scoring answers that aren't correct
			var _sequence = shuffle($(_scoringAnswers).toArray()); // shuffle the scoring answers, and convert it to a js array			
			revealVotesSequentially(_sequence).then(gameSequence.next); // then reveal them in order
		}

		for (var pid in room.players) {
			room.players[pid].previousScore = room.players[pid].score; // set all the previous scores
		}

		for (var i in room.votes) {
			if (room.votes[i] === room.roomKey) room.players[i].score += 100; // score for correct answers
			if (room.players[room.votes[i]]) room.players[room.votes[i]].score += 100; // and for votes on players
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
		var winners = [];
		for (var pid in room.players) {
			if (room.players[pid].score > max) {
				max = room.players[pid].score;
				winners.length = 0;
				winners.push(pid);
			} else if (room.players[pid].score == max) {
				winners.push(pid);
			}
		}
		var backdrop = $('#view-leaderboard .player[data-player-id="' + winners[0] + '"]');
		var frag = fragment(backdrop[0].outerHTML);
		var tmln = new TimelineMax();

		var winningPlayers = winners.map(function (winner) {
			return room.players[winner].name;
		}).join(' and ');

		$('#view-leaderboard .winning-player').text(winningPlayers + ' win' + (winners.length > 1 ? "" : "s") + '!');
		$(frag).find('.content-wrapper').remove();
		$(frag).find('.player').addClass('backdrop').css({ position: 'fixed', transform: 'none', top: backdrop.offset().top, left: backdrop.offset().left, right: 'auto', bottom: 'auto', zIndex: 100, margin: 0 }).appendTo('#view-leaderboard');

		// change this animation sequence
		// endgame winner announcement should NOT be fixed position
		tmln.to('#view-leaderboard .backdrop', 0.5, { top: 0, right: 0, bottom: 0, left: 0, width: $(window).width(), height: $(window).width(), borderRadius: 0, ease: Power4.easeInOut }).set('#view-leaderboard .backdrop', { width: 'auto', height: 'auto' }).to('#view-leaderboard .winning-player', 0.8, { top: '40%', ease: Power4.easeInOut, onStart: oneShotSfx, onStartParams: ["endgame-muzak.mp3", "250"] });
		//	.to('#view-leaderboard .winning-player', 0.5, { autoAlpha: 0, ease: Power4.easeInOut, delay: 2 })
		//	.to('#view-leaderboard .backdrop', 1, { top: '100%', ease: Power4.easeInOut, onComplete: gameSequence.next }, "-=0.5")
	},
	todo: function todo() {
		changeToView('todo');
	}
};

/*
	gameSequence: the game sequence object represents the discrete steps that make up the game
*/

var gameSequence = {
	current: -1,
	steps: [],
	next: function next() {
		var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		setTimeout(function () {
			gameSequence.steps[++gameSequence.current](args);
		}.bind(gameSequence), 1100);
	}
};

/*
	generateGameSequence: called when the game is initialised
	establishes how many voting & scoring phases are necessary (based on the number of players)
	and pushes these steps to the gameSequence steps[] array
*/

function generateGameSequence() {
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 1));
	//gameSequence.steps.push(gamePhases.guessTheArticle);
	//gameSequence.steps.push(gamePhases.voting);
	//gameSequence.steps.push(gamePhases.scoring);
	//gameSequence.steps.push(gamePhases.leaderboard);
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 2));	
	//gameSequence.steps.push(gamePhases.excerptBattle);
	for (var i in room.players) {}
	//gameSequence.steps.push(gamePhases.voting);
	//gameSequence.steps.push(gamePhases.scoring);

	//gameSequence.steps.push(gamePhases.leaderboard);
	//gameSequence.steps.push(gamePhases.describeRound.bind(null, 3));
	gameSequence.steps.push(gamePhases.editBattle);
	for (var _i in room.players) {
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
		for (var _i2 in room.questions) {
			// then iterate through the room questions
			for (var j in room.questions[_i2].submissions) {
				// making sure they're all done
				if (room.questions[_i2].submissions[j] === null) questionsComplete = false;
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
	oneShotSfx("new-player-jingle.mp3", 1250);
}

/*
	addContentToAnswerPhase: add the answers randomly (using an object keys shuffle) to the voting phase view
	this is necessary to obscure the answer's owner
*/

function addContentToAnswerPhase(question, phoneVisible) {
	return new Promise(function (resolve, reject) {
		var vcFrag = fragment($('#template-answer-phase-content').html());
		if (phoneVisible) $(vcFrag).find('.answer-phase-content').addClass('phone-visible');
		$(vcFrag).find('.answer-phase-content .question').html(question);
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
		$(fragVc).find('.question').html(q.question); // set the quesiton on this view	
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
		tmln.to('#view-voting-phase .queued', 1, {
			top: 0,
			ease: Power4.easeOut,
			onStart: oneShotSfx,
			onStartParams: ["swoop-in.mp3"],
			onComplete: function onComplete() {
				return $('.voting-phase-content').not('.queued').remove();
			}
		}).set('#view-voting-phase .queued', { className: '-=queued', onComplete: resolve });
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

		tmln.staggerTo( // reveal the votes
		$(answer).find('.vote'), staggerDuration, { width: '100%', ease: Power4.easeOut, delay: 2, onStart: _incrementalVoteSfx, onStartParams: ["{self}"] }, offset * -1).to(answer, floatDuration, { y: '-=' + 15 * votes + 'px', ease: Power2.easeOut }, '-=' + floatDuration) // rise the answer proportionately
		.to(answer, 0.6, { y: 0, ease: Power4.easeInOut, delay: 1 }) // then slam the answer down
		.staggerTo( // float the score up
		$(answer).find('.score'), 1.5, { y: "-=200px", ease: Power3.easeOut, onStart: oneShotSfx, onStartParams: ["score-jingle.mp3", "250"] }, offset, "-=0.6").staggerTo($(answer).find('.score'), 0.5, { opacity: 1, ease: Power3.easeIn }, offset, '-=' + (correctFloat + 1.5)) // with a fade in
		.staggerTo($(answer).find('.score'), 1, { opacity: 0, ease: Power2.easeOut }, offset, '-=' + (correctFloat + 0.5), resolve); // after fade out, resolve the promise

		function _incrementalVoteSfx(tween) {
			oneShotSfx('vote-beep-pitch' + (votes - 1 - $(tween.target).index()) + '.mp3');
		}
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
	.from( // and move it into view
	countdown + ' .white-box', 0.3, { x: 100, ease: Power4.easeInOut, onStart: oneShotSfx, onStartParams: ["timeout-whistle.mp3"] }, '-=0.4');
}

/*
	updateLeaderboard: updates the circular leaderboard with a nice scale/offset proportionate to score
*/

function updateLeaderboard() {
	return new Promise(function (resolve, reject) {
		var totalScore = 0;
		var averageScore = 0;
		var morphSounds = ["morph-1.mp3", "morph-2.mp3", "morph-3.mp3", "silence", "silence"];
		for (var pid in room.players) {
			totalScore += room.players[pid].score;
		}
		averageScore = totalScore / Object.keys(room.players).length; // mean of the scores

		var _loop3 = function _loop3(_pid3) {
			var $player = $('#view-leaderboard .player[data-player-id="' + _pid3 + '"]'); // get this player from the DOM
			var offset = (room.players[_pid3].score - averageScore) / 2 * -1; // calculate the y offset based on deviation from the mean
			var percent = room.players[_pid3].score / totalScore * (100 / 4) + '%'; // calculate percentage width as a ratio of the total score
			var tmln = new TimelineMax();
			var initialWidth = $player.width(); // get the initial width of the player circles
			var newWidth = void 0;

			$player.find('.score').text(room.players[_pid3].score); // set the player's score in the view

			tmln.set($player, { width: percent, onComplete: function onComplete() {
					// first, set the width as percentage
					newWidth = $player.width(); // in order to get absolute in pixels						
				}
			}).set($player, { width: initialWidth }) // then set it back to it's initial width, ready for tweening
			.to($player, 4, { height: newWidth, width: newWidth, ease: Power3.easeInOut, delay: 0.5 }) // tween the width and height
			.to($player, 3, { y: offset, ease: Power3.easeInOut, onStart: _playRandomMorph }, "-=3") // and tween the y offset
			.staggerTo('#view-leaderboard .content-wrapper', 1.2, { opacity: 1, ease: Power4.easeInOut }, 0.1, 3, resolve); // then fade in the player names
		};

		for (var _pid3 in room.players) {
			_loop3(_pid3);
		}
		function _playRandomMorph() {
			var randSound = morphSounds[rand(0, morphSounds.length - 1)];
			randSound == "silence" ? null : oneShotSfx(randSound, 500);
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
		$.getJSON('js/questions.json', function (data) {
			resolve(data);
		}).fail(function (e) {
			if (e.status == 200) {
				resolve(JSON.parse(e.responseText));
			} else {
				reject(e.statusText);
			}
		});
	});
}

/*
	changeToView: helper function for switching the view (and obscuring the others during the transition)
*/

function changeToView(view) {
	if ($('#view-container').attr('data-current-view') == view) return;
	$('.view').removeClass('obscure').not('#view-' + view).addClass('obscure'); // obscure the inactive views
	$('#view-container').attr('data-current-view', view); // transition to the new active view
	oneShotSfx("swoop-out.mp3", 500);
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
	    temporaryValue = void 0,
	    randomIndex = void 0;
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
	var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

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
	var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

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
	oneShot: play audio immediately
*/

function oneShotSfx(name) {
	var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;

	//console.log(name);
	var audio = new Audio('../audio/sfx/' + name);
	setTimeout(function (e) {
		return audio.play();
	}, delay);
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