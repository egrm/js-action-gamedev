const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

// Asset loader

const Loader = {
  images: {},
  sounds: {}
};

Loader.loadImage = function (key, src) {
  const img = new Image();

  const d = new Promise(function (resolve, reject) {
    img.onload = function () {
      this.images[key] = img;
      resolve(img);
    }.bind(this);

    img.onerror = function () {
      reject('Could not load image: ' + src);
    };
  }.bind(this));

  img.src = src;
  return d;
};

Loader.loadSound = function (key, src) {
  const audio = new Audio();
  const d = new Promise(function (resolve, reject) {
    audio.addEventListener('loadeddata', function () {
      this.sounds[key] = audio;
      resolve(audio);
    }.bind(this), false);

    audio.addEventListener('error', function () {
      reject('Could not load audio: ' + src);
    }.bind(this), false);
  }.bind(this));

  audio.src = src;
  return d;
};

Loader.getImage = function (key) {
  return (key in this.images) ? this.images[key] : null;
};

Loader.getSound = function (key) {
  return (key in this.sounds) ? this.sounds[key] : null;
};

// Input manager

const Input = {};

Input.LEFT = 37;
Input.A = 65;
Input.RIGHT = 39;
Input.D = 68;
Input.UP = 38;
Input.W = 87;
Input.DOWN = 40;
Input.S = 83;
Input.SPACE = 32;

Input.LEFT_MOUSE_BUTTON = 0;
Input.MIDDLE_MOUSE_BUTTON = 1;
Input.RIGHT_MOUSE_BUTTON = 2;

Input._keys = {};

Input._mouseButtons = {};

Input.mousePosition = new v2({x: 0, y: 0});

Input.listenForEvents = function (keys) {
  window.addEventListener('keydown', this._onKeyDown.bind(this));
  window.addEventListener('keyup', this._onKeyUp.bind(this));

  window.addEventListener('mousemove', this._onMouseMove.bind(this));
  
  window.addEventListener('mousedown', this._onMouseDown.bind(this));
  window.addEventListener('mouseup', this._onMouseUp.bind(this));

  keys.forEach(function (key) {
    this._keys[key] = false;
  }.bind(this));
}

Input._onKeyDown = function (event) {
  const keyCode = event.keyCode;
  if (keyCode in this._keys) {
    event.preventDefault();
    this._keys[keyCode] = true;
  }
};

Input._onKeyUp = function (event) {
  var keyCode = event.keyCode;
  if (keyCode in this._keys) {
    event.preventDefault();
    this._keys[keyCode] = false;
  }
};

Input.isDown = function (keyCode) {
  if (!keyCode in this._keys) {
    throw new Error('Keycode ' + keyCode + ' is not being listened to');
  } 

  return this._keys[keyCode] || this._mouseButtons[keyCode];
};

Input._onMouseMove = function (event) {
  const {clientX: x, clientY: y} = event;

  Input.mousePosition = new v2({x: (x - canvas.offsetLeft) / PIXELART_SCALE_FACTOR, y: (y - canvas.offsetTop) / PIXELART_SCALE_FACTOR});
}

Input._onMouseDown = function (event) {
  Input._mouseButtons[event.button] = true;
}

Input._onMouseUp = function (event) {
  Input._mouseButtons[event.button] = false;
}
