// Generated by CoffeeScript 1.9.3
(function() {
  var GameServer, Lobby, fs, ini, ws;

  ws = require('ws');

  fs = require('fs');

  ini = require('./modules/ini.js');

  GameServer = require('./GameServer');

  Lobby = (function() {
    function Lobby() {
      this.config = {
        serverMaxConnections: 64,
        serverPort: 443,
        serverGamemode: 0,
        serverBots: 0,
        serverViewBaseX: 1024,
        serverViewBaseY: 592,
        serverStatsPort: 88,
        serverStatsUpdate: 60,
        serverLogLevel: 1,
        roomMaxConnections: 32,
        borderLeft: 0,
        borderRight: 6000,
        borderTop: 0,
        borderBottom: 6000,
        spawnInterval: 20,
        foodSpawnAmount: 10,
        foodStartAmount: 100,
        foodMaxAmount: 500,
        foodMass: 1,
        virusMinAmount: 10,
        virusMaxAmount: 50,
        virusStartMass: 100,
        virusFeedAmount: 7,
        ejectMass: 12,
        ejectMassLoss: 16,
        ejectSpeed: 160,
        ejectSpawnPlayer: 50,
        playerStartMass: 10,
        playerMaxMass: 22500,
        playerMinMassEject: 32,
        playerMinMassSplit: 36,
        playerMaxCells: 16,
        playerRecombineTime: 30,
        playerMassDecayRate: .002,
        playerMinMassDecay: 9,
        playerMaxNickLength: 15,
        playerDisconnectTime: 60,
        tourneyMaxPlayers: 12,
        tourneyPrepTime: 10,
        tourneyEndTime: 30,
        tourneyTimeLimit: 20,
        tourneyAutoFill: 0,
        tourneyAutoFillPlayers: 1
      };
      this.loadConfig();
      this.rooms = [];
    }

    Lobby.prototype.loadConfig = function() {
      var err, parameter, savedConfig;
      try {
        savedConfig = ini.parse(fs.readFileSync('./gameserver.ini', 'utf-8'));
        for (parameter in savedConfig) {
          this.config[parameter] = savedConfig[parameter];
        }
      } catch (_error) {
        err = _error;
        console.log("[Lobby] Config not found... Generating new config");
        fs.writeFileSync('./gameserver.ini', ini.stringify(this.config));
      }
      return 0;
    };

    Lobby.prototype.start = function() {
      var connectionEstablished, serverParameters;
      console.log("[Lobby] Starting Lobby");
      serverParameters = {
        port: this.config.serverPort,
        perMessageDeflate: false
      };
      this.socketServer = new ws.Server(serverParameters, (function(_this) {
        return function() {
          return console.log("[Lobby] Listening on port " + _this.config.serverPort);
        };
      })(this));
      connectionEstablished = (function(_this) {
        return function(ws) {
          var gameRoom, i, len, playerInGame, ref, room;
          playerInGame = false;
          ref = _this.rooms;
          for (i = 0, len = ref.length; i < len; i++) {
            room = ref[i];
            if (room.clients.length < _this.config.roomMaxConnections) {
              console.log("[Lobby] Adding player to existiong room");
              room.addPlayer(ws);
              playerInGame = true;
              break;
            }
          }
          if (!playerInGame) {
            console.log("[Lobby] Creating new room");
            gameRoom = new GameServer(_this);
            gameRoom.start(_this.config);
            _this.rooms.push(gameRoom);
            return gameRoom.addPlayer(ws);
          }
        };
      })(this);
      this.socketServer.on('connection', connectionEstablished.bind(this));
      this.socketServer.on('error', function(err) {
        switch (err) {
          case "EADDRINUSE":
            console.log("[Error] Server could not bind to port! Please close out of Skype or change 'serverPort' in gameserver.ini to a different number.");
            break;
          case "EACCES":
            console.log("[Error] Please make sure you are running Ogar with root privileges.");
            break;
          default:
            console.log("[Error] Unhandled error code: " + err.code);
        }
        process.exit(1);
        return 0;
      });
      return 0;
    };

    return Lobby;

  })();

  module.exports = Lobby;

}).call(this);

//# sourceMappingURL=Lobby.js.map
