import * as PIXI from 'pixi.js';

/**
 * Завантажує ресурси з прелоад-екраном.
 * Повертає Promise, після завершення — графіка готова.
 */
export async function preloadAssets() {
  const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x0d0d0d,
    antialias: true,
    resolution: window.devicePixelRatio || 1
  });

  const canvas = app.view;
  document.body.appendChild(canvas);

  // 🔤 Текст завантаження
  const loadingText = new PIXI.Text('Loading...', {
    fontFamily: 'Segoe UI',
    fontSize: 28,
    fill: 0xffffff
  });
  loadingText.anchor.set(0.5);
  loadingText.x = app.screen.width / 2;
  loadingText.y = app.screen.height / 2 - 50;
  app.stage.addChild(loadingText);

  // 📊 Прогрес-бар
  const progressBox = new PIXI.Graphics();
  progressBox.beginFill(0x444444);
  progressBox.drawRect(0, 0, 300, 20);
  progressBox.endFill();
  progressBox.x = app.screen.width / 2 - 150;
  progressBox.y = app.screen.height / 2;
  app.stage.addChild(progressBox);

  const progressBar = new PIXI.Graphics();
  progressBar.x = progressBox.x;
  progressBar.y = progressBox.y;
  app.stage.addChild(progressBar);

  // 🗂️ Реєстрація бандлу ресурсів
  await PIXI.Assets.init({ manifest: {
    bundles: [
      {
        name: 'symbols',
        assets: [
          { alias: 'bar', src: 'assets/bar.png' },
          { alias: 'cherries', src: 'assets/cherries.png' },
          { alias: 'coconut', src: 'assets/coconut.png' },
          { alias: 'peach', src: 'assets/peach.png' },
          { alias: 'pineapple', src: 'assets/pineapple.png' },
          { alias: 'strawberry', src: 'assets/strawberry.png' },
          { alias: 'threeBars', src: 'assets/threeBars.png' },
          { alias: 'twoBars', src: 'assets/twoBars.png' },
          { alias: 'background', src: 'assets/th.jpg' },
        ]
      }
    ]
  }});

  // 🚚 Завантаження з оновленням прогресу
  await PIXI.Assets.loadBundle('symbols', (progress) => {
    progressBar.clear();
    progressBar.beginFill(0xffffff);
    progressBar.drawRect(0, 0, progress * 300, 20);
    progressBar.endFill();

    loadingText.text = `Loading... ${Math.floor(progress * 100)}%`;
  });

  // 🧹 Очистка після завершення
  app.destroy(true, { children: true, texture: true, baseTexture: true });
  if (canvas instanceof Node && canvas.parentNode) {
    canvas.remove(); // надійно видаляємо канву
  }
}