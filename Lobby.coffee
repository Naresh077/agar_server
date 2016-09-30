ws = require 'ws'
fs = require 'fs'
ini = require './modules/ini.js'
GameServer = require './GameServer'

class Lobby
  constructor: () ->

    @config = # Border - Right: X increases, Down: Y increases (as of 2015-05-20)
      serverMaxConnections: 64, # Maximum amount of connections to the server.
      serverPort: 443, # Server port
      serverGamemode: 0, # Gamemode, 0 = FFA, 1 = Teams
      serverBots: 0, # Amount of player bots to spawn
      serverViewBaseX: 1024, # Base view distance of players. Warning: high values may cause lag
      serverViewBaseY: 592,
      serverStatsPort: 88, # Port for stats server. Having a negative number will disable the stats server.
      serverStatsUpdate: 60, # Amount of seconds per update for the server stats
      serverLogLevel: 1, # Logging level of the server. 0 = No logs, 1 = Logs the console, 2 = Logs console and ip connections
      roomMaxConnections: 32,
      borderLeft: 0, # Left border of map (Vanilla value: 0)
      borderRight: 6000, # Right border of map (Vanilla value: 11180.3398875)
      borderTop: 0, # Top border of map (Vanilla value: 0)
      borderBottom: 6000, # Bottom border of map (Vanilla value: 11180.3398875)
      spawnInterval: 20, # The interval between each food cell spawn in ticks (1 tick = 50 ms)
      foodSpawnAmount: 10, # The amount of food to spawn per interval
      foodStartAmount: 100, # The starting amount of food in the map
      foodMaxAmount: 500, # Maximum food cells on the map
      foodMass: 1, # Starting food size (In mass)
      virusMinAmount: 10, # Minimum amount of viruses on the map.
      virusMaxAmount: 50, # Maximum amount of viruses on the map. If this amount is reached, then ejected cells will pass through viruses.
      virusStartMass: 100, # Starting virus size (In mass)
      virusFeedAmount: 7, # Amount of times you need to feed a virus to shoot it
      ejectMass: 12, # Mass of ejected cells
      ejectMassLoss: 16, # Mass lost when ejecting cells
      ejectSpeed: 160, # Base speed of ejected cells
      ejectSpawnPlayer: 50, # Chance for a player to spawn from ejected mass
      playerStartMass: 10, # Starting mass of the player cell.
      playerMaxMass: 22500, # Maximum mass a player can have
      playerMinMassEject: 32, # Mass required to eject a cell
      playerMinMassSplit: 36, # Mass required to split
      playerMaxCells: 16, # Max cells the player is allowed to have
      playerRecombineTime: 30, # Base amount of seconds before a cell is allowed to recombine
      playerMassDecayRate: .002, # Amount of mass lost per second
      playerMinMassDecay: 9, # Minimum mass for decay to occur
      playerMaxNickLength: 15, # Maximum nick length
      playerDisconnectTime: 60, # The amount of seconds it takes for a player cell to be removed after disconnection (If set to -1, cells are never removed)
      tourneyMaxPlayers: 12, # Maximum amount of participants for tournament style game modes
      tourneyPrepTime: 10, # Amount of ticks to wait after all players are ready (1 tick = 1000 ms)
      tourneyEndTime: 30, # Amount of ticks to wait after a player wins (1 tick = 1000 ms)
      tourneyTimeLimit: 20, # Time limit of the game, in minutes.
      tourneyAutoFill: 0, # If set to a value higher than 0, the tournament match will automatically fill up with bots after this amount of seconds
      tourneyAutoFillPlayers: 1, # The timer for filling the server with bots will not count down unless there is this amount of real players

    @loadConfig()

    @rooms = []

  loadConfig: () ->
    try
      savedConfig = ini.parse fs.readFileSync('./gameserver.ini', 'utf-8')

      for parameter of savedConfig
        @config[parameter] = savedConfig[parameter]

    catch err
      console.log "[Lobby] Config not found... Generating new config"
      fs.writeFileSync './gameserver.ini', ini.stringify @.config

    return 0

  start: () ->
    console.log "[Lobby] Starting Lobby"

    serverParameters =
      port: @config.serverPort
      perMessageDeflate: false

    @socketServer = new ws.Server serverParameters, () =>
      console.log "[Lobby] Listening on port " + @config.serverPort

    connectionEstablished = (ws) =>
#      if @clients.length >= @config.serverMaxConnections
#        ws.close
#        return

      playerInGame = false

      for room in @rooms
        if room.clients.length < @config.roomMaxConnections
          console.log "[Lobby] Adding player to existiong room"
          room.addPlayer ws
          playerInGame = true
          break

      if !playerInGame
        console.log "[Lobby] Creating new room"
        gameRoom = new GameServer @
        gameRoom.start @config
        @rooms.push gameRoom
        gameRoom.addPlayer ws

    @socketServer.on 'connection', connectionEstablished.bind @

    @socketServer.on 'error', (err) ->
      switch err
        when "EADDRINUSE"
          console.log "[Error] Server could not bind to port! Please close out of Skype or change 'serverPort' in gameserver.ini to a different number."
        when "EACCES"
          console.log "[Error] Please make sure you are running Ogar with root privileges."
        else
          console.log "[Error] Unhandled error code: " + err.code

      process.exit 1

      return 0

    return 0

module.exports = Lobby