GameEngine = Class.extend({
    tileSize: 32,
    tilesX: 17,
    tilesY: 13,
    size: {},
    fps: 100,
    botsCount: 2, /* 0 - 3 */
    playersCount: 2, /* 1 - 2 */
    bonusesPercent: 0,

    stage: null,
    menu: null,
    players: [],
    bots: [],
    tiles: [],
    wallTiles: null,
    bombs: [],
    bonuses: [],
    draw: true,
    botsConfig: [],
    maptype: "high",
    gameover: false,

    playerBoyImg: null,
    playerBoyImg2: null,
    playerBoyImg3: null,
    playerBoyImg4: null,
    playerGirlImg: null,
    playerGirl2Img: null,
    tilesImgs: {},
    bombImg: null,
    fireImg: null,
    bonusesImg: null,

    playing: true,
    mute: true,
    soundtrackLoaded: false,
    soundtrackPlaying: false,
    soundtrack: null,

    init: function() {
        this.size = {
            w: this.tileSize * this.tilesX,
            h: this.tileSize * this.tilesY
        };
    },

    load: function() {
        // Init canvas
        this.stage = new createjs.Stage("canvas");
        this.stage.enableMouseOver();

        // Load assets
        var queue = new createjs.LoadQueue();
        var that = this;
        queue.addEventListener("complete", function() {
            that.playerBoyImg = queue.getResult("playerBoy");
            that.playerBoyImg2 = queue.getResult("playerBoy2");
            that.playerBoyImg3 = queue.getResult("playerBoy3");
            that.playerBoyImg4 = queue.getResult("playerBoy4");
            that.playerGirlImg = queue.getResult("playerGirl");
            that.playerGirl2Img = queue.getResult("playerGirl2");
            that.tilesImgs.grass = queue.getResult("tile_grass");
            that.tilesImgs.wall = queue.getResult("tile_wall");
            that.tilesImgs.wood = queue.getResult("tile_wood");
            that.bombImg = queue.getResult("bomb");
            that.fireImg = queue.getResult("fire");
            that.bonusesImg = queue.getResult("bonuses");
            that.setup();
        });
        queue.loadManifest([
            {id: "playerBoy", src: "img/george.png"},
            {id: "playerBoy2", src: "img/george2.png"},
            {id: "playerBoy3", src: "img/george3.png"},
            {id: "playerBoy4", src: "img/george4.png"},
            {id: "playerGirl", src: "img/betty.png"},
            {id: "playerGirl2", src: "img/betty2.png"},
            {id: "tile_grass", src: "img/tile_grass.png"},
            {id: "tile_wall", src: "img/tile_wall.png"},
            {id: "tile_wood", src: "img/tile_wood.png"},
            {id: "bomb", src: "img/bomb.png"},
            {id: "fire", src: "img/fire.png"},
            {id: "bonuses", src: "img/bonuses.png"}
        ]);

        // createjs.Sound.addEventListener("fileload", this.onSoundLoaded);
        // createjs.Sound.alternateExtensions = ["mp3"];
        // createjs.Sound.registerSound("sound/bomb.ogg", "bomb");
        // createjs.Sound.registerSound("sound/game.ogg", "game");

        // Create menu
        this.menu = new Menu();
    },

    setup: function() {
        if (!gInputEngine.bindings.length) {
            gInputEngine.setup();
        }

        this.bombs = [];
        this.tiles = [];
        this.bonuses = [];

        gGameEngine.maptype = $('select.map-config').val();

        // Draw tiles
        this.drawTiles();
        this.drawBonuses();

        gGameEngine.botsConfig.length = 0;

        $('select.bot-config').each(function () {
          var value = $(this).val();
          gGameEngine.botsConfig.push(value);
        });

        this.spawnBots();
        this.spawnPlayers();

        // Toggle sound
        gInputEngine.addListener('mute', this.toggleSound);

        // Restart listener
        // Timeout because when you press enter in address bar too long, it would not show menu
        setTimeout(function() {
            gInputEngine.addListener('restart', function() {
                if (gGameEngine.playersCount == 0) {
                    gGameEngine.menu.setMode('single');
                } else {
                    gGameEngine.menu.hide();
                    gGameEngine.restart();
                }
            });
        }, 200);

        // Escape listener
        gInputEngine.addListener('escape', function() {
            if (!gGameEngine.menu.visible) {
                gGameEngine.menu.show();
            }
        });

        // Start loop
        if (!createjs.Ticker.hasEventListener('tick')) {
            createjs.Ticker.addEventListener('tick', gGameEngine.update);
            createjs.Ticker.setFPS(this.fps);
        }

        if (gGameEngine.playersCount > 0) {
            if (this.soundtrackLoaded) {
                this.playSoundtrack();
            }
        }

        if (!this.playing) {
            this.menu.show();
        }
    },

    onSoundLoaded: function(sound) {
        if (sound.id == 'game') {
            gGameEngine.soundtrackLoaded = true;
            if (gGameEngine.playersCount > 0) {
                gGameEngine.playSoundtrack();
            }
        }
    },

    playSoundtrack: function() {
        if (!gGameEngine.soundtrackPlaying) {
            gGameEngine.soundtrack = createjs.Sound.play("game", "none", 0, 0, -1);
            gGameEngine.soundtrack.setVolume(1);
            gGameEngine.soundtrackPlaying = true;
        }
    },

    update: function() {
        // Player
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            player.update();
        }

        // Bots
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            var bot = gGameEngine.bots[i];
            bot.update();
        }

        // Bombs
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            bomb.update();
        }

        if (this.gameover)
            return;

        if (gGameEngine.bots.length == 1) {
            this.gameover = true;
            setTimeout(gGameEngine.restart, 3000);
        } else if (gGameEngine.bots.length == 0) {
            console.log("no winner");
            gGameEngine.restart();
        }

        // Menu
        gGameEngine.menu.update();

        // Stage
        if (gGameEngine.draw)
            gGameEngine.stage.update();
    },

    getCurrentGameState: function(bot_id) {
        return new GameState(this._getBotStates(), this._getTiles(), this._getBombStates(), bot_id);
    },

    _getBombStates: function() {
        var that = this;
        return _.map(this.bombs, function(bomb) {
            return {
                position: bomb.position,
                strength: bomb.strength,
                timer: bomb.timer,
                timerMax: bomb.timerMax,
                exploded: bomb.exploded,
                fires: that._getFireStates(bomb)
            }
        });
    },

    _getFireStates: function(bomb) {
        return _.map(bomb.fires, function(fire) {
            return { position: fire.position };
        });
    },

    _getTiles: function() {
        var tiles = [];
        for (var j = 0; j < this.tilesX; j++) {
            tiles[j] = [];
            for (var i = 0; i < this.tilesY; i++) {
                tiles[j][i] = 'grass';
            }
        }

        _.each(this.tiles, function(tile) {
            tiles[tile.position.x][tile.position.y] = tile.material;
        });

        return tiles;
    },


  _buildPositionToMaterialHash: function(tiles, type) {
    var hash = {};

    _.each(tiles, function(tile) {
      hash[tile.poisition] = type;
    });

     return hash;
   },

    _getBotStates: function() {
        var that = this;
        return _.map(this.bots, function(bot) {
            return that._extractBotState(bot);
        }).concat(_.map(this.players, function(player) {
            return that._extractBotState(player);
        }));
    },

    _extractBotState: function(bot) {
        return { id: bot.id, avaiableBombs: bot.avaiable_bombs(), position: bot.position, alive: bot.alive };
    },

    drawTiles: function() {
        // return;
        for (var i = 0; i < this.tilesY; i++) {
            for (var j = 0; j < this.tilesX; j++) {
                if ((i == 0 || j == 0 || i == this.tilesY - 1 || j == this.tilesX - 1)
                    || (j % 2 == 0 && i % 2 == 0)) {
                    // Wall tiles
                    var tile = new Tile('wall', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    var tile = new Tile('grass', { x: j, y: i });
                    this.stage.addChild(tile.bmp);

                    // Wood tiles
                    if (!(i <= 2 && j <= 2)
                        && !(i >= this.tilesY - 3 && j >= this.tilesX - 3)
                        && !(i <= 2 && j >= this.tilesX - 3)
                        && !(i >= this.tilesY - 3 && j <= 2)) {
                        var types = {"high": 0.3, "low": 0.6, "empty": 1, "full": 0};
                        if (Math.random() >= types[gGameEngine.maptype]){
                            var wood = new Tile('wood', { x: j, y: i });
                            this.stage.addChild(wood.bmp);
                            this.tiles.push(wood);
                        }
                    }
                }
            }
        }
    },

    drawBonuses: function() {
        // Cache woods tiles
        var woods = [];
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.material == 'wood') {
                woods.push(tile);
            }
        }

        // Sort tiles randomly
        woods.sort(function() {
            return 0.5 - Math.random();
        });

        // Distribute bonuses to quarters of map precisely fairly
        for (var j = 0; j < 4; j++) {
            var bonusesCount = Math.round(woods.length * this.bonusesPercent * 0.01 / 4);
            var placedCount = 0;
            for (var i = 0; i < woods.length; i++) {
                if (placedCount > bonusesCount) {
                    break;
                }

                var tile = woods[i];
                if ((j == 0 && tile.position.x < this.tilesX / 2 && tile.position.y < this.tilesY / 2)
                    || (j == 1 && tile.position.x < this.tilesX / 2 && tile.position.y > this.tilesY / 2)
                    || (j == 2 && tile.position.x > this.tilesX / 2 && tile.position.y < this.tilesX / 2)
                    || (j == 3 && tile.position.x > this.tilesX / 2 && tile.position.y > this.tilesX / 2)) {

                    var typePosition = placedCount % 3;
                    // var bonus = new Bonus(tile.position, typePosition);
                    //this.bonuses.push(bonus);

                    // Move wood to front
                    this.moveToFront(tile.bmp);

                    placedCount++;
                }
            }
        }
    },

    spawnBots: function() {
        this.bots = [];

        var personalities = {"vanilla": Personalities.Vanilla, "macho": Personalities.Macho,
            "psycho": Personalities.Psycho, "shy": Personalities.Shy, "sneaky": Personalities.Sneaky};

        // Spawns the four agents
        if (this.botsCount >= 1) {
            var bot2 = new Agent({ x: 1, y: this.tilesY - 2 });
            bot2.personality = personalities[gGameEngine.botsConfig[2]];
            this.bots.push(bot2);
        }

        if (this.botsCount >= 2) {
            var bot3 = new Agent({ x: this.tilesX - 2, y: 1 });
            bot3.id = 1;
            bot3.personality = personalities[gGameEngine.botsConfig[1]];
            this.bots.push(bot3);
        }

        if (this.botsCount >= 3) {
            var bot = new Agent({ x: this.tilesX - 2, y: this.tilesY - 2 });
            bot.id = 2;
            bot.personality = personalities[gGameEngine.botsConfig[3]];
            this.bots.push(bot);
            // console.log(this.bots);
            // console.log(jefferson);
        }

        if (this.botsCount >= 4) {
            var bot = new Agent({ x: 1, y: 1 });
            bot.id = 3;
            bot.personality = personalities[gGameEngine.botsConfig[0]];
            this.bots.push(bot);
        }
    },

    spawnPlayers: function() {
        this.players = [];

        if (this.playersCount >= 1) {
            var player = new Player({ x: 1, y: 1 });
            this.players.push(player);
        }

        if (this.playersCount >= 2) {
            var controls = {
                'up': 'up2',
                'left': 'left2',
                'down': 'down2',
                'right': 'right2',
                'bomb': 'bomb2'
            };
            var player2 = new Player({ x: this.tilesX - 2, y: this.tilesY - 2 }, controls);
            this.players.push(player2);
        }
    },

    /**
     * Checks whether two rectangles intersect.
     */
    intersectRect: function(a, b) {
        return (a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom);
    },

    /**
     * Returns tile at given position.
     */
    getTile: function(position) {
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.position.x == position.x && tile.position.y == position.y) {
                return tile;
            }
        }
    },

    /**
     * Returns bomb at given position.
     */
    getBomb: function(position) {
        return _.find(this.bombs, function(bomb) {
            return bomb.position.x == position.x && bomb.position.y == position.y
        });
    },

    /**
     * Returns tile material at given position.
     */
    getTileMaterial: function(position) {
        var tile = this.getTile(position);
        return (tile) ? tile.material : 'grass' ;
    },

    gameOver: function(status) {
        if (gGameEngine.menu.visible) { return; }

        if (status == 'win') {
            var winText = "You won!";
            if (gGameEngine.playersCount > 1) {
                var winner = gGameEngine.getWinner();
                winText = winner == 0 ? "Player 1 won!" : "Player 2 won!";
            }
            this.menu.show([{text: winText, color: '#669900'}, {text: ' ;D', color: '#99CC00'}]);
        } else {
            this.menu.show([{text: 'Game Over', color: '#CC0000'}, {text: ' :(', color: '#FF4444'}]);
        }
    },

    getWinner: function() {
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            if (player.alive) {
                return i;
            }
        }
    },

    restart: function() {
        gameover = false;
        gInputEngine.removeAllListeners();
        gGameEngine.stage.removeAllChildren();
        gGameEngine.setup();
    },

    /**
     * Moves specified child to the front.
     */
    moveToFront: function(child) {
        var children = gGameEngine.stage.getNumChildren();
        gGameEngine.stage.setChildIndex(child, children - 1);
    },

    toggleSound: function() {
        if (gGameEngine.mute) {
            gGameEngine.mute = false;
            gGameEngine.soundtrack.resume();
        } else {
            gGameEngine.mute = true;
            gGameEngine.soundtrack.pause();
        }
    },

    countPlayersAlive: function() {
        var playersAlive = 0;
        for (var i = 0; i < gGameEngine.players.length; i++) {
            if (gGameEngine.players[i].alive) {
                playersAlive++;
            }
        }
        return playersAlive;
    },

    getPlayersAndBots: function() {
        var players = [];

        for (var i = 0; i < gGameEngine.players.length; i++) {
            players.push(gGameEngine.players[i]);
        }

        for (var i = 0; i < gGameEngine.bots.length; i++) {
            players.push(gGameEngine.bots[i]);
        }

        return players;
    }
});

gGameEngine = new GameEngine();
