'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

let rooms = {};

function ioRouter(io) {

	//TODO set up socket.io namespacing

	// GET lobby
	router.get('/lobby', function(req, res, next) {
		res.sendFile('public/index.html', { root: path.resolve(__dirname, '../') });
	})
	// GET player form
	router.get('/player', function(req, res, next) {
		res.sendFile('public/player.html', { root: path.resolve(__dirname, '../') });
	})
	// Handle socket connection
	io.on('connection', function(socket) {
		socket.emit('established');
		socket.on('create', function(conf) { 
			if(conf.type === 'room') {
				console.log('creating room');
				rooms = {};
				let r = new Room({ _socketId: socket.id, _roomKey: conf._roomKey });
				rooms[r._roomKey] = r;
			}
			else {
				console.log('creating player');
				let p = new Player({ _socketId: socket.id, _roomKey: conf._roomKey, name: conf.name });
				rooms[conf._roomKey].players[socket.id] = p;
				console.log(JSON.stringify(rooms));
			}
	    })
	    socket.on('disconnect', function () {
		    io.emit('player disconnected');
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
