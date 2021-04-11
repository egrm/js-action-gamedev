const player = new Player({
  health: Player.MAX_HEALTH,
  height: 16,
  name: 'necromancer',
  speed: 120,
  width: 16,
  x: canvas.width / 2,
  y: canvas.height / 2,
  center: new v2({x: 9, y: 12}),
  frames: {
    [CHARACTER_STATES.IDLE]: [...new Array(4)].map((v,index) => (`assets/dungeon/necromancer_idle_anim_f${index}.png`)),
    [CHARACTER_STATES.MOVING]: [...new Array(4)].map((v,index) => (`assets/dungeon/necromancer_run_anim_f${index}.png`)),
    [CHARACTER_STATES.DEAD]: [...new Array(4)].map((v,index) => (`assets/dungeon/tiny_zombie_idle_anim_f${index}.png`)),
  }
});

const projectiles = {
  map: {},
  push(projectile) {
    this.map[projectile.uid] = projectile;
  },
  update(delta) {
    Object.values(this.map).forEach(p => p.update(delta));
  },
  render(delta) {
    Object.values(this.map).forEach(p => p.render(delta));
  },
  delete({uid}) {
    delete this.map[uid];
  },
  get length() {
    return Object.values(this.map).length;
  }
};

const enemies = new Map();
[...new Array(ENEMY_INITIAL_COUNT)].forEach((v, index) => 
  {
    spawnEnemy(enemies);
  }
);

const overlaps = (a, b) => {
	if (a.x >= b.x + b.width || b.x >= a.x + a.width) return false;
	if (a.y >= b.y + b.height || b.y >= a.y + a.height) return false;
	return true;
};

const checkProjectiles = () => {
  const bounds = {
    height: Game.canvasHeight,
    width: Game.canvasWidth,
    x: 0,
    y: 0
  }
  const qt = new QuadTree(bounds, false);
  Object.values(projectiles.map).forEach(p => {
    qt.insert({
      uid: p.uid,
      height: p.size,
      width: p.size,
      x: p.position.x,
      y: p.position.y
    });
  });

  const deleteBulletIds = new Set();

  enemies.forEach(enemy => {
    const bullets = qt.retrieve({
      height: enemy.height,
      width: enemy.width,
      x: enemy.x,
      y: enemy.y
    });
    
    if (bullets.length) {
      bullets.forEach(bullet => {
        if (overlaps(bullet, enemy) && !enemy.isDying) {

          deleteBulletIds.add(bullet.uid);

          const bulletDamage = projectiles.map[bullet.uid].damage;
          
          const dealtDamage = enemy.dealDamage(bulletDamage);

          player.score += dealtDamage;

          // TODO
          if (player.score >= 10000 && !Game.testDialogShown) {
            Game.testDialogShown = true;
            let dialog;
            dialog = new Dialog({
              text: 'And if you don\'t believe me, well...\n',
              options: [{
                optionText: 'Silence, wench!',
                onSelect: () => {
                  dialog.hide();
                }
              }, {
                optionText: 'Me horny',
                onSelect: () => {
                  dialog.hide();
                }
              }]
            });
            dialog.show();
          }
        }
      });
    }
  });

  deleteBulletIds.forEach(bulletId => {
    projectiles.delete({ uid: bulletId });
  });
};

const Game = {
  canvasHeight: window.innerHeight,
  canvasWidth: window.innerWidth,
  frameCount: 0,
  paused: false,

  resize() {
    const h = CANVAS_HEIGHT;
    const w = CANVAS_WIDTH;

    canvas.height = Math.floor(h / PIXELART_SCALE_FACTOR);
    canvas.width = Math.floor(w / PIXELART_SCALE_FACTOR);

    canvas.style.height = `${h}px`;
    canvas.style.width = `${w}px`;

    this.canvasHeight = h;
    this.canvasWidth = w;

    UI_LAYER.setAttribute('style', `
      position: absolute;

      width: ${canvas.width * PIXELART_SCALE_FACTOR}px;
      height: ${canvas.height * PIXELART_SCALE_FACTOR}px;

      top: ${canvas.offsetTop}px;
      left: ${canvas.offsetLeft}px;

      pointer-events: none;
    `);
  },

  run(context) {
    this.context = context;
    this._previousElapsed = 0;

    var p = this.load();
    Promise.all(p).then(function (loaded) {
      this.init();
      this.tick(0);
    }.bind(this));
  },

  update(delta) {
    this.frameCount += 1;

    player.update(delta, this.frameCount);

    if (player.isDead) {
      // TODO - die with dignity
      const wastedSound = Loader.getSound('wasted');
      wastedSound.play();
    }

    if (Math.random() <= ENEMY_SPAWN_PROBABILITY) {
      spawnEnemy(enemies);
    }

    checkProjectiles();

    enemies.forEach(enemy => {
      enemy.update(delta);

      if (enemy.isDead) {
        enemies.delete(enemy.uid);
      }

    });

    if (
    (Input.isDown(Input.LEFT_MOUSE_BUTTON) || Input.isDown(Input.SPACE)) &&
      (this.frameCount / 2 % 4) === 0
    ) {
      spawnProjectile();
    }

    projectiles.update(delta);
  },

  render() {
    Terrain.render();
    player.render();
    enemies.forEach(enemy => enemy.render());
    projectiles.render();
  },

  init() {
    Input.listenForEvents([
      Input.LEFT, Input.RIGHT, Input.UP, Input.DOWN,
      Input.A, Input.D, Input.W, Input.S, Input.SPACE
    ]);

    this.resize();
  },

  tick(elapsed) {
    if (!this.paused) {
      // clear previous frame
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      // compute delta time in seconds -- also cap it
      let delta = (elapsed - this._previousElapsed) / 1000;
      delta = Math.min(delta, 0.25); // maximum delta of 250 ms

      this.update(delta);
      this.render();
    }

    this._previousElapsed = elapsed;
    window.requestAnimationFrame(this.tick.bind(this));
  },

  pause() {
    this.paused = true;
  },

  resume() {
    this.paused = false;
  },

  load() {
    // load all the assets

    const enemyPromises = [];

    enemies.forEach(enemy => enemyPromises.push(enemy.load()))

    //const projectile = Object.values(projectiles.map)[0];

    return [
      Loader.loadImage('terrain', './assets/outdoors.png'),
      Terrain.load(),
      player.load(),
      ...enemyPromises,
      Loader.loadImage('projectile-idle-0', './assets/projectiles/projectile-0.png'),
      Loader.loadImage('projectile-idle-1', './assets/projectiles/projectile-1.png'),
      Loader.loadImage('signpost', './assets/dungeon/signpost.png'),
      Loader.loadSound('explosion', './assets/sound/explosion.mp3'),
      Loader.loadSound('laser-sound', './assets/sound/laser2.mp3'),
      Loader.loadSound('wasted', './assets/sound/wasted.mp3')
    ];
  }

};

window.onload = () => Game.run(context);
window.onresize = () => Game.resize();
