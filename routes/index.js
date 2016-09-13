'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

let rooms = {};
let roomKeyMap = {};

// GET request to create room
router.get('/room', (req, res, next) => {
	res.sendFile('public/room.html', { root: path.resolve(__dirname, '../') });
})
// GET player form
router.get('/player', (req, res, next) => {
	res.sendFile('public/player.html', { root: path.resolve(__dirname, '../') });
})

module.exports = io => {

	let nsp = { players: io.of('/player'), rooms: io.of('/room') }; // register socket namespaces
	
	// Handle room connection
	nsp.rooms.on('connection', socket => {

		let room = new Room({
			socketId: socket.id,
			roomKey: genRoomKey(4),			
			minPlayers: 1,
			maxPlayers: 2
		});

		rooms[socket.id] = room;
		roomKeyMap[room.roomKey] = socket.id;

		socket.join(room.roomKey); // register this room to the socket room with roomKey
		socket.emit('room-registered', room); // notify the room client it's been registered

		socket.on('relay', message => {
			nsp.players.to(message.to).emit('relay', message); // relay message from room to player
	    })
    })

	// Handle player connection
	nsp.players.on('connection', socket => {
		socket.on('attempt-registration', reg => {
			let room = rooms[roomKeyMap[reg.roomKey]];

			if(Object.keys(room.players).length < room.maxPlayers) {
				
				let player = new Player({
					socketId: socket.id,
					roomKey: reg.roomKey,
					name: reg.name
				})

				room.players[socket.id] = player;				

				socket.join(player.roomKey); // register this player to the room with roomKey
				socket.emit(player.roomKey).emit('player-registered', player); // notify the player client it's been registered
				nsp.rooms.to(player.roomKey).emit('player-registered', player); // notify the room client a new player registered
			}
			else {
				socket.emit('player-refused'); // emit player-registered to this room
			}
	    })
	    socket.on('relay', message => {
	    	nsp.rooms.to(message.to).emit('relay', message); // relay message from player to room
	    })
    })

	return router;
}

function genRoomKey(len) {
	function genKey() {		
		let k = '';
		for(let i = 0; i < len; i++) k+=Math.floor(Math.random() * 10);		
		return k;
	}
	let rk = genKey();
	while(roomKeyMap.hasOwnProperty(rk)) rk = genKey();
	roomKeyMap[rk] = true;
	return rk;
}

function Room(conf) {
	this.socketId = conf.socketId;
	this.roomKey = conf.roomKey;
	this.maxPlayers = conf.maxPlayers;
	this.minPlayers = conf.minPlayers;
	this.players = {};
	this.questions = {};
	this.timer = null;
}

function Player(conf) {	
	this.socketId = conf.socketId;
	this.roomKey = conf.roomKey;
	this.name = conf.name;
	this.submissionsComplete = {};
}