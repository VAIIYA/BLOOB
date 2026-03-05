/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer;	// Local player

var remotePlayers;

var socket;

var PORT = 8000;	

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	/********************/
	//PORT = process.env.PORT || 8000;
	/********************/

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the edge of the screen
	var startX = Math.round(Math.random()*(canvas.width-10)),
		startY = Math.round(Math.random()*(canvas.height-10));

	// Initialise the local player
	localPlayer = new Player(startX, startY, 5);

	socket = io.connect("http://localhost:8000" , {port: PORT, transports: ["websocket"]});

	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Mouse click
	window.addEventListener("click", onMouseClick, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnect);

	socket.on ("local id", onLocalId);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
	socket.on("size player", onSizePlayer);
	socket.on ('kill player', onKillPlayer);
};

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

function onMouseClick (e) {
	if (localPlayer) {
		//localPlayer.setR (10);
	}
}


// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};

function onSocketConnected() {
    console.log("Connected to socket server");

    socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), r: localPlayer.getR()});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onNewPlayer(data) {
    console.log("New player connected: " + data.id);

	var newPlayer = new Player(data.x, data.y, data.r);
	newPlayer.id = data.id;
	remotePlayers.push(newPlayer);
};

function onLocalId (data) {
	localPlayer.id = data.id;
	console.log ("my id is " + localPlayer.id);
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	if (!movePlayer) {
	    console.log("Player not found: " + data.id);
	    return;
	};

	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
};

function onSizePlayer(data) {
	console.log ("size player: " + data.id);
	var sizePlayer = playerById (data.id);

	if (!sizePlayer) {
	    console.log("Player not found: " + data.id);
	    return;
	};

	console.log (data.radius);
	sizePlayer.setRemoteR (data.radius);

}

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	if (!removePlayer) {
	    console.log("Player not found: " + data.id);
	    return;
	};

	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
	console.log ('removed player: ' + data.id);
};

function onKillPlayer (data) {
	var removePlayer = playerById(data.id);

	if (!removePlayer) {
		if (data.id === localPlayer.id) {
			killLocalPlayer ();
		} else {
		    console.log("Player not found: " + data.id);
		    return;
		}
	};

	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
}

/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
/*
	UPDATE RETURN VALUES
	0 - no change in radius or position
	1 - change in radius ONLY
	2 - change in position ONLY
	3 - change in radius AND position
	
*/
function update() {
	var updateVal = localPlayer.update (keys);

	if (updateVal === 1) {
		socket.emit ("size player", {radius: localPlayer.getR ()});
	} else if (updateVal === 2) {
    	socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
	} else if (updateVal === 3) {
		socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
		socket.emit ("size player", {radius: localPlayer.getR ()});
	}

	for (var i = 0; i < remotePlayers.length; i++) {
	    if (remotePlayers[i].getR () >= localPlayer.getR ()) {
	    	continue;
	    }

	    if (isCircleInside (localPlayer.getX (), localPlayer.getY (), localPlayer.getR (), remotePlayers[i].getX (), remotePlayers[i].getY(), remotePlayers[i].getR ())) {
	    	console.log ("a circle is inside me!");
	    	localPlayer.setR (localPlayer.getR()+remotePlayers[i].getR());
	    	socket.emit ("kill player", {id: remotePlayers[i].id});
	    }
 	};
};


/**************************************************
** GAME DRAW
**************************************************/
function draw() {

	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the local player
	ctx.fillStyle='#FF0000';
	localPlayer.draw(ctx);
	ctx.fillStyle='#000000';

	for (var i = 0; i < remotePlayers.length; i++) {
	    remotePlayers[i].draw(ctx);
	};
};

function killLocalPlayer () {
	var startX = Math.round(Math.random()*(canvas.width-10)),
		startY = Math.round(Math.random()*(canvas.height-10));

	localPlayer = new Player(startX, startY, 5);
	remotePlayers = [];

	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY(), r: localPlayer.getR ()});
}

function playerById(id) {
    var i;
    for (i = 0; i < remotePlayers.length; i++) {
        if (remotePlayers[i].id == id)
            return remotePlayers[i];
    };

    return false;
};

function collide(x1, y1, w1, h1, x2, y2, w2, h2) {
	if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && h1 + y1 > y2) {
    	return true;
	}

	return false;
};

function isCircleInside (x1, y1, r1, x2, y2, r2) {
	var distance = Math.sqrt ((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));

	if (distance > r1 + r2) {
		return false;
	}

	return (distance <= Math.abs (r1-r2)) ? true : false;
}