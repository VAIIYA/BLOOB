'use strict';

var express = require ('express'),
	app = express ();

var util = require ('util'),
	socketIO = require ('socket.io'),
	Player = require ('./Player').Player;
	
var socket,
	players,
	bullets;

var path = require('path');

var PORT = process.env.PORT || 8000;
var INDEX = path.join(__dirname, 'public/index.html');

var server,
	io;

app.use(express.static(__dirname + '/public'));

function init () {
	players = [];
	bullets = [];

//	socket = io.listen (8000);
	server = express ()
		.use((req, res) => res.sendFile(INDEX) )
		.listen(PORT, () => util.log(`Listening on ${ PORT }`));

	io = socketIO (server);

	setEventHandlers ();
}



var setEventHandlers = function () {
	io.on ('connection', onSocketConnection);
};

function onSocketConnection (client) {
	util.log ('New player has connected: ' + client.id);

	client.on ('disconnect', onClientDisconnect);
	client.on ('new player', onNewPlayer);
	client.on ('move player', onMovePlayer);
	client.on ('size player', onSizePlayer);
	client.on ('kill player', onKillPlayer);
}

function onClientDisconnect() {
	util.log ('Player has disconnected: ' + this.id);
	
	var removePlayer = playerById(this.id);

	if (!removePlayer) {
	    util.log("Player not found: "+this.id);
	    return;
	};

	players.splice(players.indexOf(removePlayer), 1);
	this.broadcast.emit("remove player", {id: this.id});
};

function onNewPlayer(data) {
	var newPlayer = new Player (data.x, data.y, data.r);
	newPlayer.id = this.id;

	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), r: data.r});

	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];

		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), r: existingPlayer.getR()});
	};

	this.emit ("local id", {id: this.id});

	players.push (newPlayer);
};

function onMovePlayer(data) {
	var movePlayer = playerById(this.id);

	if (!movePlayer) {
	    util.log("Player not found: " + this.id);
	    return;
	};

	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};

function onSizePlayer (data) {
	var sizePlayer = playerById (this.id);

	if (!sizePlayer) {
		util.log("Player not found: " + this.id);
	    return;
	}

	sizePlayer.setR (data.radius);

	this.broadcast.emit('size player', {radius: data.radius, id: this.id});
}

function onKillPlayer (data) {
	var removePlayer = playerById(data.id);

	if (!removePlayer) {
	    util.log("Player not found: " + data.id);
	    return;
	};

	this.emit("kill player", {id: data.id});
	this.broadcast.emit("kill player", {id: data.id});
	players.splice(players.indexOf(removePlayer), 1);
	
}

init ();

function playerById(id) {
    var i;
    for (i = 0; i < players.length; i++) {
        if (players[i].id == id)
            return players[i];
    };

    return false;
};