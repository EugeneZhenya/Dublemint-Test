import { Reel } from './Reel.js';
import * as PIXI from 'pixi.js';
import { PositionManager } from './PositionManager.js';

export function startGame() {
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x000000
  });
  document.body.appendChild(app.view);

  const bg = new PIXI.Sprite(PIXI.Assets.get('background'));
  app.stage.addChild(bg);

  // Create Welcome after custom font is loaded
  let neonText;
  document.fonts.load('64px Mexcellent').then(() => {
    neonText = new PIXI.Text('Welcome', {
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

  // SPIN Button
  const spinButton = new PIXI.Container();

  const buttonBg = new PIXI.Graphics();
  buttonBg.beginFill(0xffdd66);
  buttonBg.drawRoundedRect(-80, -30, 160, 60, 12);
  buttonBg.endFill();

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

  const positioner = new PositionManager(app);

function layout() {
  positioner.updateOrientation();

  const { width: reelW, height: reelH } = positioner.getReelSize();
  const { width: bgW, height: bgH } = positioner.getBackgroundSize();
  const { x: neonX, y: neonY, fontSize } = positioner.getNeonPosition();
  const { x: spinX, y: spinY } = positioner.getSpinButtonPosition();
  const { x: slotX, y: slotY } = positioner.getSlotMachinePosition(reelW, reelCount);

  bg.width = bgW;
  bg.height = bgH;

  if (neonText) {
    neonText.x = neonX;
    neonText.y = neonY;
    neonText.style.fontSize = fontSize;
  }

  reels.forEach((reel, i) => {
    reel.resize(reelW, reelH);
    reel.x = i * reelW + reelW / 2;
    reel.y = 0;
  });

  slotMachine.x = slotX;
  slotMachine.y = slotY;

  spinButton.x = spinX;
  spinButton.y = spinY;
}


  layout();
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    layout(); // call layout on resize
  });


  // Button blinking effect
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

  // SPIN Button press handler
  spinButton.on('pointerdown', () => {
    if (isSpinning) return;

    isSpinning = true;
    spinCount++;

    let reelsStopped = 0;

    reels.forEach((reel, i) => {
      // Reset previous winning animation
      const prevSprite = reel.symbols.find(s => {
        const y = s.y + reel.symbolsContainer.y;
        return Math.abs(y) < reel.symbolHeight * 0.6;
      });
      if (prevSprite) reel.stopWinningAnimation(prevSprite);

      // Reel stop handler
      reel.onStop = () => {
        reelsStopped++;

        if (reelsStopped === reels.length) {
          isSpinning = false;

          // Win if three bars in the center
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