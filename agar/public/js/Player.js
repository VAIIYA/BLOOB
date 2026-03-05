/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, r) {
	var x = startX,
		y = startY,
		radius = r,
		newRadius = r,
		id,
		dead = false,
		moveAmount = 10 / radius + 2;

	var getX = function() {
	    return x;
	};

	var getY = function() {
	    return y;
	};

	var setX = function(newX) {
	    x = newX;
	};

	var setY = function(newY) {
	    y = newY;
	};

	var setR = function (newR) {
		newRadius = newR;
	}

	var setRemoteR = function (newR) {
		newRadius = newR;
		radius = newR;
	}

	var getR = function () {
		return radius;
	}

	var isDead = function () {
		return dead;
	}

	var setDead = function (deadbool) {
		dead = deadbool;
	}

	var lerp = function (a, b, f)
	{
    	return a + f * (b - a);
	}

	var changeRadius = function () {
		if (radius != newRadius) {
			if (!(radius > newRadius && radius - 0.01 <= newRadius) && !(radius < newRadius && radius + 0.01 >= newRadius)) {
				radius = lerp (radius, newRadius, 0.1);
				moveAmount = 10 / radius + 0.5;
			} else {
				radius = newRadius;
			}
			return true;
		}

		return false;
	}

	var update = function(keys) {
		/*
			RETURN VALUES
			0 - no change in radius or position
			1 - change in radius only
			2 - change in position only
			3 - change in radius and position
	
		*/
		var retval = 0;

		retval += (changeRadius ()) ? 1 : 0;

		var prevX = x,
    		prevY = y;

		// Up key takes priority over down
		if (keys.up && y - radius - moveAmount >= 0) {
			y -= moveAmount;
		} else if (keys.down && y + radius + moveAmount <= canvas.height) {
			y += moveAmount;
		};

		// Left key takes priority over right
		if (keys.left && x - radius - moveAmount >= 0) {
			x -= moveAmount;
		} else if (keys.right && x + radius + moveAmount <= canvas.width) {
			x += moveAmount;
		};

		retval += (prevX != x || prevY != y) ? 2 : 0;

		//return (prevX != x || prevY != y) ? true : false;
		return retval;
	};

	var draw = function(ctx) {
		ctx.beginPath();
		ctx.arc (x, y, radius, 0, 2*Math.PI);
		ctx.closePath();
		ctx.fill();
	};

	return {
		getX: getX,
		getY: getY,
		getR: getR,
		setX: setX,
		setY: setY,
		setR: setR,
		setRemoteR: setRemoteR,
		setDead: setDead,
		isDead: isDead,
		
		id: id,

		update: update,
		draw: draw
	}
};