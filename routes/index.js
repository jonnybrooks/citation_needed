'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

let roomKeyStore = {};

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
		let roomKey = genRoomKey(4);
		socket.join(roomKey); // register this room to the socket room with roomKey
		socket.emit('room-registered', roomKey);

		socket.on('registration-accept', player => {
			let pSocket = io.sockets.connected[player.socketId]; // get player attempting to register
			pSocket.join(player.roomKey); // register this player to the room with roomKey
			nsp.players.to(player.socketId).emit('player-registered', player.roomKey); // emit player-registered to this room
			socket.emit('player-registered', player.roomKey); // emit player-registered to this room			
	    })
		socket.on('registration-reject', player => {			
			nsp.players.to(player.socketId).emit('player-refused'); // emit player-registered to this room
	    })
		socket.on('disconnect', () => {
		
		})
		socket.on('relay', message => {
			nsp.players.to(message.to).emit('relay', message); // relay message from room to player
	    })
    })

	// Handle player connection
	nsp.players.on('connection', socket => {
		socket.on('attempt-registration', player => {
			nsp.rooms.to(player.roomKey).emit('register-player', player);
	    })
	    socket.on('disconnect', () => {

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
	while(roomKeyStore.hasOwnProperty(rk)) rk = genKey();
	roomKeyStore[rk] = true;
	return rk;
}