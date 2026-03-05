var Player = function (startX, startY, r) {
	var x = startX,
		y = startY,
        radius = r,
		id;

    var getX = function() {
        return x;
    };

    var getY = function() {
        return y;
    };

    var getR = function() {
        return radius;
    }

    var setX = function(newX) {
        x = newX;
    };

    var setY = function(newY) {
        y = newY;
    };

    var setR = function(newR) {
        radius = newR;
    };

    return {
        getX: getX,
        getY: getY,
        getR: getR,
        setX: setX,
        setY: setY,
        setR: setR,
        id: id
    };
};

exports.Player = Player;