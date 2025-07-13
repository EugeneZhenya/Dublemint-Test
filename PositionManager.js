export class PositionManager {
  constructor(app, options = {}) {
    this.app = app;
    this.isPortrait = false;
    this.screenW = 0;
    this.screenH = 0;
    this.options = options;
  }

  updateOrientation() {
    this.screenW = this.app.screen.width;
    this.screenH = this.app.screen.height;
    this.isPortrait = this.screenH > this.screenW;
  }

  getReelSize() {
    return {
      width: this.isPortrait ? this.screenW / 6 : this.screenW / 8,
      height: this.isPortrait ? this.screenH * 0.35 : this.screenH * 0.45
    };
  }

  getNeonPosition() {
    return {
      x: this.screenW / 2,
      y: this.isPortrait ? this.screenH * 0.12 : this.screenH * 0.2,
      fontSize: Math.round(this.screenW * 0.06)
    };
  }

  getSpinButtonPosition() {
    return {
      x: this.screenW / 2,
      y: this.isPortrait ? this.screenH - 90 : this.screenH - 60
    };
  }

  getSlotMachinePosition(reelWidth, reelCount) {
    return {
      x: (this.screenW - reelWidth * reelCount) / 2,
      y: this.isPortrait ? this.screenH * 0.4 : this.screenH * 0.5
    };
  }

  getBackgroundSize() {
    return {
      width: this.screenW,
      height: this.screenH
    };
  }
}