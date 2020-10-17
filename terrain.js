const tsize = 16;
const cols = Math.ceil(window.innerWidth / tsize);
const rows = Math.ceil(window.innerHeight / tsize);

const tiles = Object.fromEntries(
  // floor-1, floor-2 ... floor-8
  [...new Array(8)].map((v, index) =>  {
    const num = index + 1;

    return [
      `floor-${num}`,
      `./assets/dungeon/floor_${num}.png`
    ];
  })
);

const Terrain = {
  tiles,
  load() {
    return Promise.all(Object.entries(this.tiles).map(([key, path]) => Loader.loadImage(key, path)));
  },
  tsize,
  cols,
  rows,
  // imageHeight: 9,
  // imageWidth: 20,
  get width() {
    return this.cols * this.tsize;
  },
  get height() {
    return this.rows * this.tsize;
  },

   layers: [
      randomTerrain(cols, rows, 4, Object.keys(tiles), [0.4, 0.1, 0.4, 0.1], 'manhattan')
      /*
      [
        42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 42,
        42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42,
      ]
      */
  ],
  getTile(layer, col, row) {
    return this.layers[layer][row * this.cols + col];
  },
  isSolidTileAtXY: function (x, y) {
    const solids = [3, 5, 21, 22, 23, 44];

    var col = Math.floor(x / this.tsize);
    var row = Math.floor(y / this.tsize);

    // tiles 3 and 5 are solid -- the rest are walkable
    // loop through all layers and return TRUE if any tile is solid
    return this.layers.reduce(function (res, layer, index) {
      const tile = this.getTile(index, col, row);
      const isSolid = solids.includes(tile);
      return res || isSolid;
    }.bind(this), false);
  },
  getCol: function (x) {
    return Math.floor(x / this.tsize);
  },
  getRow: function (y) {
    return Math.floor(y / this.tsize);
  },
  getX: function (col) {
    return col * this.tsize;
  },
  getY: function (row) {
    return row * this.tsize;
  },
  render() {

    for (let layerIndex = 0; layerIndex < Terrain.layers.length; layerIndex++) {

      for (let c = 0; c < Terrain.cols; c++) {
        for (let r = 0; r < Terrain.rows; r++) {
          let tile = Terrain.getTile(layerIndex, c, r);
          if (!tile) return;

          // const sourceX = ((tile - 1) % Terrain.imageWidth) * Terrain.tsize;
          // const sourceY = Math.floor((tile - 1) / Terrain.imageWidth) * Terrain.tsize; 

          context.drawImage(
            Loader.getImage(tile), // image
            TERRAIN_SCALE_FACTOR * c * Terrain.tsize, // target x
            TERRAIN_SCALE_FACTOR * r * Terrain.tsize, // target y
            TERRAIN_SCALE_FACTOR * Terrain.tsize,
            TERRAIN_SCALE_FACTOR * Terrain.tsize,
          );

        } // \rows
      } // \cols

    } // \layers
  }
};