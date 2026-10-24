/**
 * game.js - Tung Tung Sahur: Temple Escape (2D 8-Bit HTML5 Canvas)
 * Pure vanilla JavaScript - 100% self-contained & silent
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 540;
  const TILE_SIZE = 32;
  const GRAVITY = 0.60;
  const PLAYER_SPEED = 4.2;
  const PLAYER_JUMP_POWER = -14.0;
  const STOMP_BOUNCE = -11.0;
  const SLAM_COOLDOWN = 10.0; // 10 seconds (User requested)
  const SLAM_RADIUS = 195;
  const MAX_HEALTH = 5;
  const INITIAL_HEALTH = 3;
  const INVULNERABILITY_DURATION = 1.6;
  const HEAL_AFTER_LEVELS = 3;
  const HEAL_AMOUNT = 3;
  const TOTAL_LEVELS = 6;
  const LEADERBOARD_STORAGE_KEY = 'tung_tung_sahur_records';

  // --- DOM Elements ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const screens = {
    mainMenu: document.getElementById('mainMenu'),
    howTo: document.getElementById('howToScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
    victory: document.getElementById('victoryScreen'),
    gameOver: document.getElementById('gameOverScreen')
  };

  const buttons = {
    play: document.getElementById('btnPlay'),
    howTo: document.getElementById('btnHowTo'),
    leaderboard: document.getElementById('btnLeaderboard'),
    backFromHowTo: document.getElementById('btnBackFromHowTo'),
    backFromLeaderboard: document.getElementById('btnBackFromLeaderboard'),
    clearLeaderboard: document.getElementById('btnClearLeaderboard'),
    retry: document.getElementById('btnRetry'),
    menuFromGameOver: document.getElementById('btnMenuFromGameOver'),
    saveScore: document.getElementById('btnSaveScore')
  };

  const playerNameInput = document.getElementById('playerNameInput');
  const victoryTimeSpan = document.getElementById('victoryTime');
  const gameOverSummary = document.getElementById('gameOverSummary');
  const leaderboardBody = document.getElementById('leaderboardBody');

  // Virtual Touch Control Elements (Mobile & iPad)
  const touchControls = document.getElementById('touchControls');
  const touchButtons = {
    left: document.getElementById('btnTouchLeft'),
    right: document.getElementById('btnTouchRight'),
    jump: document.getElementById('btnTouchJump'),
    ability: document.getElementById('btnTouchAbility'),
    hit: document.getElementById('btnTouchHit'),
    toggle: document.getElementById('btnTouchToggle')
  };
  const touchAbilityCdText = document.getElementById('touchAbilityCdText');
  const abilityCdOverlay = document.getElementById('abilityCdOverlay');
  let touchControlsEnabled = true;

  // --- Helper: Format Time ---
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds * 100) % 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }

  // --- Procedural 8-Bit Sprite Generator ---
  const Sprites = (function () {
    function createOffscreen(w, h, drawFn) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cctx = c.getContext('2d');
      cctx.imageSmoothingEnabled = false;
      drawFn(cctx);
      return c;
    }

    // Tung Tung Sahur Player Frames (Meme Pentungan / Wooden Log Man)
    const playerRunFrames = [];
    [-2, 0, 2].forEach(legOffset => {
      playerRunFrames.push(createOffscreen(36, 44, (c) => {
        // Wooden Cylinder Body (rounded top log)
        c.fillStyle = '#8b5224'; // dark wood border
        c.beginPath();
        if (c.roundRect) c.roundRect(8, 2, 18, 28, [9, 9, 4, 4]);
        else c.rect(8, 2, 18, 28);
        c.fill();

        c.fillStyle = '#b37438'; // main wood body
        c.beginPath();
        if (c.roundRect) c.roundRect(9, 3, 16, 26, [8, 8, 3, 3]);
        else c.rect(9, 3, 16, 26);
        c.fill();

        // Wood grain highlight
        c.fillStyle = '#db9a56';
        c.fillRect(10, 4, 3, 24);

        // Pentungan / slit drum vertical slit
        c.fillStyle = '#4a2810';
        c.fillRect(16, 20, 3, 8);

        // Big Bulging Eyes (Iconic meme look from photo)
        // Left Eye
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(13, 9, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#111111';
        c.beginPath();
        c.arc(13, 9, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(12, 7, 1.5, 1.5); // shine

        // Right Eye
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(21, 9, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#111111';
        c.beginPath();
        c.arc(21, 9, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(20, 7, 1.5, 1.5); // shine

        // Creepy Wide Grin with teeth
        c.fillStyle = '#3a1a08';
        c.beginPath();
        c.arc(17, 16, 6, 0.1, Math.PI - 0.1);
        c.fill();
        // Teeth
        c.fillStyle = '#ffffff';
        c.fillRect(13, 16, 2, 2);
        c.fillRect(16, 16, 2, 2);
        c.fillRect(19, 16, 2, 2);

        // Skinny wooden arm holding baseball bat / club
        c.strokeStyle = '#8b5224';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(25, 18);
        c.lineTo(29, 22);
        c.stroke();

        // Wooden Club / Bat held in hand
        c.fillStyle = '#d2a679';
        c.strokeStyle = '#6e411b';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(27, 24);
        c.lineTo(33, 12);
        c.lineTo(31, 10);
        c.lineTo(25, 23);
        c.closePath();
        c.fill();
        c.stroke();

        // Skinny wooden legs & feet (bare feet from image)
        c.strokeStyle = '#8b5224';
        c.lineWidth = 2;
        // Left leg
        c.beginPath();
        c.moveTo(12, 30);
        c.lineTo(12 + legOffset, 39);
        c.stroke();
        c.fillStyle = '#9b612d';
        c.fillRect(10 + legOffset, 39, 5, 3); // foot

        // Right leg
        c.beginPath();
        c.moveTo(22, 30);
        c.lineTo(22 - legOffset, 39);
        c.stroke();
        c.fillRect(20 - legOffset, 39, 5, 3); // foot
      }));
    });

    const playerJump = createOffscreen(36, 44, (c) => {
      c.fillStyle = '#8b5224';
      c.beginPath();
      if (c.roundRect) c.roundRect(8, 2, 18, 28, [9, 9, 4, 4]);
      else c.rect(8, 2, 18, 28);
      c.fill();

      c.fillStyle = '#b37438';
      c.beginPath();
      if (c.roundRect) c.roundRect(9, 3, 16, 26, [8, 8, 3, 3]);
      else c.rect(9, 3, 16, 26);
      c.fill();

      c.fillStyle = '#db9a56';
      c.fillRect(10, 4, 3, 24);

      c.fillStyle = '#4a2810';
      c.fillRect(16, 20, 3, 8);

      // Bulging Eyes
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(13, 9, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(13, 9, 3, 0, Math.PI * 2); c.fill();

      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(21, 9, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(21, 9, 3, 0, Math.PI * 2); c.fill();

      // Wide Grin
      c.fillStyle = '#3a1a08';
      c.beginPath(); c.arc(17, 16, 6, 0.1, Math.PI - 0.1); c.fill();
      c.fillStyle = '#ffffff';
      c.fillRect(13, 16, 2, 2); c.fillRect(16, 16, 2, 2); c.fillRect(19, 16, 2, 2);

      // Bat raised high ready to smash
      c.fillStyle = '#d2a679';
      c.strokeStyle = '#6e411b';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(26, 15); c.lineTo(34, 4); c.lineTo(32, 2); c.lineTo(24, 13);
      c.closePath(); c.fill(); c.stroke();

      // Bent legs
      c.strokeStyle = '#8b5224';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(12, 30); c.lineTo(9, 36); c.stroke();
      c.fillStyle = '#9b612d'; c.fillRect(7, 36, 5, 3);
      c.beginPath(); c.moveTo(22, 30); c.lineTo(25, 36); c.stroke();
      c.fillRect(23, 36, 5, 3);
    });

    const playerSlam = createOffscreen(36, 44, (c) => {
      c.fillStyle = '#8b5224';
      c.beginPath();
      if (c.roundRect) c.roundRect(8, 6, 18, 28, [9, 9, 4, 4]);
      else c.rect(8, 6, 18, 28);
      c.fill();

      c.fillStyle = '#b37438';
      c.beginPath();
      if (c.roundRect) c.roundRect(9, 7, 16, 26, [8, 8, 3, 3]);
      else c.rect(9, 7, 16, 26);
      c.fill();

      // Eyes staring down
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(13, 13, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(13, 14, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(21, 13, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(21, 14, 3, 0, Math.PI * 2); c.fill();

      // Grin
      c.fillStyle = '#3a1a08';
      c.beginPath(); c.arc(17, 20, 6, 0.1, Math.PI - 0.1); c.fill();

      // Bat slammed into ground with sparks
      c.strokeStyle = '#d2a679';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(22, 22); c.lineTo(30, 40); c.stroke();

      c.fillStyle = '#ffd700';
      c.beginPath(); c.arc(30, 40, 5, 0, Math.PI * 2); c.fill();
    });

    // Spider Frames
    const spiderFrames = [0, 1].map(step => createOffscreen(32, 24, (c) => {
      c.fillStyle = '#6e192d';
      c.beginPath();
      c.ellipse(17, 10, 7, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#460f1e';
      c.beginPath();
      c.arc(8, 10, 5, 0, Math.PI * 2);
      c.fill();
      // Glowing Red Eyes
      c.fillStyle = '#ef4444';
      c.fillRect(5, 8, 2, 2);
      c.fillRect(7, 7, 2, 1);
      // Legs
      c.strokeStyle = '#3c0f19';
      c.lineWidth = 2;
      const offsets = step === 0 ? [-3, 3, -3, 3] : [3, -3, 3, -3];
      [10, 14, 18, 22].forEach((lx, i) => {
        const dy = offsets[i];
        c.beginPath();
        c.moveTo(lx, 10);
        c.lineTo(lx - 4, 2 + dy);
        c.lineTo(lx - 7, 18 + dy);
        c.stroke();
      });
    }));

    // Ghost Frames
    const ghostFrames = [0, 1, 2].map(wave => createOffscreen(30, 32, (c) => {
      // Aura
      c.fillStyle = 'rgba(100, 220, 255, 0.2)';
      c.beginPath();
      c.arc(15, 14, 13, 0, Math.PI * 2);
      c.fill();
      // Body
      c.fillStyle = '#bdf0ff';
      c.beginPath();
      c.arc(15, 13, 10, 0, Math.PI * 2);
      c.fill();
      c.fillRect(5, 13, 20, 11);
      // Skirt fringe
      const skirt = [[0, 2, 0], [2, 0, 2], [1, 3, 1]][wave];
      [5, 12, 19].forEach((ox, idx) => {
        const h = 5 + skirt[idx];
        c.beginPath();
        c.moveTo(ox, 24);
        c.lineTo(ox + 3, 24 + h);
        c.lineTo(ox + 6, 24);
        c.fill();
      });
      // Hollow Eyes
      c.fillStyle = '#141e3c';
      c.fillRect(9, 10, 3, 5);
      c.fillRect(17, 10, 3, 5);
      c.fillRect(14, 18, 2, 2);
    }));

    // Mystery Box / Crate
    const crate = createOffscreen(32, 32, (c) => {
      c.fillStyle = '#734b28';
      c.fillRect(0, 0, 32, 32);
      c.fillStyle = '#b47d46';
      c.fillRect(3, 3, 26, 26);
      c.strokeStyle = '#734b28';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(3, 16); c.lineTo(29, 16);
      c.moveTo(4, 4); c.lineTo(28, 28);
      c.moveTo(4, 28); c.lineTo(28, 4);
      c.stroke();
      // Metal Brackets
      [[0, 0], [26, 0], [0, 26], [26, 26]].forEach(([cx, cy]) => {
        c.fillStyle = '#4a406b';
        c.fillRect(cx, cy, 6, 6);
        c.fillStyle = '#ffd700';
        c.fillRect(cx + 2, cy + 2, 2, 2);
      });
      // '?' Mark
      c.fillStyle = '#ffd700';
      c.font = 'bold 15px sans-serif';
      c.fillText('?', 11, 21);
    });

    // Golden Key
    const key = createOffscreen(24, 24, (c) => {
      c.strokeStyle = '#ffd700';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(8, 8, 5, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#fff4a0';
      c.fillRect(12, 7, 9, 3);
      c.fillRect(17, 10, 2, 3);
      c.fillRect(19, 10, 2, 3);
    });

    // Exit Portal (Closed vs Unlocked)
    const portalClosed = createOffscreen(44, 60, (c) => {
      c.fillStyle = '#2c2642';
      c.fillRect(2, 2, 40, 56);
      c.fillStyle = '#4a406b';
      c.fillRect(6, 6, 32, 50);
      c.fillStyle = '#120e20';
      c.fillRect(10, 12, 24, 44);
      // Keyhole
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.arc(22, 30, 4, 0, Math.PI * 2);
      c.fill();
      c.fillRect(21, 30, 2, 7);
    });

    const portalOpen = createOffscreen(44, 60, (c) => {
      c.fillStyle = '#2c2642';
      c.fillRect(2, 2, 40, 56);
      c.fillStyle = '#4a406b';
      c.fillRect(6, 6, 32, 50);
      c.fillStyle = '#10b981';
      c.fillRect(10, 12, 24, 44);
      c.fillStyle = '#bbf7d0';
      c.fillRect(14, 16, 16, 36);
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.arc(22, 6, 3, 0, Math.PI * 2);
      c.fill();
    });

    // Level 3 Boss: Titan Skibidi Speaker
    const bossSkibidi = createOffscreen(80, 90, (c) => {
      // Basin
      c.fillStyle = '#e6edf5';
      c.beginPath();
      c.ellipse(40, 65, 30, 20, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#c8cfdc';
      c.fillRect(22, 75, 36, 15);
      // Head
      c.fillStyle = '#ebb487';
      c.beginPath();
      c.arc(40, 36, 18, 0, Math.PI * 2);
      c.fill();
      // Eyes & Grin
      c.fillStyle = '#ef4444';
      c.fillRect(32, 30, 4, 4);
      c.fillRect(44, 30, 4, 4);
      c.fillStyle = '#0a0a0f';
      c.fillRect(28, 40, 24, 8);
      c.fillStyle = '#ffffff';
      for (let tx = 30; tx < 50; tx += 4) {
        c.fillRect(tx, 40, 3, 3);
      }
      // Subwoofer Speakers on sides (Undertale cannons)
      c.fillStyle = '#282832';
      c.fillRect(2, 20, 18, 36);
      c.fillRect(60, 20, 18, 36);
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.arc(11, 44, 5, 0, Math.PI * 2);
      c.arc(69, 44, 5, 0, Math.PI * 2);
      c.fill();
    });

    // Level 6 Boss: Mewing Gigachad Sphinx
    const bossGigachad = createOffscreen(90, 100, (c) => {
      // Pharaoh Headdress
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.moveTo(15, 10); c.lineTo(75, 10);
      c.lineTo(85, 45); c.lineTo(5, 45);
      c.closePath();
      c.fill();
      c.strokeStyle = '#2846a0';
      c.lineWidth = 3;
      for (let sx = 20; sx < 75; sx += 10) {
        c.beginPath(); c.moveTo(sx, 10); c.lineTo(sx, 40); c.stroke();
      }
      // Chiseled Jawline Face
      c.fillStyle = '#d7a578';
      c.beginPath();
      c.moveTo(25, 30); c.lineTo(65, 30);
      c.lineTo(62, 70); c.lineTo(45, 96);
      c.lineTo(28, 70);
      c.closePath();
      c.fill();
      // Cheekbone shadows
      c.strokeStyle = '#a06e4b';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(28, 55); c.lineTo(42, 72); c.stroke();
      c.beginPath(); c.moveTo(62, 55); c.lineTo(48, 72); c.stroke();
      // Mewing Jawline
      c.strokeStyle = '#8c5f3c';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(32, 76); c.lineTo(45, 96); c.lineTo(58, 76); c.stroke();
      // Laser Eyes
      c.fillStyle = '#38bdf8';
      c.fillRect(30, 42, 10, 4);
      c.fillRect(50, 42, 10, 4);
      c.fillStyle = '#fff';
      c.fillRect(34, 43, 3, 2);
      c.fillRect(54, 43, 3, 2);
    });

    return {
      playerRun: playerRunFrames,
      playerJump: playerJump,
      playerSlam: playerSlam,
      spider: spiderFrames,
      ghost: ghostFrames,
      crate: crate,
      key: key,
      portalClosed: portalClosed,
      portalOpen: portalOpen,
      bossSkibidi: bossSkibidi,
      bossGigachad: bossGigachad
    };
  })();

  // --- Particle Systems ---
  class Particle {
    constructor(x, y, vx, vy, color, size, lifetime, gravity = 0.35) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.lifetime = lifetime;
      this.timer = 0;
      this.gravity = gravity;
    }

    update(dt) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.timer += dt;
    }

    isAlive() {
      return this.timer < this.lifetime;
    }

    draw(ctx, camX, camY) {
      const alpha = Math.max(0, 1 - this.timer / this.lifetime);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.fillRect(Math.floor(this.x - camX), Math.floor(this.y - camY), this.size, this.size);
      ctx.restore();
    }
  }

  class ShockwaveRing {
    constructor(x, y, maxRadius = SLAM_RADIUS) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = maxRadius;
      this.speed = 15;
      this.alive = true;
    }

    update() {
      this.radius += this.speed;
      if (this.radius >= this.maxRadius) {
        this.alive = false;
      }
    }

    draw(ctx, camX, camY) {
      if (!this.alive) return;
      const alpha = Math.max(0, 1 - this.radius / this.maxRadius);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x - camX, this.y - camY, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x - camX, this.y - camY, Math.max(1, this.radius - 6), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- Projectiles ---
  class Projectile {
    constructor(x, y, vx, vy, type = 'soundwave') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.type = type;
      this.radius = type === 'soundwave' ? 14 : 8;
      this.alive = true;
      this.timer = 0;
      this.bounces = 0;
    }

    update(dt, tiles) {
      this.timer += dt;
      this.x += this.vx;
      this.y += this.vy;

      if (this.type === 'bouncing_bomb') {
        this.vy += 0.38;
        // Bounce against tiles
        tiles.forEach(t => {
          if (this.x >= t.x && this.x <= t.x + t.w && this.y >= t.y && this.y <= t.y + t.h) {
            if (this.vy > 0) {
              this.vy = -Math.abs(this.vy) * 0.75;
              this.bounces++;
              if (this.bounces >= 3) this.alive = false;
            }
          }
        });
      }

      if (this.timer > 6.0) this.alive = false;
    }

    checkPlayerCollision(player) {
      if (!this.alive || player.isDead || player.invulnerableTimer > 0) return false;
      const dist = Math.hypot(player.x + 13 - this.x, player.y + 17 - this.y);
      if (dist < this.radius + 12) {
        player.takeDamage(1);
        this.alive = false;
        return true;
      }
      return false;
    }

    draw(ctx, camX, camY) {
      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);

      if (this.type === 'soundwave') {
        const r = 12 + Math.sin(this.timer * 12) * 4;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx, dy, Math.max(2, r - 4), 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.type === 'bouncing_bomb') {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(dx, dy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(dx, dy, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'laser_shard') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(dx - 10, dy);
        ctx.lineTo(dx + 10, dy);
        ctx.stroke();
      } else if (this.type === 'falling_rock') {
        ctx.fillStyle = '#a06e4b';
        ctx.fillRect(dx - 8, dy - 12, 16, 24);
        ctx.strokeStyle = '#ffd700';
        ctx.strokeRect(dx - 8, dy - 12, 16, 24);
      }
    }
  }

  // --- Boss Classes ---
  class Boss {
    constructor(x, y, w, h, maxHp, name, sprite) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.maxHp = maxHp;
      this.hp = maxHp;
      this.name = name;
      this.sprite = sprite;
      this.alive = true;
      this.invulnerableTimer = 0;
      this.projectiles = [];
      this.state = 'idle';
      this.stateTimer = 0;
      this.telegraph = false;
      this.baseX = x;
      this.particles = [];
    }

    takeDamage(amount) {
      if (this.invulnerableTimer > 0 || !this.alive) return;
      this.hp -= amount;
      this.invulnerableTimer = 0.5;
      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
        // Death burst
        for (let i = 0; i < 30; i++) {
          this.particles.push(new Particle(
            this.x + this.w / 2, this.y + this.h / 2,
            (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8,
            ['#ffd700', '#ef4444', '#38bdf8'][Math.floor(Math.random() * 3)],
            Math.floor(Math.random() * 6) + 4, 1.2
          ));
        }
      }
    }

    checkPlayerStomp(player) {
      if (!this.alive || player.isDead) return false;
      // Head stomp hitbox near top
      const headTop = this.y - 10;
      const headBottom = this.y + 18;
      const playerBottom = player.y + player.h;
      if (
        player.x + player.w > this.x + 8 &&
        player.x < this.x + this.w - 8 &&
        playerBottom >= headTop &&
        playerBottom <= headBottom &&
        player.vy > 0
      ) {
        this.takeDamage(2);
        player.vy = STOMP_BOUNCE;
        player.y = this.y - player.h;
        return true;
      }

      // Body collision
      if (
        player.x + player.w > this.x &&
        player.x < this.x + this.w &&
        player.y + player.h > this.y &&
        player.y < this.y + this.h &&
        player.invulnerableTimer <= 0
      ) {
        player.takeDamage(1);
      }
      return false;
    }
  }

  class SkibidiSpeakerBoss extends Boss {
    constructor(x, y) {
      super(x, y, 76, 86, 12, 'TITAN SKIBIDI SPEAKER', Sprites.bossSkibidi);
    }

    update(dt, tiles, player) {
      if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => p.isAlive());

      if (!this.alive) {
        this.projectiles = [];
        return;
      }

      this.stateTimer += dt;

      if (this.state === 'idle') {
        if (this.stateTimer >= 1.8) {
          this.stateTimer = 0;
          this.state = ['soundwaves', 'charge', 'bouncing'][Math.floor(Math.random() * 3)];
        }
      } else if (this.state === 'soundwaves') {
        // Undertale soundwaves rhythm
        if (Math.floor(this.stateTimer * 10) % 4 === 0 && this.stateTimer < 1.6) {
          const angle = player.x < this.x ? Math.PI * 0.85 : Math.PI * 0.15;
          const spread = (Math.random() - 0.5) * 0.6;
          this.projectiles.push(new Projectile(
            this.x + this.w / 2, this.y + this.h / 2,
            Math.cos(angle + spread) * 4.2, Math.sin(angle + spread) * 4.2,
            'soundwave'
          ));
        }
        if (this.stateTimer >= 2.4) {
          this.state = 'idle';
          this.stateTimer = 0;
        }
      } else if (this.state === 'charge') {
        // Cuphead telegraphed charge
        if (this.stateTimer < 0.7) {
          this.telegraph = true;
          this.x = this.baseX + (Math.random() - 0.5) * 6;
        } else if (this.stateTimer < 1.6) {
          this.telegraph = false;
          const dir = player.x < this.x ? -1 : 1;
          this.x += dir * 6.0;
        } else {
          this.state = 'idle';
          this.stateTimer = 0;
        }
      } else if (this.state === 'bouncing') {
        [-5, -7, -9].forEach(vy => {
          const vx = player.x < this.x ? -3.2 : 3.2;
          this.projectiles.push(new Projectile(
            this.x + this.w / 2, this.y + 20, vx, vy, 'bouncing_bomb'
          ));
        });
        this.state = 'idle';
        this.stateTimer = 0;
      }

      this.projectiles.forEach(p => {
        p.update(dt, tiles);
        p.checkPlayerCollision(player);
      });
      this.projectiles = this.projectiles.filter(p => p.alive);

      this.checkPlayerStomp(player);
    }

    draw(ctx, camX, camY) {
      this.particles.forEach(p => p.draw(ctx, camX, camY));
      this.projectiles.forEach(p => p.draw(ctx, camX, camY));
      if (!this.alive) return;

      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);

      if (this.telegraph) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(dx - 6, dy - 6, this.w + 12, this.h + 12);
      }

      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 15) % 2 === 0) return;
      ctx.drawImage(this.sprite, dx, dy);
    }
  }

  class GigachadSphinxBoss extends Boss {
    constructor(x, y) {
      super(x, y, 86, 96, 20, 'MEWING GIGACHAD SPHINX', Sprites.bossGigachad);
    }

    update(dt, tiles, player) {
      if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => p.isAlive());

      if (!this.alive) {
        this.projectiles = [];
        return;
      }

      this.stateTimer += dt;

      if (this.state === 'idle') {
        if (this.stateTimer >= 1.7) {
          this.stateTimer = 0;
          this.state = ['laser', 'pillars', 'bullet_hell'][Math.floor(Math.random() * 3)];
        }
      } else if (this.state === 'laser') {
        if (this.stateTimer < 0.6) {
          this.telegraph = true;
        } else if (this.stateTimer < 1.9) {
          this.telegraph = false;
          if (Math.floor(this.stateTimer * 20) % 3 === 0) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const spread = (Math.random() - 0.5) * 0.3;
            this.projectiles.push(new Projectile(
              this.x + this.w / 2, this.y + 40,
              Math.cos(angle + spread) * 6.2, Math.sin(angle + spread) * 6.2,
              'laser_shard'
            ));
          }
        } else {
          this.state = 'idle';
          this.stateTimer = 0;
        }
      } else if (this.state === 'pillars') {
        for (let i = 0; i < 4; i++) {
          const spawnX = player.x + (i - 1.5) * 90 + (Math.random() - 0.5) * 30;
          this.projectiles.push(new Projectile(spawnX, 40, 0, 4.5 + Math.random() * 2, 'falling_rock'));
        }
        this.state = 'idle';
        this.stateTimer = 0;
      } else if (this.state === 'bullet_hell') {
        const count = 12;
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2;
          this.projectiles.push(new Projectile(
            this.x + this.w / 2, this.y + this.h / 2,
            Math.cos(ang) * 3.8, Math.sin(ang) * 3.8,
            'soundwave'
          ));
        }
        this.state = 'idle';
        this.stateTimer = 0;
      }

      this.projectiles.forEach(p => {
        p.update(dt, tiles);
        p.checkPlayerCollision(player);
      });
      this.projectiles = this.projectiles.filter(p => p.alive);

      this.checkPlayerStomp(player);
    }

    draw(ctx, camX, camY) {
      this.particles.forEach(p => p.draw(ctx, camX, camY));
      this.projectiles.forEach(p => p.draw(ctx, camX, camY));
      if (!this.alive) return;

      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);

      if (this.telegraph) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(dx - 8, dy - 8, this.w + 16, this.h + 16);
      }

      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 15) % 2 === 0) return;
      ctx.drawImage(this.sprite, dx, dy);
    }
  }

  // --- Enemies ---
  class Spider {
    constructor(x, y, speed = 1.8) {
      this.x = x;
      this.y = y;
      this.w = 28;
      this.h = 20;
      this.speed = speed;
      this.direction = 1;
      this.alive = true;
      this.animTimer = 0;
      this.animFrame = 0;
      this.particles = [];
    }

    takeDamage() {
      if (!this.alive) return;
      this.alive = false;
      for (let i = 0; i < 12; i++) {
        this.particles.push(new Particle(
          this.x + this.w / 2, this.y + this.h / 2,
          (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
          '#6e192d', 3, 0.5
        ));
      }
    }

    update(dt, tiles, player) {
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => p.isAlive());
      if (!this.alive) return;

      this.x += this.speed * this.direction;

      // Check boundary or wall collision
      let bumped = false;
      const myRect = { x: this.x, y: this.y, w: this.w, h: this.h };
      tiles.forEach(t => {
        if (
          myRect.x < t.x + t.w &&
          myRect.x + myRect.w > t.x &&
          myRect.y < t.y + t.h &&
          myRect.y + myRect.h > t.y
        ) {
          bumped = true;
        }
      });

      // Check ground ahead
      const footX = this.direction > 0 ? this.x + this.w + 2 : this.x - 4;
      const footRect = { x: footX, y: this.y + this.h + 2, w: 4, h: 4 };
      const hasGround = tiles.some(t => (
        footRect.x < t.x + t.w &&
        footRect.x + footRect.w > t.x &&
        footRect.y < t.y + t.h &&
        footRect.y + footRect.h > t.y
      ));

      if (bumped || !hasGround) {
        this.direction *= -1;
        this.x += this.speed * this.direction * 2;
      }

      this.animTimer += dt;
      if (this.animTimer >= 0.15) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }

      // Stomp & Collision with Player
      if (player.isDead) return;
      const stompTop = this.y - 8;
      const stompBottom = this.y + 14;
      const pBottom = player.y + player.h;

      if (
        player.x + player.w > this.x + 2 &&
        player.x < this.x + this.w - 2 &&
        pBottom >= stompTop &&
        pBottom <= stompBottom &&
        player.vy > 0
      ) {
        // Player stomped on head!
        this.takeDamage();
        player.vy = STOMP_BOUNCE;
        player.y = this.y - player.h;
      } else if (
        player.x + player.w > this.x &&
        player.x < this.x + this.w &&
        player.y + player.h > this.y &&
        player.y < this.y + this.h &&
        player.invulnerableTimer <= 0
      ) {
        player.takeDamage(1);
      }
    }

    draw(ctx, camX, camY) {
      this.particles.forEach(p => p.draw(ctx, camX, camY));
      if (!this.alive) return;

      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);
      const surf = Sprites.spider[this.animFrame];

      ctx.save();
      if (this.direction < 0) {
        ctx.translate(dx + this.w, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(surf, 0, 0);
      } else {
        ctx.drawImage(surf, dx, dy);
      }
      ctx.restore();
    }
  }

  class Ghost {
    constructor(x, y, speed = 1.3) {
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.w = 26;
      this.h = 28;
      this.speed = speed;
      this.alive = true;
      this.floatTimer = Math.random() * 6.28;
      this.animTimer = 0;
      this.animFrame = 0;
      this.particles = [];
    }

    takeDamage() {
      if (!this.alive) return;
      this.alive = false;
      for (let i = 0; i < 15; i++) {
        this.particles.push(new Particle(
          this.x + this.w / 2, this.y + this.h / 2,
          (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
          '#bdf0ff', 4, 0.6
        ));
      }
    }

    update(dt, tiles, player) {
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => p.isAlive());
      if (!this.alive) return;

      this.floatTimer += dt * 3.0;
      this.y = this.baseY + Math.sin(this.floatTimer) * 8;

      if (player.x > this.x + 4) this.x += this.speed;
      else if (player.x < this.x - 4) this.x -= this.speed;

      this.animTimer += dt;
      if (this.animTimer >= 0.14) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 3;
      }

      // Check Player Head Stomp
      if (player.isDead) return;
      const stompTop = this.y - 8;
      const stompBottom = this.y + 14;
      const pBottom = player.y + player.h;

      if (
        player.x + player.w > this.x + 2 &&
        player.x < this.x + this.w - 2 &&
        pBottom >= stompTop &&
        pBottom <= stompBottom &&
        player.vy > 0
      ) {
        this.takeDamage();
        player.vy = STOMP_BOUNCE;
        player.y = this.y - player.h;
      } else if (
        player.x + player.w > this.x &&
        player.x < this.x + this.w &&
        player.y + player.h > this.y &&
        player.y < this.y + this.h &&
        player.invulnerableTimer <= 0
      ) {
        player.takeDamage(1);
      }
    }

    draw(ctx, camX, camY) {
      this.particles.forEach(p => p.draw(ctx, camX, camY));
      if (!this.alive) return;
      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);
      ctx.drawImage(Sprites.ghost[this.animFrame], dx, dy);
    }
  }

  // --- Crate, Key & Portal ---
  class Crate {
    constructor(x, y, hasKey = false) {
      this.x = x;
      this.y = y;
      this.w = 32;
      this.h = 32;
      this.hasKey = hasKey;
      this.broken = false;
      this.particles = [];
    }

    breakCrate(player) {
      if (this.broken) return null;
      this.broken = true;
      for (let i = 0; i < 16; i++) {
        this.particles.push(new Particle(
          this.x + 16, this.y + 16,
          (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8,
          ['#b47d46', '#734b28', '#ffd700'][Math.floor(Math.random() * 3)],
          Math.floor(Math.random() * 4) + 3, 0.6
        ));
      }
      if (this.hasKey) {
        return new GoldenKey(this.x + 8, this.y - 6);
      }
      return null;
    }

    update(dt, player) {
      this.particles.forEach(p => p.update(dt));
      this.particles = this.particles.filter(p => p.isAlive());

      if (!this.broken) {
        const horizOverlap = (player.x + player.w > this.x - 4) && (player.x < this.x + this.w + 4);

        // 1. Player stomps onto top of crate while falling
        if (
          horizOverlap &&
          player.y + player.h >= this.y - 6 &&
          player.y + player.h <= this.y + 26 &&
          player.vy > 0
        ) {
          player.vy = -9.5;
          return this.breakCrate(player);
        }

        // 2. Player hits / headbutts crate from underneath while jumping
        if (
          horizOverlap &&
          player.y <= this.y + this.h + 2 &&
          player.y >= this.y + this.h - 18 &&
          player.vy < 0
        ) {
          player.vy = 2.0;
          return this.breakCrate(player);
        }
      }
      return null;
    }

    draw(ctx, camX, camY) {
      this.particles.forEach(p => p.draw(ctx, camX, camY));
      if (!this.broken) {
        ctx.drawImage(Sprites.crate, Math.floor(this.x - camX), Math.floor(this.y - camY));
      }
    }
  }

  class GoldenKey {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.w = 24;
      this.h = 24;
      this.collected = false;
      this.timer = 0;
    }

    update(dt, player) {
      if (this.collected) return;
      this.timer += dt * 4;
      this.y = this.baseY + Math.sin(this.timer) * 6;

      if (
        player.x + player.w > this.x &&
        player.x < this.x + this.w &&
        player.y + player.h > this.y &&
        player.y < this.y + this.h
      ) {
        this.collected = true;
        player.hasKey = true;
        gateNotificationTimer = 4.0;
        gateNotificationText = '🗝️ THE TEMPLE GATE IS OPEN! ESCAPE THROUGH THE PORTAL!';
      }
    }

    draw(ctx, camX, camY) {
      if (this.collected) return;
      const dx = Math.floor(this.x - camX);
      const dy = Math.floor(this.y - camY);

      // Gold halo glow
      ctx.save();
      ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(dx + 12, dy + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(Sprites.key, dx, dy);
      ctx.restore();
    }
  }

  // --- Player ---
  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 26;
      this.h = 34;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.facingRight = true;

      this.hp = INITIAL_HEALTH;
      this.maxHp = MAX_HEALTH;
      this.invulnerableTimer = 0;
      this.isDead = false;
      this.hasKey = false;

      this.slamCooldown = 0; // counts down to 0
      this.slamActiveTimer = 0;
      this.attackTimer = 0;
      this.shockwaves = [];

      this.animTimer = 0;
      this.animFrame = 0;
    }

    triggerSlam(enemies, crates, bosses) {
      if (this.slamCooldown > 0 || this.isDead) return false;
      this.slamCooldown = SLAM_COOLDOWN;
      this.slamActiveTimer = 0.35;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h - 4;

      this.shockwaves.push(new ShockwaveRing(cx, cy, SLAM_RADIUS));
      this.shockwaves.push(new ShockwaveRing(cx, cy, SLAM_RADIUS * 0.7));

      // Destroy all minions in radius
      enemies.forEach(e => {
        if (e.alive) {
          const dist = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy);
          if (dist <= SLAM_RADIUS) e.takeDamage();
        }
      });

      // Break nearby crates
      crates.forEach(c => {
        if (!c.broken) {
          const dist = Math.hypot(c.x + 16 - cx, c.y + 16 - cy);
          if (dist <= SLAM_RADIUS) {
            const keyDrop = c.breakCrate(this);
            if (keyDrop) currentLevel.keys.push(keyDrop);
          }
        }
      });

      // Heavy damage to bosses
      bosses.forEach(b => {
        if (b.alive) {
          const dist = Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy);
          if (dist <= SLAM_RADIUS + 30) b.takeDamage(6);
        }
      });

      return true;
    }

    attackStick(crates, enemies) {
      if (this.attackTimer > 0) return;
      this.attackTimer = 0.2;
      const hitRect = {
        x: this.facingRight ? this.x + this.w - 4 : this.x - 36,
        y: this.y + 4,
        w: 40,
        h: 36
      };

      crates.forEach(c => {
        if (!c.broken && (
          hitRect.x < c.x + c.w &&
          hitRect.x + hitRect.w > c.x &&
          hitRect.y < c.y + c.h &&
          hitRect.y + hitRect.h > c.y
        )) {
          const keyDrop = c.breakCrate(this);
          if (keyDrop) currentLevel.keys.push(keyDrop);
        }
      });

      enemies.forEach(e => {
        if (e.alive && (
          hitRect.x < e.x + e.w &&
          hitRect.x + hitRect.w > e.x &&
          hitRect.y < e.y + e.h &&
          hitRect.y + hitRect.h > e.y
        )) {
          e.takeDamage();
        }
      });
    }

    takeDamage(amount = 1) {
      if (this.invulnerableTimer > 0 || this.isDead) return false;
      this.hp -= amount;
      this.invulnerableTimer = INVULNERABILITY_DURATION;
      this.vy = -6.0;
      this.vx = this.facingRight ? -4.0 : 4.0;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
      }
      return true;
    }

    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    update(dt, tiles) {
      if (this.slamCooldown > 0) this.slamCooldown = Math.max(0, this.slamCooldown - dt);
      if (this.slamActiveTimer > 0) this.slamActiveTimer = Math.max(0, this.slamActiveTimer - dt);
      if (this.attackTimer > 0) this.attackTimer = Math.max(0, this.attackTimer - dt);
      if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

      this.shockwaves.forEach(sw => sw.update());
      this.shockwaves = this.shockwaves.filter(sw => sw.alive);

      // Physics
      this.vy += GRAVITY;
      if (this.vy > 12) this.vy = 12;

      // Horizontal Collision
      this.x += this.vx;
      tiles.forEach(t => {
        if (
          this.x < t.x + t.w &&
          this.x + this.w > t.x &&
          this.y < t.y + t.h &&
          this.y + this.h > t.y
        ) {
          if (this.vx > 0) this.x = t.x - this.w;
          else if (this.vx < 0) this.x = t.x + t.w;
        }
      });

      // Vertical Collision
      this.y += this.vy;
      this.onGround = false;
      tiles.forEach(t => {
        if (
          this.x < t.x + t.w &&
          this.x + this.w > t.x &&
          this.y < t.y + t.h &&
          this.y + this.h > t.y
        ) {
          if (this.vy > 0) {
            this.y = t.y - this.h;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = t.y + t.h;
            this.vy = 0;
          }
        }
      });

      // Animation
      if (Math.abs(this.vx) > 0.1 && this.onGround) {
        this.animTimer += dt;
        if (this.animTimer >= 0.12) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % Sprites.playerRun.length;
        }
      } else {
        this.animFrame = 0;
      }
    }

    draw(ctx, camX, camY) {
      this.shockwaves.forEach(sw => sw.draw(ctx, camX, camY));

      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 15) % 2 === 0) return;

      const dx = Math.floor(this.x - camX - 3);
      const dy = Math.floor(this.y - camY - 2);

      let surf = Sprites.playerRun[this.animFrame];
      if (this.slamActiveTimer > 0) surf = Sprites.playerSlam;
      else if (!this.onGround) surf = Sprites.playerJump;

      ctx.save();
      if (!this.facingRight) {
        ctx.translate(dx + 32, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(surf, 0, 0);
      } else {
        ctx.drawImage(surf, dx, dy);
      }
      ctx.restore();
    }
  }

  // --- Level Builder ---
  class Level {
    constructor(levelNum) {
      this.levelNum = levelNum;
      this.width = levelNum % 3 === 0 ? 1200 : 1600;
      this.height = CANVAS_HEIGHT;
      this.tiles = [];
      this.crates = [];
      this.enemies = [];
      this.bosses = [];
      this.keys = [];
      this.portal = { x: this.width - 110, y: 420, w: 44, h: 60 };
      this.playerStart = { x: 64, y: 400 };
      this.isBossLevel = (levelNum % 3 === 0);

      this.build();
    }

    build() {
      // Solid Ground
      for (let x = 0; x < this.width; x += TILE_SIZE) {
        this.tiles.push({ x: x, y: 480, w: TILE_SIZE, h: 60, type: 'ground' });
      }
      // Left and Right Walls
      for (let y = 0; y < 540; y += TILE_SIZE) {
        this.tiles.push({ x: 0, y: y, w: TILE_SIZE, h: TILE_SIZE, type: 'ground' });
        this.tiles.push({ x: this.width - TILE_SIZE, y: y, w: TILE_SIZE, h: TILE_SIZE, type: 'ground' });
      }

      if (this.isBossLevel) {
        // Boss Arena Layout - platforms placed high above floor for ample crate and dodge headroom
        this.tiles.push({ x: 180, y: 340, w: 160, h: 20, type: 'platform' });
        this.tiles.push({ x: 440, y: 240, w: 180, h: 20, type: 'platform' });
        this.tiles.push({ x: 720, y: 340, w: 160, h: 20, type: 'platform' });

        this.crates.push(new Crate(220, 308, true));
        this.crates.push(new Crate(760, 308, false));

        if (this.levelNum === 3) {
          this.bosses.push(new SkibidiSpeakerBoss(880, 394));
        } else {
          this.bosses.push(new GigachadSphinxBoss(880, 384));
        }
      } else {
        // Standard Temple Level with platforms higher than ground for easy crate smashing
        const numPlats = 5 + this.levelNum;
        let prevX = 180;
        for (let i = 0; i < numPlats; i++) {
          const platW = Math.floor(Math.random() * 80) + 120;
          // Platform heights: 340 (140px from floor 480 - allows 88px headroom above ground crates) and 260
          const platY = [340, 260, 340, 260][Math.floor(Math.random() * 4)];
          const platX = prevX + Math.floor(Math.random() * 60) + 70;
          if (platX + platW >= this.width - 140) break;

          this.tiles.push({ x: platX, y: platY, w: platW, h: 20, type: 'platform' });
          prevX = platX + platW;

          if (Math.random() < 0.65) {
            this.crates.push(new Crate(platX + platW / 2 - 16, platY - 32, false));
          }

          if (Math.random() < 0.7) {
            this.enemies.push(new Spider(platX + 10, platY - 20, 1.6 + this.levelNum * 0.25));
          }
        }

        // Ground crates & enemies
        [320, 680, 1080, 1380].forEach(gx => {
          if (Math.random() < 0.65) this.crates.push(new Crate(gx, 448, false));
        });

        [420, 840, 1220].forEach(sx => {
          this.enemies.push(new Spider(sx, 460, 1.8 + this.levelNum * 0.2));
        });

        // Ghosts: fly just slightly higher than the spiders/roaches (y=460) so Tung Tung can jump on their heads!
        const ghostCount = 1 + Math.floor(this.levelNum / 2);
        for (let g = 0; g < ghostCount; g++) {
          const gx = Math.floor(Math.random() * (this.width - 600)) + 350;
          const gy = Math.floor(Math.random() * 20) + 405; // flies at 405-425, jumpable from ground!
          this.enemies.push(new Ghost(gx, gy, 1.2 + this.levelNum * 0.15));
        }

        while (this.crates.length < 3) {
          const rx = Math.floor(Math.random() * (this.width - 500)) + 200;
          this.crates.push(new Crate(rx, 448, false));
        }

        // Guarantee one crate contains the Golden Key
        const lucky = this.crates[Math.floor(Math.random() * this.crates.length)];
        lucky.hasKey = true;
      }
    }

    update(dt, player) {
      this.crates.forEach(c => {
        const keyDrop = c.update(dt, player);
        if (keyDrop) this.keys.push(keyDrop);
      });

      this.keys.forEach(k => k.update(dt, player));
      this.keys = this.keys.filter(k => !k.collected);

      this.enemies.forEach(e => e.update(dt, this.tiles, player));
      this.enemies = this.enemies.filter(e => e.alive || e.particles.length > 0);

      this.bosses.forEach(b => {
        b.update(dt, this.tiles, player);
        if (!b.alive && !player.hasKey && this.keys.length === 0) {
          this.keys.push(new GoldenKey(b.x + b.w / 2, b.y + b.h / 2));
        }
      });

      // Check level complete
      if (
        player.hasKey &&
        player.x + player.w > this.portal.x &&
        player.x < this.portal.x + this.portal.w &&
        player.y + player.h > this.portal.y &&
        player.y < this.portal.y + this.portal.h
      ) {
        return 'LEVEL_COMPLETE';
      }

      return null;
    }

    draw(ctx, camX, camY, player) {
      // Tiles
      this.tiles.forEach(t => {
        const dx = Math.floor(t.x - camX);
        const dy = Math.floor(t.y - camY);
        if (dx + t.w < 0 || dx > CANVAS_WIDTH) return;

        if (t.type === 'platform') {
          ctx.fillStyle = '#2c2642';
          ctx.fillRect(dx, dy, t.w, t.h);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(dx + 2, dy + 2, t.w - 4, 2);
        } else {
          ctx.fillStyle = '#1a162b';
          ctx.fillRect(dx, dy, t.w, t.h);
          ctx.fillStyle = '#2c2642';
          ctx.fillRect(dx + 1, dy + 1, t.w - 2, t.h - 2);
          ctx.strokeStyle = '#4a406b';
          ctx.strokeRect(dx + 1, dy + 1, t.w - 2, t.h - 2);
        }
      });

      // Portal
      const portalSurf = player.hasKey ? Sprites.portalOpen : Sprites.portalClosed;
      ctx.drawImage(portalSurf, Math.floor(this.portal.x - camX), Math.floor(this.portal.y - camY));

      this.crates.forEach(c => c.draw(ctx, camX, camY));
      this.keys.forEach(k => k.draw(ctx, camX, camY));
      this.enemies.forEach(e => e.draw(ctx, camX, camY));
      this.bosses.forEach(b => b.draw(ctx, camX, camY));
    }
  }

  // --- Game State Variables ---
  let gameState = 'MENU';
  let currentLevelNum = 1;
  let currentLevel = null;
  let player = null;
  let runStartTime = 0;
  let elapsedTime = 0;
  let isTimerRunning = false;
  let cameraX = 0;
  let bannerText = '';
  let bannerSub = '';
  let bannerTimer = 0;
  let gateNotificationTimer = 0;
  let gateNotificationText = '';
  const keysDown = {};

  // --- State Switching ---
  function showScreen(name) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.toggle('active', key === name);
    });
    updateTouchControlsVisibility();
  }

  function updateTouchControlsVisibility() {
    if (touchControls) {
      const shouldShow = touchControlsEnabled && gameState === 'PLAYING';
      touchControls.classList.toggle('active', shouldShow);
    }
    if (touchControlsEnabled) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.remove('touch-device');
    }
    if (touchButtons.toggle) {
      touchButtons.toggle.textContent = touchControlsEnabled ? '📱 TOUCH: ON' : '📱 TOUCH: OFF';
    }
  }

  function startNewGame() {
    currentLevelNum = 1;
    currentLevel = new Level(currentLevelNum);
    player = new Player(currentLevel.playerStart.x, currentLevel.playerStart.y);
    runStartTime = performance.now();
    elapsedTime = 0;
    isTimerRunning = true;
    gameState = 'PLAYING';
    showScreen(null); // Canvas is visible
  }

  function advanceLevel() {
    // User Rule: After every 3 levels, gain back 3 health!
    let gainedHp = false;
    if (currentLevelNum % HEAL_AFTER_LEVELS === 0) {
      player.heal(HEAL_AMOUNT);
      gainedHp = true;
    }

    if (currentLevelNum >= TOTAL_LEVELS) {
      gameState = 'VICTORY';
      isTimerRunning = false;
      victoryTimeSpan.textContent = formatTime(elapsedTime);
      showScreen('victory');
      return;
    }

    currentLevelNum++;
    currentLevel = new Level(currentLevelNum);
    player.x = currentLevel.playerStart.x;
    player.y = currentLevel.playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.hasKey = false;

    if (gainedHp) {
      bannerText = '★ BOSS DEFEATED! GAINED +3 HEALTH! ★';
      bannerSub = `Entering Level ${currentLevelNum}...`;
    } else {
      bannerText = `LEVEL ${currentLevelNum}`;
      bannerSub = 'Find the Golden Key to Escape!';
    }
    bannerTimer = 2.4;
  }

  // --- Leaderboard Storage ---
  function getLeaderboard() {
    const defaultRecords = [
      { name: 'SahurChampion', time: 134.52, levels: 6, date: '2026-10-15' },
      { name: 'StickMaster', time: 182.10, levels: 6, date: '2026-10-16' },
      { name: 'KentonganBoy', time: 225.80, levels: 6, date: '2026-10-17' },
      { name: 'TempleRunner', time: 290.45, levels: 5, date: '2026-10-17' },
      { name: 'NoobSahur', time: 380.00, levels: 3, date: '2026-10-17' }
    ];
    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(defaultRecords));
        return defaultRecords;
      }
      return JSON.parse(stored);
    } catch (e) {
      return defaultRecords;
    }
  }

  function saveRecord(name, timeSec, levels) {
    const records = getLeaderboard();
    const today = new Date().toISOString().split('T')[0];
    records.push({
      name: name.trim() || 'SahurHero',
      time: Math.round(timeSec * 100) / 100,
      levels: levels,
      date: today
    });
    records.sort((a, b) => b.levels - a.levels || a.time - b.time);
    const top10 = records.slice(0, 10);
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(top10));
    } catch (e) {}
    renderLeaderboard();
  }

  function renderLeaderboard() {
    const records = getLeaderboard();
    leaderboardBody.innerHTML = '';
    records.forEach((rec, idx) => {
      const tr = document.createElement('tr');
      const rankBadge = idx === 0 ? '🥇 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `#${idx + 1}`));
      tr.innerHTML = `
        <td style="color:${idx === 0 ? '#ffd700' : '#e2e8f0'}">${rankBadge}</td>
        <td><strong>${rec.name}</strong></td>
        <td style="color:#10b981">Level ${rec.levels}</td>
        <td style="color:#ffd700">${formatTime(rec.time)}</td>
        <td style="color:#94a3b8">${rec.date}</td>
      `;
      leaderboardBody.appendChild(tr);
    });
  }

  // --- Input Handling ---
  window.addEventListener('keydown', (e) => {
    keysDown[e.code] = true;

    if (gameState === 'PLAYING') {
      if (e.code === 'KeyF' || e.code === 'KeyJ') {
        player.triggerSlam(currentLevel.enemies, currentLevel.crates, currentLevel.bosses);
      } else if (e.code === 'KeyE' || e.code === 'KeyK') {
        player.attackStick(currentLevel.crates, currentLevel.enemies);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        gameState = 'MENU';
        isTimerRunning = false;
        showScreen('mainMenu');
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keysDown[e.code] = false;
  });

  // --- Button Listeners ---
  buttons.play.addEventListener('click', () => {
    startNewGame();
  });

  buttons.howTo.addEventListener('click', () => {
    showScreen('howTo');
  });

  buttons.leaderboard.addEventListener('click', () => {
    renderLeaderboard();
    showScreen('leaderboard');
  });

  buttons.backFromHowTo.addEventListener('click', () => {
    showScreen('mainMenu');
  });

  buttons.backFromLeaderboard.addEventListener('click', () => {
    showScreen('mainMenu');
  });

  buttons.clearLeaderboard.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset leaderboard records?')) {
      localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
      renderLeaderboard();
    }
  });

  buttons.retry.addEventListener('click', () => {
    startNewGame();
  });

  buttons.menuFromGameOver.addEventListener('click', () => {
    gameState = 'MENU';
    showScreen('mainMenu');
  });

  buttons.saveScore.addEventListener('click', () => {
    saveRecord(playerNameInput.value, elapsedTime, currentLevelNum);
    showScreen('leaderboard');
  });

  // Helper to detect Mobile & iPad vs Desktop PC
  function isMobileOrTabletDevice() {
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isDesktopMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Explicitly detect PC with mouse/trackpad: Remove touch controls
    if (isDesktopMouse && !isMobileUA && !isIPad) {
      return false;
    }

    return isMobileUA || isIPad || isCoarsePointer;
  }

  // --- Mobile & iPad Touch Controls Binding ---
  function setupTouchControls() {
    // Only enabled on Mobile & iPad. On PC, completely removed!
    touchControlsEnabled = isMobileOrTabletDevice();
    updateTouchControlsVisibility();

    // If on a hybrid touch PC/laptop and screen is touched, can dynamically enable
    window.addEventListener('touchstart', () => {
      if (!touchControlsEnabled) {
        touchControlsEnabled = true;
        updateTouchControlsVisibility();
      }
    }, { passive: true, once: true });

    if (touchButtons.toggle) {
      touchButtons.toggle.addEventListener('click', (e) => {
        e.preventDefault();
        touchControlsEnabled = !touchControlsEnabled;
        updateTouchControlsVisibility();
      });
    }

    function bindTouchBtn(btn, onDown, onUp) {
      if (!btn) return;
      const handleDown = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (btn.setPointerCapture && e.pointerId !== undefined) {
          try { btn.setPointerCapture(e.pointerId); } catch (err) {}
        }
        if (navigator.vibrate) {
          try { navigator.vibrate(10); } catch (err) {}
        }
        if (onDown) onDown(e);
      };

      const handleUp = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (btn.releasePointerCapture && e.pointerId !== undefined) {
          try { btn.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        if (onUp) onUp(e);
      };

      btn.addEventListener('pointerdown', handleDown);
      btn.addEventListener('pointerup', handleUp);
      btn.addEventListener('pointercancel', handleUp);
      btn.addEventListener('pointerleave', (e) => {
        if (!btn.hasPointerCapture || !btn.hasPointerCapture(e.pointerId)) {
          handleUp(e);
        }
      });
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // 1. Movement on Left (Left & Right Buttons)
    bindTouchBtn(touchButtons.left,
      () => {
        keysDown['ArrowLeft'] = true;
        keysDown['KeyA'] = true;
      },
      () => {
        keysDown['ArrowLeft'] = false;
        keysDown['KeyA'] = false;
      }
    );

    bindTouchBtn(touchButtons.right,
      () => {
        keysDown['ArrowRight'] = true;
        keysDown['KeyD'] = true;
      },
      () => {
        keysDown['ArrowRight'] = false;
        keysDown['KeyD'] = false;
      }
    );

    // 2. Jump Button on the Right
    bindTouchBtn(touchButtons.jump,
      () => {
        keysDown['Space'] = true;
        if (gameState === 'PLAYING' && player && player.onGround) {
          player.vy = PLAYER_JUMP_POWER;
          player.onGround = false;
        }
      },
      () => {
        keysDown['Space'] = false;
      }
    );

    // 3. Ability Button: Above the jump button and slightly on the left of the jump button
    bindTouchBtn(touchButtons.ability,
      () => {
        if (gameState === 'PLAYING' && player && currentLevel) {
          player.triggerSlam(currentLevel.enemies, currentLevel.crates, currentLevel.bosses);
        }
      },
      null
    );

    // 4. Hit Button: Swing Stick to break mystery crates and strike monsters
    bindTouchBtn(touchButtons.hit,
      () => {
        if (gameState === 'PLAYING' && player && currentLevel) {
          player.attackStick(currentLevel.crates, currentLevel.enemies);
        }
      },
      null
    );
  }

  // --- Render HUD on Canvas ---
  function drawHUD() {
    // HUD Top Bar
    ctx.fillStyle = 'rgba(16, 14, 24, 0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 48);
    ctx.strokeStyle = '#4a406b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(CANVAS_WIDTH, 48);
    ctx.stroke();

    // 1. Health Hearts
    let hx = 18;
    for (let i = 0; i < player.maxHp; i++) {
      const col = i < player.hp ? '#ef4444' : '#382f48';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(hx + 6, 20, 5, 0, Math.PI * 2);
      ctx.arc(hx + 14, 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + 1, 22);
      ctx.lineTo(hx + 19, 22);
      ctx.lineTo(hx + 10, 32);
      ctx.fill();
      hx += 24;
    }

    // 2. Level Badge
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    const isBoss = currentLevelNum % 3 === 0;
    ctx.fillStyle = isBoss ? '#ffd700' : '#ffffff';
    ctx.fillText(isBoss ? `★ BOSS LVL ${currentLevelNum} ★` : `LEVEL ${currentLevelNum}`, 160, 28);

    // 3. Key Status
    if (player.hasKey) {
      ctx.drawImage(Sprites.key, 350, 12);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('KEY UNLOCKED!', 380, 28);
    } else {
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('KEY: SMASH CRATES', 350, 28);
    }

    // 4. Ground Slam Cooldown Gauge (10s)
    const pct = player.slamCooldown <= 0 ? 1.0 : (1.0 - player.slamCooldown / SLAM_COOLDOWN);
    const slamX = 580;
    const slamY = 12;
    const slamW = 160;
    const slamH = 24;

    ctx.fillStyle = '#1a162b';
    ctx.fillRect(slamX, slamY, slamW, slamH);
    ctx.fillStyle = pct >= 1.0 ? '#ffd700' : '#4a406b';
    ctx.fillRect(slamX, slamY, Math.floor(slamW * pct), slamH);
    ctx.strokeStyle = pct >= 1.0 ? '#ffd700' : '#4a406b';
    ctx.lineWidth = 2;
    ctx.strokeRect(slamX, slamY, slamW, slamH);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = pct >= 1.0 ? '#000000' : '#ffffff';
    const slamText = pct >= 1.0 ? 'SLAM READY [F]!' : `SLAM: ${player.slamCooldown.toFixed(1)}s`;
    ctx.fillText(slamText, slamX + 10, slamY + 16);

    // 5. Speedrun Stopwatch
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`⏱ ${formatTime(elapsedTime)}`, 770, 28);

    // Boss HP Bar (if active boss present)
    const activeBoss = currentLevel.bosses.find(b => b.alive);
    if (activeBoss) {
      const bBarW = 380;
      const bx = CANVAS_WIDTH / 2 - bBarW / 2;
      const by = 56;
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(activeBoss.name, bx, by + 12);

      ctx.fillStyle = '#120e20';
      ctx.fillRect(bx, by + 18, bBarW, 14);
      const ratio = Math.max(0, activeBoss.hp / activeBoss.maxHp);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx, by + 18, Math.floor(bBarW * ratio), 14);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by + 18, bBarW, 14);
    }
  }

  // --- Main Game Loop ---
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (isTimerRunning && gameState === 'PLAYING') {
      elapsedTime = (performance.now() - runStartTime) / 1000;
    }

    if (gameState === 'PLAYING' && player && currentLevel) {
      // Horizontal Input
      let moveX = 0;
      if (keysDown['KeyA'] || keysDown['ArrowLeft']) {
        moveX -= 1;
        player.facingRight = false;
      }
      if (keysDown['KeyD'] || keysDown['ArrowRight']) {
        moveX += 1;
        player.facingRight = true;
      }
      player.vx = moveX * PLAYER_SPEED;

      // Jump Input
      if ((keysDown['Space'] || keysDown['KeyW'] || keysDown['ArrowUp']) && player.onGround) {
        player.vy = PLAYER_JUMP_POWER;
        player.onGround = false;
      }

      // Update Player & Level
      player.update(dt, currentLevel.tiles);
      const levelResult = currentLevel.update(dt, player);

      if (levelResult === 'LEVEL_COMPLETE') {
        advanceLevel();
      }

      if (player.isDead) {
        isTimerRunning = false;
        gameState = 'GAME_OVER';
        gameOverSummary.textContent = `Fell at Level ${currentLevelNum} • Time: ${formatTime(elapsedTime)}`;
        showScreen('gameOver');
      }

      // Smooth Camera Tracking
      const targetCamX = Math.max(0, Math.min(player.x - CANVAS_WIDTH / 2, currentLevel.width - CANVAS_WIDTH));
      cameraX += (targetCamX - cameraX) * 0.12;

      if (bannerTimer > 0) bannerTimer = Math.max(0, bannerTimer - dt);
      if (gateNotificationTimer > 0) gateNotificationTimer = Math.max(0, gateNotificationTimer - dt);

      // Render Active Game
      ctx.fillStyle = '#0d0b18';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background Stone Pattern
      ctx.strokeStyle = 'rgba(74, 64, 107, 0.2)';
      ctx.lineWidth = 1;
      for (let bx = 0; bx < CANVAS_WIDTH; bx += 64) {
        for (let by = 0; by < CANVAS_HEIGHT; by += 48) {
          ctx.strokeRect(bx + 2, by + 2, 60, 44);
        }
      }

      currentLevel.draw(ctx, cameraX, 0, player);
      player.draw(ctx, cameraX, 0);
      drawHUD();

      // Gate Opened Alert Notification
      if (gateNotificationTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 310, 56, 620, 38);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 310, 56, 620, 38);

        ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(gateNotificationText, CANVAS_WIDTH / 2, 80);
        ctx.restore();
      }

      // Transition Announcement Banner
      if (bannerTimer > 0) {
        ctx.fillStyle = 'rgba(16, 14, 24, 0.88)';
        ctx.fillRect(0, 200, CANVAS_WIDTH, 80);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 200); ctx.lineTo(CANVAS_WIDTH, 200);
        ctx.moveTo(0, 280); ctx.lineTo(CANVAS_WIDTH, 280);
        ctx.stroke();

        ctx.font = 'bold 18px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(bannerText, CANVAS_WIDTH / 2, 235);

        ctx.font = '12px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(bannerSub, CANVAS_WIDTH / 2, 265);
        ctx.textAlign = 'left';
      }

      // Update On-Screen Virtual Ability Button Cooldown Visuals
      if (player && touchButtons.ability && touchAbilityCdText && abilityCdOverlay) {
        if (player.slamCooldown <= 0) {
          touchButtons.ability.classList.add('ready');
          touchButtons.ability.classList.remove('cooling-down');
          touchAbilityCdText.textContent = 'READY';
          abilityCdOverlay.style.height = '0%';
        } else {
          touchButtons.ability.classList.remove('ready');
          touchButtons.ability.classList.add('cooling-down');
          touchAbilityCdText.textContent = `${player.slamCooldown.toFixed(1)}s`;
          const cdRatio = Math.min(1, Math.max(0, player.slamCooldown / SLAM_COOLDOWN));
          abilityCdOverlay.style.height = `${(cdRatio * 100).toFixed(1)}%`;
        }
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // --- Initial Setup ---
  setupTouchControls();
  renderLeaderboard();
  showScreen('mainMenu');
  requestAnimationFrame(gameLoop);

})();
