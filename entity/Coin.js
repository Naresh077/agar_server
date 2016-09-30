var Cell = require('./Cell');

function Coin() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 4;
    this.size = Math.ceil(Math.sqrt(100 * this.mass));
    this.size = 13
}

module.exports = Coin;
Coin.prototype = new Cell();

Coin.prototype.getSize = function() {
    return this.size;
};

Coin.prototype.calcMove = null; // Coin has no need to move

// Main Functions

Coin.prototype.sendUpdate = function() {
    // Whether or not to include this cell in the update packet
    if (this.moveEngineTicks == 0) {
        return false;
    }
    return true;
};

Coin.prototype.onRemove = function(gameServer) {
    gameServer.currentCoin--;
};

Coin.prototype.onConsume = function(consumer,gameServer) {
     consumer.addCoin(1);
};

