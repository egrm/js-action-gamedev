const CHARACTER_STATES = {
  DEAD: 'dead',
  EXPLODE: 'explosion',
  IDLE: 'idle',
  MOVING: 'moving'
};

const DEFAULT_DIRECTION = new v2({x: 1, y: 0});

const ANIMATION_SLOWDOWN = 5;

const ENEMY_SENSE_DISTANCE = 100; //Infinity;

const ENEMY_EXPLOSION_DISTANCE = 10;

class Entity {
  constructor({name, x, y, width, height, center, direction, frames}) {
    this.name = name;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    if (direction) {
      this.direction  = direction;
    } else {
      this.direction = DEFAULT_DIRECTION;
    }

    if (center) {
      this.center  = center;
    } else {
      this.center = new v2({x: width / 2, y: height / 2});
    }

    this.frames = frames;

    this.uid = uuid();

    this._state= CHARACTER_STATES.IDLE;
    this._previousState= CHARACTER_STATES.IDLE;
    this._frameCount = 0;
  }

  get position() {
    return new v2({x: this.x, y: this.y});
  }

  set position({x, y}) {
    this.x = x;
    this.y = y;
  }

  get centerPosition() {
    return v2.add(this.position, this.center);
  }

  get state() {
    return this._state;
  }

  set state(newState) {
    this._state = newState;
  }


  get image() {
    // division slows down the animation, ensures possible values from 0 to 3
    const animationFrameNumber = Math.round((this._frameCount) / ANIMATION_SLOWDOWN) % this.frames[this.state].length;

    const image = Loader.getImage(`${this.name}-${this.state}-${animationFrameNumber}`);

    return image;
  }

  load() {
    const promises = [];

    Object.entries(this.frames).forEach(([state, framePaths]) => {
      framePaths.forEach((path, index) => {
        const key = `${this.name}-${state}-${index}`;
        promises.push(Loader.loadImage(key, path));
      })
    })

    return Promise.all(promises)
  }

  update() {
    this._frameCount += 1;
  }

  render() {
    context.drawImage(
      this.image,
      Math.round(this.position.x),
      Math.round(this.position.y)
    );
  }
}

class Creature extends Entity {
  constructor(data) {
    super(data);

    ['damage', 'health', 'speed'].forEach(key => {
      this[key] = data[key];
    });
  }

  moveBy({x = 0, y = 0}) {
    if (!x && !y) return;

    // this.state = CHARACTER_STATES.MOVING;

    this.x += x;
    this.y += y;
  }

  dealDamage(damage) {
    this.health = Math.max(0, this.health - damage);
    console.log(this.health);
  }

  get isDead() {
    return (this.health <= 0) || (this.state === CHARACTER_STATES.DEAD);
  }
}

class Player extends Creature {
  update(delta) {
    // assume the char is idle and let actions below state otherwise
    super.update(delta);

    const deltaSpeed = delta * this.speed;

    this.direction = v2.subtract(Input.mousePosition, player.position).asNormal;

    let movement = new v2({x: 0, y: 0});

    // movement
    if (Input.isDown(Input.LEFT) || Input.isDown(Input.A)) {
      movement.x -= 1;
    }

    if (Input.isDown(Input.RIGHT) || Input.isDown(Input.D)) {
      movement.x += 1;
    }

    if (Input.isDown(Input.UP) || Input.isDown(Input.W)) {
      movement.y -= 1;
    }

    if (Input.isDown(Input.DOWN) || Input.isDown(Input.S)) {
      movement.y += 1;
    }

    movement = v2.normalize(movement);



    const isMoving = movement.length !== 0;

    if (isMoving) {
      this.state = CHARACTER_STATES.MOVING;

      const moved = v2.scale(movement, deltaSpeed);
      const newPosition = v2.add(this.position, moved);

      this.position = newPosition;
    } else {
      this.state = CHARACTER_STATES.IDLE;
    }
  }

