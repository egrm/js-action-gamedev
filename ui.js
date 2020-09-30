// init the UI layer
const UI_LAYER = document.createElement('div');

UI_LAYER.setAttribute('style', `
  position: absolute;

  width: ${Terrain.width * PIXELART_SCALE_FACTOR}px;
  height: ${Terrain.height * PIXELART_SCALE_FACTOR}px;

  top: ${canvas.offsetTop}px;
  left: ${canvas.offsetLeft}px;

  pointer-events: none;
`);

document.body.appendChild(UI_LAYER);

class UIElement {}

class PlayerUI extends UIElement {
  constructor(data) {
    super(data);

    this._cachedData = data;

    this._updateDomInstance = this._initDomInstance();
    this._updateDomInstance(data);
  }

  _initDomInstance() {
    const infoUI = document.createElement('div');
    UI_LAYER.appendChild(infoUI);

    infoUI.setAttribute('style', `
      position: absolute;
      background-color: rgba(0,0,0,0.3);
      top: 0;
      right: 0;
      padding: 0.5rem;

      text-align: right;
    `);
    
    
    const nameUI = document.createElement('div');
    infoUI.appendChild(nameUI);

    const healthBarWidth = 50;

    const healthBarOffset = new v2({
      // x: -(healthBarWidth / PIXELART_SCALE_FACTOR) / 2,
      x: -19,
      y: 12,
    })

    const healthBarWrapper = document.createElement('div');
    healthBarWrapper.setAttribute('style', `
        position: absolute;
        width: ${healthBarWidth}px;
        height: 5px;
        background: #111;
        padding: 3px;
        opacity: 0.5;
    `);
    UI_LAYER.appendChild(healthBarWrapper);

    const healthBar = document.createElement('div');
    healthBar.setAttribute('style', `
        height: 100%;
        width: 0%;
        background-color: lightgreen;
    `);
    healthBarWrapper.appendChild(healthBar);


    return (data) => {
      const {name, healthInPercent, centerPosition} = data;
      nameUI.innerHTML = name;

      healthBarWrapper.style.left = (centerPosition.x + healthBarOffset.x) * PIXELART_SCALE_FACTOR + 'px';
      healthBarWrapper.style.top = (centerPosition.y + healthBarOffset.y) * PIXELART_SCALE_FACTOR + 'px';

      healthBar.style.width = `${healthInPercent}%`;
    }
  }

  update(data) {
    this._updateDomInstance(data);
  }

  render() {

  }
}