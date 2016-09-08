'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

// GET request to create room
router.get('/room', (req, res, next) => {
	res.sendFile('public/room.html', { root: path.resolve(__dirname, '../') });
})
// GET player form
router.get('/player', (req, res, next) => {
	res.sendFile('public/player.html', { root: path.resolve(__dirname, '../') });
})

function ioRouter(io) {

	let nsp = { players: io.of('/player'), rooms: io.of('/room') }; // register socket namespaces
	
	// Handle room connection
	nsp.rooms.on('connection', socket => {
		socket.on('register', roomKey => {
			socket.join(roomKey); // register this socket to the room with roomKey
			socket.emit('room-registered', roomKey); // emit room-registered to this room (lobby)
	    })
	    socket.on('disconnect', () => {	    	
		
		})
		socket.on('relay', message => {
			nsp.players.to(message.to).emit('relay', message); // relay message from room to player
	    })
    })

	// Handle player connection
	nsp.players.on('connection', socket => {
		socket.on('register', player => { 
			socket.join(player.roomKey); // register this socket to the room with roomKey
			nsp.rooms.to(player.roomKey).emit('player-registered', player); // emit player-registered to this room
			socket.emit('player-registered', player.roomKey); // emit player-registered to this player
	    })
	    socket.on('disconnect', () => {

		})
	    socket.on('relay', message => {
	    	nsp.rooms.to(message.to).emit('relay', message); // relay message from player to room
	    })
    })

	return router;
}

module.exports = ioRouter;