  render() {
    super.render();

    const crosshair = {
      distance: 30,
      size: 10,
      thickness: 2,
      get centerPosition() {
        return v2.add(player.centerPosition, v2.scale(player.direction, crosshair.distance));
      },
      get position() {
        const position = this.centerPosition;

        position.y -= crosshair.size / 2;
        position.x -= crosshair.size / 2;

        return position;
      },
      render() {
        const {position: crosshairPosition} = crosshair;

        context.fillStyle = 'white';
        // vertical
        context.fillRect(
          Math.round(crosshairPosition.x + crosshair.size / 2 - crosshair.thickness / 2),
          Math.round(crosshairPosition.y),
          crosshair.thickness,
          crosshair.size
        );
        // horizontal
        context.fillRect(
          Math.round(crosshairPosition.x),
          Math.round(crosshairPosition.y + crosshair.size / 2 - crosshair.thickness / 2),
          crosshair.size,
          crosshair.thickness,
        );
      }
    };

    crosshair.render();
  }
};

const player = new Player({
  name: 'necromancer',
  health: 100,
  speed: 120,
  height: 69,
  x: canvas.width / 2,
  y: canvas.height / 2,
  center: new v2({x: 9, y: 12}),
  frames: {
    [CHARACTER_STATES.IDLE]: [...new Array(4)].map((v,index) => (`assets/dungeon/necromancer_idle_anim_f${index}.png`)),
    [CHARACTER_STATES.MOVING]: [...new Array(4)].map((v,index) => (`assets/dungeon/necromancer_run_anim_f${index}.png`))
  }
});

class Enemy extends Creature {
  constructor(data) {
    super(data);
  }

  get isExploding() {
    return (this.state === CHARACTER_STATES.EXPLODE);
  }

  update(delta) {
    super.update(delta);

    const deltaSpeed = this.speed * delta;

    // GO MY (S)IMPSt
    const vectorToPlayer = v2.subtract(player.position, this.position);
    const playerDistance = vectorToPlayer.length;

    if (!this.isDead) {
      if (this.isExploding) {
        const frameDiff = this._frameCount - this._explosionStartFrame;
        if (frameDiff > this.frames[CHARACTER_STATES.EXPLODE].length * ANIMATION_SLOWDOWN) {
          this.health = 0;
        }
      }
      else if (playerDistance <= ENEMY_EXPLOSION_DISTANCE) {
        this.state = CHARACTER_STATES.EXPLODE;
        this._explosionStartFrame = this._frameCount;
        player.dealDamage(this.damage);
      }
      else if (playerDistance <= ENEMY_SENSE_DISTANCE) {
        this.state = CHARACTER_STATES.MOVING;

        const newDirection = vectorToPlayer.asNormal;
        
        const movement = v2.scale(newDirection, deltaSpeed);
        const newPosition = v2.add(this.position, movement);

        this.direction = newDirection;
        this.position = newPosition;
      } else {
        this.state = CHARACTER_STATES.IDLE;
      }
    }
  }

  render() {
    super.render();
  }
}

const spawnEnemy = () => {
  const enemy = new Enemy({
    damage: 10,
    name: 'imp',
    speed: 80,
    height: 69,
    //  maybe that will work
    x: randomInt(0, canvas.width / PIXELART_SCALE_FACTOR),
    y: randomInt(0, (canvas.height * 2) / PIXELART_SCALE_FACTOR),
    center: new v2({x: 9, y: 12}),
    frames: {
      [CHARACTER_STATES.EXPLODE]: [...new Array(8)].map((v,index) => (`assets/dungeon/imp_explosion_anim_f${index}.png`)),
      [CHARACTER_STATES.IDLE]: [...new Array(4)].map((v,index) => (`assets/dungeon/imp_idle_anim_f${index}.png`)),
      [CHARACTER_STATES.MOVING]: [...new Array(4)].map((v,index) => (`assets/dungeon/imp_run_anim_f${index}.png`))
    }
  });

  enemies.set(enemy.uid, enemy);
}

const ENEMY_COUNT = 20;
const enemies = new Map();
[...new Array(ENEMY_COUNT)].forEach((v, index) => 
  {
    spawnEnemy();
  }
);