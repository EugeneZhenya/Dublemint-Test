import { Reel } from './Reel.js';
import * as PIXI from 'pixi.js';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';

export function startGame() {
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x000000
  });
  document.body.appendChild(app.view);

  const bg = new PIXI.Sprite(PIXI.Assets.get('background'));
  app.stage.addChild(bg);

  // 🪩 Створюємо Welcome після завантаження кастомного шрифта
  document.fonts.load('64px Mexcellent').then(() => {
    const neonText = new PIXI.Text('Welcome', {
      fontFamily: 'Mexcellent',
      fontSize: 64,
      fill: 0x00ffff,
      dropShadow: true,
      dropShadowColor: 0x00ffff,
      dropShadowBlur: 15,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6
    });
    neonText.anchor.set(0.5);
    neonText.x = app.screen.width / 2;
    neonText.y = 160;
    app.stage.addChild(neonText);

    let neonPhase = 0;
    PIXI.Ticker.shared.add(() => {
      neonPhase += 0.02;
      const pulse = 1 + 0.05 * Math.sin(neonPhase);
      neonText.scale.set(pulse);
      neonText.rotation = 0.02 * Math.sin(neonPhase * 2);
    });
  });

  const symbolAliases = [
    'bar', 'cherries', 'coconut', 'peach',
    'pineapple', 'strawberry', 'threeBars', 'twoBars'
  ];
  const symbolTextures = symbolAliases.map(alias => PIXI.Assets.get(alias));

  const reels = [];
  const reelCount = 5;
  const slotMachine = new PIXI.Container();
  app.stage.addChild(slotMachine);

  for (let i = 0; i < reelCount; i++) {
    const reel = new Reel({
      width: app.screen.width / 8,
      height: app.screen.height * 0.45,
      symbolTextures
    });
    slotMachine.addChild(reel);
    reels.push(reel);
  }

  // 🔘 Кнопка SPIN
  const spinButton = new PIXI.Container();

  const buttonBg = new PIXI.Graphics();
  buttonBg.beginFill(0xffdd66);
  buttonBg.drawRoundedRect(-80, -30, 160, 60, 12);
  buttonBg.endFill();
  buttonBg.filters = [new DropShadowFilter({ color: 0x000000, blur: 4, distance: 4, alpha: 0.5 })];

  const buttonText = new PIXI.Text('SPIN', {
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 32,
    fill: 0x8b0000
  });
  buttonText.anchor.set(0.5);

  spinButton.addChild(buttonBg, buttonText);
  spinButton.eventMode = 'static';
  spinButton.buttonMode = true;
  app.stage.addChild(spinButton);

  let spinCount = 0;
  let isSpinning = false;
  let blinkPhase = 0;

  function layout() {
    const reelWidth = app.screen.width / 8;
    const reelHeight = app.screen.height * 0.45;

    reels.forEach((reel, i) => {
      reel.resize(reelWidth, reelHeight);
      reel.x = i * reelWidth + reelWidth / 2;
      reel.y = 0;
    });

    slotMachine.x = app.screen.width / 2 - (reelWidth * reelCount) / 2;
    slotMachine.y = app.screen.height / 2;

    bg.width = app.screen.width;
    bg.height = app.screen.height;

    spinButton.x = app.screen.width / 2;
    spinButton.y = app.screen.height - 60;
    buttonText.y = 0;
  }

  layout();
  window.addEventListener('resize', layout);

  // 🔄 Пульсація кнопки
  PIXI.Ticker.shared.add(() => {
    if (!isSpinning) {
      blinkPhase += 0.05;
      const blink = 0.85 + 0.15 * Math.sin(blinkPhase);
      buttonBg.alpha = blink;
      buttonText.alpha = blink;
    } else {
      buttonBg.alpha = 0.4;
      buttonText.alpha = 0.4;
    }
  });

  // 🎰 Обробка натискання SPIN
  spinButton.on('pointerdown', () => {
    if (isSpinning) return;

    isSpinning = true;
    spinCount++;
    console.log(`SPIN #${spinCount}`);
    let reelsStopped = 0;

    reels.forEach((reel, i) => {
      // ❌ Скидання попередньої анімації
      const prevSprite = reel.symbols.find(s => {
        const y = s.y + reel.symbolsContainer.y;
        return Math.abs(y) < reel.symbolHeight * 0.6;
      });
      if (prevSprite) reel.stopWinningAnimation(prevSprite);

      // ✅ Обробка зупинки барабану
      reel.onStop = () => {
        reelsStopped++;

        if (reelsStopped === reels.length) {
          isSpinning = false;

          // 🎯 Виграш тільки якщо threeBars у центрі середнього барабану
          const centerSprites = reels.map(r => {
            return r.symbols.find(s => {
              const y = s.y + r.symbolsContainer.y;
              return Math.abs(y) < r.symbolHeight * 0.6;
            });
          });

          const middleSprite = centerSprites[2];
          const isThreeBarWin = middleSprite?.texture === PIXI.Assets.get('threeBars');

          if (isThreeBarWin) {
            centerSprites.forEach((sprite, i) => {
              if (sprite) reels[i].startWinningAnimation(sprite);
            });
          }
        }
      };

      setTimeout(() => reel.startSpin(2000 + i * 300, 12), i * 300);
    });
  });
}