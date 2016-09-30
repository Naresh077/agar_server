var Packet = require('./packet');

function PacketHandler(gameServer, socket) {
    this.gameServer = gameServer;
    this.socket = socket;
    // Detect protocol version - we can do something about it later
    this.protocol = 0;

    this.pressQ = false;
    this.pressW = false;
    this.pressSpace = false;
}

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function(message) {
    function stobuf(buf) {
        var length = buf.length;
        var arrayBuf = new ArrayBuffer(length);
        var view = new Uint8Array(arrayBuf);

        for (var i = 0; i < length; i++) {
            view[i] = buf[i];
        }

        return view.buffer;
    }

    // Discard empty messages
    if (message.length == 0) {
        return;
    }

    var buffer = stobuf(message);
    // console.log("BUFFER : " + buffer)
    var view = new DataView(buffer);
    var packetId = view.getUint8(0, true);

    switch (packetId) {

        //-------------------------------
        // powers packets
        //-------------------------------
        
        // shiled power added
        // format -> 31678
        case 31:
            console.log("-----------------------------------------------------------")
            console.log("       PLAYER GOT SHIELD        ")
            console.log("-----------------------------------------------------------")
            var playerId = view.getUint32(1, true);
            console.log("playerId=" + playerId);
            this.gameServer.addShield(playerId);
            console.log("---------- Shileded Players -------------------------------"+ this.gameServer.powerShieldPlayers)

        break;

        // shiled power removed
        // format -> 32678
        case 32:

            console.log("-----------------------------------------------------------")
            console.log("       PLAYER REMOVED SHIELD        ")
            console.log("-----------------------------------------------------------")
            var playerId = view.getUint32(1, true);
            console.log("playerId=" + playerId);
            this.gameServer.removeShield(playerId);
            console.log("---------- Shileded Players -------------------------------"+ this.gameServer.powerShieldPlayers)
        break;


        // spawn packet
        case 0:
            // Check for invalid packets
            if ((view.byteLength + 1) % 2 == 1) {
                break;
            }

            console.log("------------------------------------- GOT SPAWN PACKET ------");

            // Set Nickname
            var nick = "";
            var maxLen = this.gameServer.config.playerMaxNickLength * 2; // 2 bytes per char
            for (var i = 1; i < view.byteLength && i <= maxLen; i += 2) {
                var charCode = view.getUint16(i, true);
                if (charCode == 0) {
                    break;
                }

                nick += String.fromCharCode(charCode);
            }
            console.log("[PacketHandler] nick name: " + nick)
            this.setNickname(nick);
            break;
        case 1:
            // Spectate mode
            if (this.socket.playerTracker.cells.length <= 0) {
                // Make sure client has no cells
                this.gameServer.switchSpectator(this.socket.playerTracker);
                this.socket.playerTracker.spectate = true;
            }
            break;
        case 16:
            // Discard broken packets
            if (view.byteLength == 21) {
                // Mouse Move
                var client = this.socket.playerTracker;
                client.mouse.x = view.getFloat64(1, true);
                client.mouse.y = view.getFloat64(9, true);
                //console.log("-- x=" + client.mouse.x + ", y=" + client.mouse.y)
            }
            break;
        case 17:
            // Space Press - Split cell
            this.pressSpace = true;
            break;
        case 18:
            // Q Key Pressed
            this.pressQ = true;
            break;
        case 19:
            // Q Key Released
            break;
        case 21:
            // W Press - Eject mass
            this.pressW = true;
            break;
        case 255:
            // Connection Start 
            if (view.byteLength == 5) {
                this.protocol = view.getUint32(1, true);
                // Send SetBorder packet first
                var c = this.gameServer.config;
                this.socket.sendPacket(new Packet.SetBorder(c.borderLeft, c.borderRight, c.borderTop, c.borderBottom));
            }
            break;
        default:
            break;
    }
};

PacketHandler.prototype.setNickname = function(newNick) {
    console.log("xxxxxxxx PacketHandler setNickname() xxxxxxxx");
    var client = this.socket.playerTracker;
    if (client.cells.length < 1) {
        // Set name first
        client.setName(newNick); 

        // If client has no cells... then spawn a player
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer,client);

        // Turn off spectate mode
        client.spectate = false;
    }
};

