const DEFAULT_DIRECTION = new v2({x: 1, y: 0});

class Entity {
  constructor({name, x, y, mute, width, height, center, direction, frames}) {
    this.name = name;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.mute = mute || false;

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

    this._state = CHARACTER_STATES.IDLE;
    this._previousState = CHARACTER_STATES.IDLE;
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
      this.position.x,
      this.position.y
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
    // console.log(this.health, damage);
    const dealtDamage = Math.min(damage, this.health);
    this.health = Math.max(0, this.health - damage);
    return dealtDamage;
  }

  get isDying() {
    return this.state === CHARACTER_STATES.DYING;
  }

  get isDead() {
    return this.state === CHARACTER_STATES.DEAD;
  }

  render() {
    const isFacingLeft = (this.direction.x < 0);
    const x = Math.round(this.position.x);
    const posX = isFacingLeft ? -x - this.width : x;
    const posY = Math.round(this.position.y);
    if (isFacingLeft) {
      context.save();
      context.scale(-1, 1);
    }
    context.drawImage(
      this.image,
      posX,
      posY
    );
    if (isFacingLeft) {
      context.restore();
    }
  }
}

class Player extends Creature {
  constructor(data) {
    super(data);

    this.score = data.score || 0;
    this._infoUI = new PlayerUI(this);
  }

  get healthInPercent() {
    const onePercent = Player.MAX_HEALTH / 100;
    return this.health / onePercent;
  }

  die() {
    this.state = CHARACTER_STATES.DEAD;
  }

  update(delta) {
    // assume the char is idle and let actions below state otherwise
    super.update(delta);

    this._infoUI.update(this);

    if (this.health <= 0) {
      this.die();
      return;
    }

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
      const newPosition = v2.addBounded(this.position, moved);

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

  static get MAX_HEALTH() {
    return 100;
  }
};

class Enemy extends Creature {
  constructor(data) {
    super(data);
  }


  die() {
    this.state = CHARACTER_STATES.DYING;
    this._explosionStartFrame = this._frameCount;
    if (!this.mute) {
      const sound = Loader.getSound('explosion');
      playCopyOfSound(sound);
    }
  }

  update(delta) {
    super.update(delta);

    const deltaSpeed = this.speed * delta;

    // GO MY (S)IMPS
    const vectorToPlayer = v2.subtract(player.position, this.position);
    const playerDistance = vectorToPlayer.length;

    if (this.health <= 0 && !this.isDying) {
      this.die();
    }

    if (!this.isDead) {
      if (this.isDying) {
        // play the explosion animation
        const frameDiff = this._frameCount - this._explosionStartFrame;
        if (frameDiff > this.frames[CHARACTER_STATES.DYING].length * ANIMATION_SLOWDOWN) {
          this.state = CHARACTER_STATES.DEAD;
        }
      }
      else if (playerDistance <= ENEMY_EXPLOSION_DISTANCE && this.state !== CHARACTER_STATES.DYING) {
        player.dealDamage(this.damage);
        this.die();
      }
      else if (playerDistance <= ENEMY_SENSE_DISTANCE) {
        this.state = CHARACTER_STATES.MOVING;

        const newDirection = vectorToPlayer.asNormal;
        
        const movement = v2.scale(newDirection, deltaSpeed);
        const newPosition = v2.addBounded(this.position, movement);

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

class Projectile extends Entity {
  constructor(data) {
    super(data);
    this.creature = data.creature;
    this.damage = data.damage || PROJECTILE_DAMAGE;
    this.speed = data.speed || PROJECTILE_SPEED;
    this.direction = data.creature.direction;
    this.center = new v2({x: this.size / 2, y: this.size / 2});

    const moveBy = this.size / 2;
    this.position = v2.subtract(data.creature.centerPosition, { x: moveBy, y: moveBy });
    this.startPosition = new v2(this.position);

    if (!this.mute) {
      const sound = Loader.getSound('laser-sound');
      playCopyOfSound(sound);
    }
  }

  get creatureId() {
    return this.creature.uid;
  }

  get size() {
    return Math.min(this.width, this.height);
  }

  // TODO: Terrain, projectiles global variables
  update(delta) {
    super.update(delta);

    const deltaSpeed = delta * this.speed;
    this.position = v2.addBounded(this.position, v2.scale(this.direction, deltaSpeed));

    // self-delete if flies off the terrain
    const { width: terrainWidth, height: terrainHeight } = Terrain;

    const distanceTravelled = v2.subtract(this.position, this.startPosition).length;
    if (distanceTravelled >= PROJECTILE_MAX_DISTANCE) {
      projectiles.delete(this);
    }

    if (this.position.x < 0 || this.position.y < 0 || this.position.x > terrainWidth || this.position.y > terrainHeight) {
      projectiles.delete(this);
    }
  }

  render() {
    context.save();
    context.translate(this.centerPosition.x, this.centerPosition.y);
    const angle = Math.atan2(this.direction.y, this.direction.x) + PROJECTILE_ROTATION;
    context.rotate(angle);
    context.drawImage(
      this.image,
      -this.center.x,
      -this.center.y
    );
    context.restore();
  }
}
