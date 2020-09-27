// TODO: first and last values have smaller probability
const randomInt = (min, max) => {
  return Math.round(Math.random() * (max - min)) + min;
};

/**
 * @param {any[]} items - Array of items to select from
 * @param {number[]} probAcc - Array of accumulated probabilities
 */
const selectWithProbability = (items, probAcc) => {
  const r = Math.random();
  for (let i = 0; i < probAcc.length; i++) {
    if (r <= probAcc[i]) {
      return items[i];
    }
  }
};

/**
 * @param {number} width - Width of generated terrain
 * @param {number} height - Height of generated terrain
 * @param {number} nSeeds - Number of terrain tile seeds
 * @param {number[]} tiles - Tile codes available for seeding the terrain
 * @param {number[]} prob - Probabilities of using corresponding tile for seeding
 * @param {'manhattan'|'euclidean'|'infinity'} norm - Norm used to determine closest seed
 */
const randomTerrain = (width, height, nSeeds, tiles, prob, norm = 'manhattan') => {
  // Prepare probability
  const totalP = prob.reduce((acc, p) => acc + p, 0);
  if (totalP === 0) {
    return null;
  }
  const probAcc = new Array(prob.length);
  prob.forEach((p, ind) => {
    probAcc[ind] = (ind === 0 ? p : p + probAcc[ind - 1]) / totalP;
  });

  // Seed the terrain
  const seeds = [];
  const terrain = new Array(width * height).fill(0);
  for (let i = 0; i < nSeeds; i++) {
    const x = randomInt(0, width - 1);
    const y = randomInt(0, height - 1);
    const seed = selectWithProbability(tiles, probAcc);
    seeds.push({ seed, x, y });
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Find closest seed
      let bestDist = Infinity;
      let bestSeed = null;
      for (const {seed, x: seedX, y: seedY} of seeds) {
        let dist = Infinity;
        const dx = seedX - x;
        const dy = seedY - y;
        switch (norm) {
          case 'manhattan':
            dist = Math.abs(dx) + Math.abs(dy);
          break;
          case 'euclidean':
            dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
          break;
          case 'infinity':
            dist = Math.max(Math.abs(dx), Math.abs(dy));
          break;
        }
        if (dist < bestDist) {
          bestDist = dist;
          bestSeed = seed;
        }
      }

      const index = y * width + x;
      terrain[index] = bestSeed;
    }
  }

  return terrain;
};

// data structures 
class v2 {
  constructor({x, y}) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.sqrt(
      Math.pow(this.x, 2) +
      Math.pow(this.y, 2)
    );
  }

  get asNormal() {
    return v2.normalize(this);
  }

  static normalize(vector) {
    const {x, y, length} = vector;

    if (length === 0) return new v2({x: 0, y: 0});

    return new v2({x: x / length, y: y / length});
  }

  static scale(vector, coefficient) {
    const {x, y} = vector;
    return new v2({x: x * coefficient, y: y * coefficient});
  }

  static add(first, second) {
    return new v2({x: first.x + second.x, y: first.y + second.y});
  }

  static subtract(first, second) {
    return new v2({x: first.x - second.x, y: first.y - second.y});
  }
}

function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}
