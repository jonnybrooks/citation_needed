'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

let rooms = {};
let roomsHashmap = {};

// GET request to create room
router.get('/room', (req, res, next) => {
	res.sendFile('public/index.html', { root: path.resolve(__dirname, '../') });
})
// GET player form
router.get('/player', (req, res, next) => {
	res.sendFile('public/player.html', { root: path.resolve(__dirname, '../') });
})

function ioRouter(io) {

	let nsp = { players: io.of('/player'), rooms: io.of('/room') }; // socket namespaces
	
	// Handle room connection
	nsp.rooms.on('connection', socket => {
		socket.on('create', conf => {
			let r = new Room({ _socketId: socket.id, _roomKey: conf._roomKey });
			socket.join(conf._roomKey); // register this socket to the room with _roomKey
			rooms[r._roomKey] = r; // add this room to the rooms hashmap
			roomsHashmap[socket.id] = r._roomKey; // add this roomkey to the hashmap			
	    })
	    socket.on('disconnect', () => {
	    	nsp.players.to(roomsHashmap[socket.id]).emit('force-disconnect'); // emit force-disconnect to all players in this socket's room
	    	delete rooms[roomsHashmap[socket.id]]; // delete this room from the rooms object
	    	delete roomsHashmap[socket.id]; // and thus from the hashmap
		})
    })

	// Handle player connection
	nsp.players.on('connection', socket => {
		socket.on('create', conf => { 
			let p = new Player({ _socketId: socket.id, _roomKey: conf._roomKey, name: conf.name });
			socket.join(conf._roomKey); // register this socket to the room with _roomKey
			rooms[conf._roomKey].players[socket.id] = p; // add player to the rooms object

			nsp.rooms.to(conf._roomKey).emit('player-connect', {player: p}); // emit player-connect to this room (lobby)
			socket.emit('enter-lobby', {player: p}); // emit player-connect to this room (lobby)

	    })
    })

	return router;
}

function Room(conf) {
	return {
		_socketId: conf._socketId,
		_roomKey: conf._roomKey,
		maxPlayers: 6,		
		players: {}
	}
}

function Player(conf) {
	return {
		_socketId: conf._socketId,		
		_roomKey: conf._roomKey,
		name: conf.name,
		host: Object.keys(rooms[conf._roomKey].players).length === 0,
	}
}

module.exports = ioRouter;
