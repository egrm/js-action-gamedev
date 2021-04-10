// init the UI layer
const UI_LAYER = document.createElement('div');

UI_LAYER.setAttribute('style', `
  display: none;
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
      color: white;

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
        display: block;
    `);
    UI_LAYER.appendChild(healthBarWrapper);

    const healthBar = document.createElement('div');
    healthBar.setAttribute('style', `
        height: 100%;
        width: 0%;
        background-color: lightgreen;
    `);
    healthBarWrapper.appendChild(healthBar);


    return (player) => {
      const {name, healthInPercent, centerPosition,score, isDead} = player;

      nameUI.innerHTML = score;

      healthBarWrapper.style.left = (centerPosition.x + healthBarOffset.x) * PIXELART_SCALE_FACTOR + 'px';
      healthBarWrapper.style.top = (centerPosition.y + healthBarOffset.y) * PIXELART_SCALE_FACTOR + 'px';

      healthBarWrapper.style.display = 'none';

      if (isDead) {
        healthBarWrapper.style.display = 'none';
      } else {
        healthBarWrapper.style.display = 'block';
      }

      healthBar.style.width = `${healthInPercent}%`;
    }
  }

  update(data) {
    this._updateDomInstance(data);
  }

  render() {

  }
}

class Dialog extends UIElement {
  constructor(dialogRoot) {
    super(dialogRoot);

    this.dialogData = dialogRoot;
    this.selectedOption = 0;
  }

  keyPressHandler(event) {
    switch (event.key) {
      case 'ArrowLeft':
        this.rollOption(-1);
      break;
      case 'ArrowRight':
        this.rollOption(1);
      break;
      case 'Enter':
        this.selectOption();
      break;
    }
  }

  rollOption(n) {
    if (n > 0) {
      this.selectedOption = (this.selectedOption + n) % this.dialogData.options.length;
    } else {
      this.selectedOption += n;
      if (this.selectedOption < 0) {
        this.selectedOption = this.dialogData.options.length - 1;
      }
    }

    const optionsNode = this.element.querySelector('.dialog-options');
    optionsNode.innerHTML = '';

    this.dialogData.options.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.innerHTML = `
        <span ${index === this.selectedOption ? '' : 'style="visibility:hidden;"'}>*</span>
        ${option.optionText}
      `;
      optionsNode.appendChild(optionElement);
    });

  }

  selectOption() {
    const option = this.dialogData.options[this.selectedOption];
    this.dialogData = option;
    if (option.onSelect) {
      option.onSelect.call(option);
    }

    // TODO: if option has nested options, process it here
  }

  _initDomInstance() {
    const defaultTransition = 'translate(-50%, -50%)';
    this.element = document.createElement('div');
    this.element.setAttribute('style', `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: ${defaultTransition} scale(0);
      color: #eee;
      background-color: #000;
      width: 300px;
      padding: 8px 16px;
      font-size: 20px;
    `);
    UI_LAYER.appendChild(this.element);
    requestAnimationFrame(() => {
      this.element.style.transition = '0.3s';
      this.element.style.transform = defaultTransition;
    });

    const textNode = document.createElement('div');
    textNode.className = 'dialog-text';
    textNode.setAttribute('style', `
      margin-bottom: 8px;
    `);
    textNode.innerHTML = this.dialogData.text;
    this.element.appendChild(textNode);

    const optionsNode = document.createElement('div');
    optionsNode.className = 'dialog-options';
    optionsNode.setAttribute('style', `
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
    `);
    this.element.appendChild(optionsNode);

    this.dialogData.options.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.innerHTML = `
        ${index === this.selectedOption ? '*' : ''}
        ${option.optionText}
      `;
      optionsNode.appendChild(optionElement);
    });

    this._boundHandler = this.keyPressHandler.bind(this);
    document.addEventListener('keydown', this._boundHandler);
  }

  show() {
    Game.pause();
    this._initDomInstance();
  }

  hide() {
    Game.resume();

    if (this.element) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }

    if (this._boundHandler) {
      document.removeEventListener('keyPress', this._boundHandler);
    }
  }
}
