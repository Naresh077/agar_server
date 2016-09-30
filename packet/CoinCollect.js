function CoinCollect(count) {
    this.count = count;
}

module.exports = CoinCollect;

CoinCollect.prototype.build = function() {
    // Only add player controlled cells with this packet or it will bug the camera
    var buf = new ArrayBuffer(5);
    var view = new DataView(buf);

    view.setUint8(0, 99, true);
    view.setUint32(1, this.count, true);

    return buf;
};

