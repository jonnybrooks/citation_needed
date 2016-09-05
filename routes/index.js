var express = require('express');
var router = express.Router();

function ioRouter(io) {
	// GET home
	router.get('/', function(req, res, next) {
		res.sendFile('./public/index.html');
	})
	// Handle socket connection
	io.on('connection', function(socket) { 
		console.log('established');
    })
	return router;
}

module.exports = ioRouter;
