const cols = 12;
const rows = 12;
const Terrain = {
  cols,
  rows,
  tsize: 32,
  imageHeight: 9,
  imageWidth: 20,
  get width() {
    return this.rows * this.tsize;
  },
  get height() {
    return this.cols * this.tsize;
  },
  /*

  Terrain tile codes reference:

  41 - grass

  42 - water

  43 - ground

  44 - wall


  */
  layers: [
    randomTerrain(cols, rows, 4, [41, 42, 43, 44], [0.4, 0.1, 0.4, 0.1], 'manhattan')
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
          if (tile !== 0) { // 0 => empty tile
            const sourceX = ((tile - 1) % Terrain.imageWidth) * Terrain.tsize;
            const sourceY = Math.floor((tile - 1) / Terrain.imageWidth) * Terrain.tsize;
            context.drawImage(
              Loader.getImage("terrain"), // image
              sourceX, // source x
              sourceY, // source y
              Terrain.tsize, // source width
              Terrain.tsize, // source height
              c * Terrain.tsize, // target x
              r * Terrain.tsize, // target y
              Terrain.tsize, // target width
              Terrain.tsize // target height
            );
          }
        } // \rows
      } // \cols

    } // \layers
  }
};