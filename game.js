const ENEMY_SPAWN_PROBABILITY = 0.02;

const projectiles = {
  map: {},
  push(projectile) {
    this.map[projectile.id] = projectile;
  },
  update(delta) {
    Object.values(this.map).forEach(p => p.update(delta));
  },
  render(delta) {
    Object.values(this.map).forEach(p => p.render(delta));
  },
  delete({id}) {
    delete this.map[id];
  },
  get length() {
    return Object.values(this.map).length;
  }
};

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
      id: p.id,
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
        if (overlaps(bullet, enemy)) {
          deleteBulletIds.add(bullet.id);
          enemy.dealDamage(projectiles.map[bullet.id].damage);
        }
      });
    }
  });

  deleteBulletIds.forEach(bulletId => {
    projectiles.delete({ id: bulletId });
  });
};

const Game = {
  canvasHeight: 512,
  canvasWidth: 512,
  frameCount: 0,

  resize() {
    canvas.width = Math.floor(window.innerWidth / PIXELART_SCALE_FACTOR);
    canvas.height = Math.floor(window.innerHeight / PIXELART_SCALE_FACTOR);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
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
    }

    if (Math.random() <= ENEMY_SPAWN_PROBABILITY) {
      spawnEnemy();
      console.log('enemy spawn');
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
      // console.log(player.centerPosition);

      const projectile = {
        id: uuid(),
        creatureId: player.uid,
        damage: 50,
        size: 6,
        speed: 200,

        direction: new v2(player.direction),
        centerPosition: new v2(player.centerPosition),

        get position() {
          return new v2({
            x: this.centerPosition.x - this.size / 2,
            y: this.centerPosition.y - this.size / 2,
          });
        },

        update(delta) {
          const deltaSpeed = delta * this.speed;
          this.centerPosition = v2.add(this.centerPosition, v2.scale(this.direction, deltaSpeed));

          // self-delete if flies off the terrain
          const {width: terrainWidth, height: terrainHeight} = Terrain;
          const {x: posX, y: posY} = this.position;

          if (posX < 0 || posY < 0 || posX > terrainWidth || posY > terrainHeight) {
            projectiles.delete(this);
          }
        },

        render() {
          context.fillRect(
            Math.round(this.position.x),
            Math.round(this.position.y),
            this.size,
            this.size
          );
        }
      };

      projectiles.push(projectile);
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
    Input.listenForEvents(
      [
        Input.LEFT, Input.RIGHT, Input.UP, Input.DOWN,
        Input.A, Input.D, Input.W, Input.S, Input.SPACE
      ]);

    this.resize();
  },

  tick(elapsed) {
    // clear previous frame
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // compute delta time in seconds -- also cap it
    let delta = (elapsed - this._previousElapsed) / 1000;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this._previousElapsed = elapsed;

    this.update(delta);
    this.render();

    window.requestAnimationFrame(this.tick.bind(this));
  },


  load() {
    // load all the assets

    const enemyPromises = [];

    enemies.forEach(enemy => enemyPromises.push(enemy.load()))

    return [

      Loader.loadImage('terrain', './assets/nature-summer.png'),
      player.load(),
      ...enemyPromises
      // Loader.loadImage('character, './assets/character.png')
    ];
  }

};

window.onload = () => Game.run(context);
window.onresize = () => Game.resize();
