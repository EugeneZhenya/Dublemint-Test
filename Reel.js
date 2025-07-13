import * as PIXI from 'pixi.js';

export class Reel extends PIXI.Container {
  constructor({ width, height, symbolTextures }) {
    super();

    this.symbolTextures = symbolTextures;
    this.symbolHeight = height / 3;
    this.totalSymbols = 10;
    this.centerIndex = 1;

    this.symbolsContainer = new PIXI.Container();
    this.addChild(this.symbolsContainer);

    this.symbols = [];
    for (let i = 0; i < this.totalSymbols; i++) {
      const sprite = new PIXI.Sprite(this.getRandomTexture());
      sprite.anchor.set(0.5);
      sprite.width = width * 0.8;
      sprite.height = this.symbolHeight * 0.9;
      sprite.x = 0;
      sprite.y = (i - 1) * this.symbolHeight;
      this.symbolsContainer.addChild(sprite);
      this.symbols.push(sprite);
    }

    this.mask = new PIXI.Graphics();
    this.symbolsContainer.mask = this.mask;
    this.addChild(this.mask);

    this.reelBg = new PIXI.Graphics();
    this.reelFrame = new PIXI.Graphics();
    this.winLine = new PIXI.Graphics();
    this.addChildAt(this.reelBg, 0);
    this.addChild(this.reelFrame);
    this.addChild(this.winLine);

    this.symbolsContainer.y = 0;
    this.spinning = false;
    this.onStop = null;

    this.resize(width, height);
  }

  getRandomTexture() {
    return this.symbolTextures[
      Math.floor(Math.random() * this.symbolTextures.length)
    ];
  }

  getCenterSprite() {
    return this.symbols[this.centerIndex];
  }

  startWinningAnimation(sprite) {
    if (!sprite) return;

    let scaleUp = true;
    sprite.rotation = 0;

    sprite._winTicker = () => {
      sprite.rotation += 0.01;
      const s = sprite.scale.x;

      sprite.scale.set(scaleUp ? Math.min(s + 0.01, 1.1) : Math.max(s - 0.01, 0.9));
      if (s >= 1.1) scaleUp = false;
      if (s <= 0.9) scaleUp = true;
    };

    PIXI.Ticker.shared.add(sprite._winTicker);
  }

  stopWinningAnimation(sprite) {
    if (sprite?._winTicker) {
      PIXI.Ticker.shared.remove(sprite._winTicker);
      delete sprite._winTicker;
      sprite.rotation = 0;
      sprite.scale.set(1);
      sprite.alpha = 1;
    }
  }

  resize(width, height) {
    this.symbolHeight = height / 3;

    this.symbols.forEach((sprite, i) => {
      sprite.width = width * 0.8;
      sprite.height = this.symbolHeight * 0.9;
      sprite.x = 0;
      sprite.y = (i - 1) * this.symbolHeight;
    });

    this.mask.clear();
    this.mask.beginFill(0xffffff);
    this.mask.drawRect(-width / 2, -height / 2, width, height);
    this.mask.endFill();

    this.reelBg.clear();
    this.reelBg.beginFill(0x000000, 0.75);
    this.reelBg.drawRoundedRect(-width / 2, -height / 2, width, height, 15);
    this.reelBg.endFill();

    this.reelFrame.clear();
    this.reelFrame.lineStyle(3, 0xffcc66);
    this.reelFrame.drawRoundedRect(-width / 2, -height / 2, width, height, 15);

    this.winLine.clear();
    this.winLine.lineStyle(3, 0xffcc66);
    this.winLine.moveTo(-width / 2 + 8, 0);
    this.winLine.lineTo(width / 2 - 8, 0);

    this._pulsePhase = Math.random() * Math.PI * 2; // випадкова фаза для кожного барабана

    PIXI.Ticker.shared.add(() => {
      this._pulsePhase += 0.015;
      const glow = 0.9 + 0.1 * Math.sin(this._pulsePhase);
      this.reelBg.alpha = glow;
    });
  }

  backout(amount) {
    return t => (--t) * t * ((amount + 1) * t + amount) + 1;
  }

  startSpin(duration = 2500, spins = 20) {
    if (this.spinning) return;

    this.spinning = true;
    this.startY = this.symbolsContainer.y;
    this.totalShift = spins * this.symbolHeight;
    this.time = 0;
    this.duration = duration;

    PIXI.Ticker.shared.add(this.spinStep, this);
  }

  spinStep(delta) {
    this.time += delta * 16.66;
    const progress = Math.min(this.time / this.duration, 1);
    const eased = this.backout(0.5)(progress);
    this.symbolsContainer.y = this.startY + this.totalShift * eased;

    if (progress < 1) {
      const last = this.symbols[this.symbols.length - 1];
      const localY = last.y + this.symbolsContainer.y;

      if (localY > this.symbolHeight * 2.5) {
        const removed = this.symbols.pop();
        removed.texture = this.getRandomTexture();
        const first = this.symbols[0];
        removed.y = first.y - this.symbolHeight;
        this.symbols.unshift(removed);
      }
    } else {
      PIXI.Ticker.shared.remove(this.spinStep, this);
      this.spinning = false;
      if (typeof this.onStop === 'function') this.onStop();
    }
  }
}