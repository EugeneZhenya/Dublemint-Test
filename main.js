import { preloadAssets } from './loader.js';

preloadAssets().then(() => {
  import('./game.js').then(({ startGame }) => {
    startGame();
  });
});