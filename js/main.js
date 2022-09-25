let COLOUR_ADJUSTMENT = 0.8;
const FRAMES_PER_SECOND = 24;
const MAX_DEPTH = 32;
const TAU = 2 * Math.PI;
const OFFSET = 0;

class Rotator {
  constructor(rotation = 0, scale = 1) {
    const radians = TAU * rotation;

    return [Math.cos(radians) * scale, Math.sin(radians) * scale];
  }
}

class FractalClock {
  constructor(settings) {
    this.settings = {
      colour: {
        background: [32, 32, 32],
        line: [107, 228, 212]
      },
      depth: 10,
      lineWidth: 2,
      scale: 0.9,
      opacity: 0.6,
      showFps: false
    };

    Object.assign(this.settings, settings);

    this.dom = {
      body: document.getElementById('container'),
      canvas: document.createElement('canvas'),
      overlay: document.createElement('div')
    };

    this.ctx = this.dom.canvas.getContext('2d');
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.isPaused = false;
    this.isTicking = false;

    window.addEventListener('resize', () => {
      if (!this.isTicking) {
        window.requestAnimationFrame(this.setCanvasDimensions.bind(this));
      }

      this.isTicking = true;
    });

    document.addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 37:
          this.settings.scale = Math.max(this.settings.scale - 0.05, 0);
          break;
        case 39:
          this.settings.scale = Math.min(this.settings.scale + 0.05, 1);
          break;
        case 38:
          this.settings.opacity = Math.min(this.settings.opacity + 0.05, 1);
          break;
        case 40:
          this.settings.opacity = Math.max(this.settings.opacity - 0.05, 0);
          break;
        case 67:
          // this.dom.canvas.style.backgroundColor = `rgb(${Math.random() * 255}, ${Math.random() *
          //   255}, ${Math.random() * 255}`;
          this.settings.colour.line = [
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255
          ];
          break;
        case 70:
          this.settings.showFps = !this.settings.showFps;
          break;
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          this.settings.depth = parseInt(e.keyCode, 10) - 48;
          break;
        case 32:
          this.isPaused = !this.isPaused;
          this.animate();
        default:
          break;
      }
    });

    this.buildCanvas();
    this.buildOverlay();

    this.dom.overlay.addEventListener('click', () => {
      this.settings.colour.line = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
    });

    if (this.settings.showFps) {
      this.buildFpsCounter();
    }

    this.animate();
  }

  animate() {
    if (!this.isPaused) {
      window.requestAnimationFrame(this.animate.bind(this));

      if (this.settings.showFps) {
        const timestamp = performance.now();

        if (!this.dom.fps) {
          this.buildFpsCounter();
        } else {
          this.dom.fps.textContent = `${Math.round(1000 / (timestamp - this.lastTimestamp))}FPS`;
        }

        this.lastTimestamp = timestamp;
      } else {
        if (this.dom.fps) {
          this.dom.fps.remove();
          this.dom.fps = null;
        }
      }

      this.updateAngles();
      this.draw();
    }
  }

  draw() {
    this.clearCanvas();
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = `rgb(${this.settings.colour.line.join()})`;
    this.ctx.lineWidth = this.settings.lineWidth * window.devicePixelRatio;

    const centre = {
      x: this.dom.canvas.width / 2,
      y: this.dom.canvas.height / 2
    };

    const length = Math.min(this.dom.canvas.width, this.dom.canvas.height) / 4;

    this.ctx.beginPath();
    this.ctx.moveTo(centre.x, centre.y);
    this.ctx.lineTo(
      centre.x + (Math.cos(this.angle.hour) * length) / 2,
      centre.y + (Math.sin(this.angle.hour) * length) / 2
    );
    this.ctx.stroke();

    this.drawMinuteSecond(this.settings.depth, length, centre, 1, 0);
  }

  drawMinuteSecond(count, length, centre, alpha, angle) {
    this.ctx.globalAlpha = alpha;

    this.ctx.beginPath();
    this.ctx.moveTo(centre.x, centre.y);
    this.ctx.lineTo(
      centre.x + Math.cos(this.angle.second + angle) * length,
      centre.y + Math.sin(this.angle.second + angle) * length
    );
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(centre.x, centre.y);
    this.ctx.lineTo(
      centre.x + Math.cos(this.angle.minute + angle) * length,
      centre.y + Math.sin(this.angle.minute + angle) * length
    );
    this.ctx.stroke();

    if (count) {
      this.drawMinuteSecond(
        count - 1,
        length * this.settings.scale,
        {
          x: centre.x + Math.cos(this.angle.second + angle) * length,
          y: centre.y + Math.sin(this.angle.second + angle) * length
        },
        alpha * this.settings.opacity,
        this.angle.second - this.angle.hour - Math.PI + angle + OFFSET
      );
      this.drawMinuteSecond(
        count - 1,
        length * this.settings.scale,
        {
          x: centre.x + Math.cos(this.angle.minute + angle) * length,
          y: centre.y + Math.sin(this.angle.minute + angle) * length
        },
        alpha * this.settings.opacity,
        this.angle.minute - this.angle.hour - Math.PI + angle + OFFSET
      );
    }
  }

  buildCanvas() {
    this.dom.body.appendChild(this.dom.canvas);
    this.dom.canvas.style.backgroundColor = `rgb(${this.settings.colour.background[0]}, ${
      this.settings.colour.background[1]
    }, ${this.settings.colour.background[2]})`;
    this.setCanvasDimensions();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
  }

  setCanvasDimensions() {
    this.isTicking = false;

    this.dom.canvas.width = this.dom.body.clientWidth * window.devicePixelRatio;
    this.dom.canvas.height = this.dom.body.clientHeight * window.devicePixelRatio;

    FractalClock.applyStyles(this.dom.canvas, {
      width: `${this.dom.body.clientWidth}px`,
      height: `${this.dom.body.clientHeight}px`
    });
  }

  updateAngles() {
    const now = FractalClock.getNow();

    const date = new Date();
    const seconds = (date.getSeconds() * 1000 + date.getMilliseconds()) / 1000;
    const minutes = date.getMinutes() + seconds / 60;
    const hours = (date.getHours() % 12) + minutes / 60;

    this.angle = {
      second: FractalClock.ratioToRadians(seconds / 60),
      minute: FractalClock.ratioToRadians(minutes / 60),
      hour: FractalClock.ratioToRadians(hours / 12)
    };
  }

  buildFpsCounter() {
    this.lastTimestamp = performance.now();

    this.dom.fps = document.createElement('div');

    FractalClock.applyStyles(this.dom.fps, {
      position: 'absolute',
      top: '5px',
      right: '5px',
      padding: '0.3em',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '2px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1em',
      color: '#ffffff'
    });

    this.dom.fps.textContent = '00fps';

    this.dom.body.appendChild(this.dom.fps);
  }

  drawBranch(r0, r1, depth, depthLeft, colour) {
    if (depthLeft > 0) {
    }
  }

  buildOverlay() {
    FractalClock.applyStyles(this.dom.overlay, {
      position: 'absolute',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      zIndex: 2
    });

    this.dom.body.appendChild(this.dom.overlay);
  }

  static getRootAndRotators() {
    const now = FractalClock.getNow();
    const hourRotation = FractalClock.getRotation(now, 12 * 60 * 60 * 1000);
    const minuteRotation = FractalClock.getRotation(now, 60 * 60 * 1000);
    const secondRotation = FractalClock.getRotation(now, 60 * 1000);

    const scale = 0.97;

    this.r0 = new Rotator(secondRotation - hourRotation, -scale);
    this.r1 = new Rotator(minuteRotation - hourRotation, -scale);

    this.r = new Rotator(hourRotation);
  }

  static getNow() {
    const date = new Date();

    return (
      ((date.getHours() * 60 + date.getMinutes()) * 60 + date.getSeconds()) * 1000 +
      date.getMilliseconds()
    );
  }

  static getRotation(now, period) {
    return (now % period) / period - 0.25;
  }

  static ratioToRadians(value) {
    return value * 2 * Math.PI - Math.PI / 2;
  }

  static applyStyles(el, styles) {
    Object.assign(el.style, styles);
  }
}

const fractalClock = new FractalClock();
