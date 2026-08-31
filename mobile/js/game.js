(function () {
  "use strict";

  const MAX_LIVES = 5;
  const BASE_POINTS_PER_KILL = 128;
  const SPAWN_INTERVAL_MS = 500;
  const COUNT_THRESHOLD = 100;
  const MIN_SPAWN_INTERVAL_MS = 70;
  const MAX_ENEMY_CAP = 220;
  const DIFFICULTY_RAMP_SECONDS = 90;
  const PLAYER_SPEED = 5;
  const FIRE_COOLDOWN_FRAMES = 6;
  const ZERO_CHASE_SPEED = 3;
  const ZERO_ORBIT_SPEED = 4;
  const ONE_CHASE_SPEED = 3.6;
  const DEATH_SLOWMO = 0.55;
  const DEATH_COLLAPSE_MS = 470;
  const DEATH_EXPLODE_EXPAND = 3600;
  const WAVE_BULLET_SPEED = 11;
  const CGOL_WIDTH = 100;
  const CGOL_HEIGHT = 75;

  const COLORS = {
    player: "#40e0d0",
    zero: "#7cfc00",
    one: "#00ff7f",
    bullet: "#ffffff",
    particle: "#adff2f",
    hud: "#ffffff",
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hudMultiplier = document.getElementById("hud-multiplier");
  const hudScore = document.getElementById("hud-score");
  const hudLives = document.getElementById("hud-lives");
  const menu = document.getElementById("menu");
  const startScreen = document.getElementById("start-screen");
  const finalScore = document.getElementById("final-score");
  const btnNewGame = document.getElementById("btn-new-game");
  const btnStart = document.getElementById("btn-start");

  let width = 800;
  let height = 600;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let frame = 0;
  let lastFrameTime = 0;
  let running = false;
  let gameOver = false;

  const moveStick = createFloatingStick();

  const game = {
    score: 0,
    multiplier: 1,
    targetScore: BASE_POINTS_PER_KILL * 40,
    lives: MAX_LIVES,
    pointsPerKill: BASE_POINTS_PER_KILL,
    player: null,
    bullets: [],
    zeroes: [],
    ones: [],
    particles: [],
    explosions: [],
    lastSpawn: 0,
    fireNow: true,
    fireFrame: 0,
    currentTarget: null,
    startTime: 0,
    spawnInterval: SPAWN_INTERVAL_MS,
    enemyCap: COUNT_THRESHOLD,
    spawnBatch: 1,
    deathSequence: null,
    corners: [],
    rand: Math.random,
  };

  const conway = createConway(CGOL_WIDTH, CGOL_HEIGHT);
  const conwayCanvas = document.createElement("canvas");
  conwayCanvas.width = CGOL_WIDTH;
  conwayCanvas.height = CGOL_HEIGHT;
  const conwayCtx = conwayCanvas.getContext("2d");
  const backgroundImage = createBackgroundImage();

  function createFloatingStick() {
    const touchArea = document.getElementById("controls");
    const zone = document.getElementById("move-zone");
    const knob = document.getElementById("move-knob");
    const STICK_SIZE = 150;
    const state = {
      active: false,
      pointerId: null,
      centerX: 0,
      centerY: 0,
      radius: STICK_SIZE * 0.42,
      vector: { x: 0, y: 0 },
    };

    function placeStick(clientX, clientY) {
      const half = STICK_SIZE / 2;
      zone.style.width = `${STICK_SIZE}px`;
      zone.style.height = `${STICK_SIZE}px`;
      zone.style.left = `${clientX - half}px`;
      zone.style.top = `${clientY - half}px`;
      state.centerX = clientX;
      state.centerY = clientY;
      state.radius = half * 0.85;
      zone.classList.remove("hidden");
      zone.classList.add("active");
    }

    function setVector(clientX, clientY) {
      let dx = clientX - state.centerX;
      let dy = clientY - state.centerY;
      const dist = Math.hypot(dx, dy);
      if (dist > state.radius) {
        dx = (dx / dist) * state.radius;
        dy = (dy / dist) * state.radius;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      state.vector.x = state.radius > 0 ? dx / state.radius : 0;
      state.vector.y = state.radius > 0 ? dy / state.radius : 0;
    }

    function reset() {
      state.active = false;
      state.pointerId = null;
      state.vector.x = 0;
      state.vector.y = 0;
      knob.style.transform = "translate(0px, 0px)";
      zone.classList.remove("active");
      zone.classList.add("hidden");
    }

    touchArea.addEventListener("pointerdown", (event) => {
      if (!running || gameOver || game.deathSequence) return;
      event.preventDefault();
      state.active = true;
      state.pointerId = event.pointerId;
      touchArea.setPointerCapture(event.pointerId);
      placeStick(event.clientX, event.clientY);
      setVector(event.clientX, event.clientY);
    });

    touchArea.addEventListener("pointermove", (event) => {
      if (!state.active || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      setVector(event.clientX, event.clientY);
    });

    function endPointer(event) {
      if (!state.active || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      if (touchArea.hasPointerCapture(event.pointerId)) {
        touchArea.releasePointerCapture(event.pointerId);
      }
      reset();
    }

    touchArea.addEventListener("pointerup", endPointer);
    touchArea.addEventListener("pointercancel", endPointer);

    return state;
  }

  function createConway(w, h) {
    const size = w * h;
    const grid = new Uint8Array(size);
    const next = new Uint8Array(size);

    function idx(x, y) {
      return y * w + x;
    }

    function randomize(count) {
      for (let i = 0; i < count; i++) {
        grid[(Math.random() * size) | 0] = 255;
      }
    }

    function stampActors(actors) {
      const xRatio = w / width;
      const yRatio = h / height;
      for (const actor of actors) {
        let x = Math.floor(actor.x * xRatio);
        let y = Math.floor(actor.y * yRatio);
        x = Math.max(0, Math.min(w - 1, x));
        y = Math.max(0, Math.min(h - 1, y));
        grid[idx(x, y)] = 255;
      }
    }

    function step() {
      for (let i = 0; i < size; i++) {
        const x = i % w;
        const y = (i / w) | 0;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[idx(nx, ny)] === 255) {
              neighbors++;
            }
          }
        }
        if (grid[i] === 255) {
          next[i] = neighbors === 2 || neighbors === 3 ? 255 : (grid[i] * 0.8) | 0;
        } else {
          next[i] = neighbors === 3 ? 255 : (grid[i] * 0.8) | 0;
        }
      }
      grid.set(next);
    }

    function renderAlphaMask(ctx2d) {
      const image = ctx2d.createImageData(w, h);
      const data = image.data;
      for (let i = 0; i < size; i++) {
        const alpha = grid[i];
        const p = i * 4;
        data[p] = 255;
        data[p + 1] = 255;
        data[p + 2] = 255;
        data[p + 3] = alpha;
      }
      ctx2d.putImageData(image, 0, 0);
    }

    function applyBlackHolePull(centerX, centerY, strength, viewportW, viewportH) {
      const cx = (centerX / viewportW) * w;
      const cy = (centerY / viewportH) * h;
      const pulled = new Uint8Array(size);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = cx - x;
          const dy = cy - y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const falloff = Math.exp(-dist / (strength * 12 + 5));
          const pullAmount = falloff * (1.5 + strength * 5);
          const sx = Math.max(0, Math.min(w - 1, Math.round(x + (dx / dist) * pullAmount)));
          const sy = Math.max(0, Math.min(h - 1, Math.round(y + (dy / dist) * pullAmount)));
          let value = grid[idx(sx, sy)];

          if (dist < strength * 9 + 4) {
            value = Math.min(255, value + (1 - dist / (strength * 9 + 4)) * 200);
          }
          pulled[idx(x, y)] = value;
        }
      }

      grid.set(pulled);
    }

    function applyExplosionWave(centerX, centerY, waveRadius, viewportW, viewportH) {
      const cx = (centerX / viewportW) * w;
      const cy = (centerY / viewportH) * h;
      const gridRadius = (waveRadius / viewportW) * w;
      const ring = Math.max(1.5, gridRadius * 0.1);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = idx(x, y);
          const dist = Math.hypot(x - cx, y - cy);
          if (Math.abs(dist - gridRadius) <= ring) {
            grid[i] = 255;
          } else if (dist < gridRadius - ring) {
            grid[i] = (grid[i] * 0.25) | 0;
          }
        }
      }
    }

    return {
      randomize,
      stampActors,
      step,
      renderAlphaMask,
      applyBlackHolePull,
      applyExplosionWave,
      reset() { grid.fill(0); next.fill(0); },
      getGrid() { return grid; },
    };
  }

  function createBackgroundImage() {
    const bg = document.createElement("canvas");
    bg.width = 800;
    bg.height = 600;
    const bgCtx = bg.getContext("2d");

    const gradient = bgCtx.createLinearGradient(0, 0, bg.width, bg.height);
    gradient.addColorStop(0, "#001a12");
    gradient.addColorStop(0.45, "#003322");
    gradient.addColorStop(1, "#00110a");
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, bg.width, bg.height);

    bgCtx.strokeStyle = "rgba(64, 224, 208, 0.12)";
    bgCtx.lineWidth = 1;
    for (let x = 0; x < bg.width; x += 32) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, bg.height);
      bgCtx.stroke();
    }
    for (let y = 0; y < bg.height; y += 32) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bg.width, y);
      bgCtx.stroke();
    }

    bgCtx.fillStyle = "rgba(124, 252, 0, 0.08)";
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * bg.width;
      const y = Math.random() * bg.height;
      const size = 4 + Math.random() * 20;
      bgCtx.fillRect(x, y, size, 2);
    }

    const glow = bgCtx.createRadialGradient(520, 180, 20, 520, 180, 260);
    glow.addColorStop(0, "rgba(64, 224, 208, 0.22)");
    glow.addColorStop(1, "rgba(64, 224, 208, 0)");
    bgCtx.fillStyle = glow;
    bgCtx.fillRect(0, 0, bg.width, bg.height);

    const glow2 = bgCtx.createRadialGradient(180, 420, 20, 180, 420, 220);
    glow2.addColorStop(0, "rgba(124, 252, 0, 0.16)");
    glow2.addColorStop(1, "rgba(124, 252, 0, 0)");
    bgCtx.fillStyle = glow2;
    bgCtx.fillRect(0, 0, bg.width, bg.height);

    return bg;
  }

  function updateDifficulty(timestamp) {
    const elapsed = Math.max(0, (timestamp - game.startTime) / 1000);
    const ramp = Math.min(1, elapsed / DIFFICULTY_RAMP_SECONDS);
    const rampCurve = ramp * ramp;

    game.spawnInterval = Math.max(
      MIN_SPAWN_INTERVAL_MS,
      SPAWN_INTERVAL_MS - rampCurve * (SPAWN_INTERVAL_MS - MIN_SPAWN_INTERVAL_MS)
    );
    game.enemyCap = Math.min(
      MAX_ENEMY_CAP,
      COUNT_THRESHOLD + Math.floor(rampCurve * (MAX_ENEMY_CAP - COUNT_THRESHOLD))
    );

    if (elapsed > 75) game.spawnBatch = 3;
    else if (elapsed > 35) game.spawnBatch = 2;
    else game.spawnBatch = 1;
  }

  function createPlayer() {
    return {
      type: "player",
      x: width / 2,
      y: height / 2,
      radius: 16,
    };
  }

  function createZero() {
    const orbitClockwise = Math.random() < 0.5;
    return {
      type: "zero",
      x: 0,
      y: 0,
      radius: 16,
      orbitClockwise,
    };
  }

  function createOne() {
    return {
      type: "one",
      x: 0,
      y: 0,
      radius: 16,
    };
  }

  function createBullet(x, y, speed, angle, wave) {
    return {
      type: "bullet",
      x,
      y,
      radius: 4,
      speed,
      angle,
      wave: wave ? { counter: 0, frequency: 0.6, baseAngle: angle } : null,
    };
  }

  function createParticle(x, y) {
    const ttl = 100 + Math.random() * 400;
    return {
      type: "particle",
      x,
      y,
      radius: 4,
      speed: 1,
      angle: Math.random() * 15.915,
      rotation: Math.random() * Math.PI * 2,
      expiresAt: performance.now() + ttl,
    };
  }

  function relationship(a, b) {
    if (a.type === "player" && (b.type === "zero" || b.type === "one")) return "enemy";
    if (b.type === "player" && (a.type === "zero" || a.type === "one")) return "enemy";
    if (a.type === "bullet" && (b.type === "zero" || b.type === "one")) return "enemy";
    if (b.type === "bullet" && (a.type === "zero" || a.type === "one")) return "enemy";
    return "neutral";
  }

  function allActors() {
    const list = [];
    if (game.player) list.push(game.player);
    list.push(...game.bullets, ...game.zeroes, ...game.ones, ...game.particles);
    return list;
  }

  function collidableActors() {
    const list = [];
    if (game.player) list.push(game.player);
    list.push(...game.bullets, ...game.zeroes, ...game.ones);
    return list;
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clampActor(actor) {
    actor.x = Math.max(0, Math.min(width, actor.x));
    actor.y = Math.max(0, Math.min(height, actor.y));
  }

  function isOutOfView(actor) {
    const margin = actor.radius + 20;
    return actor.x < -margin || actor.x > width + margin || actor.y < -margin || actor.y > height + margin;
  }

  function getEnemyThreat(enemy, player) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;

    const typeWeight = enemy.type === "one" ? 1.5 : 1.0;
    const proximity = 10000 / (dist * dist + 400);
    const dangerZone = dist < player.radius + enemy.radius + 60 ? 3 : 1;

    return typeWeight * proximity * dangerZone;
  }

  function findHighestThreatEnemy(player) {
    const enemies = game.zeroes.concat(game.ones);
    if (enemies.length === 0) return null;

    let best = null;
    let bestThreat = -1;
    for (const enemy of enemies) {
      const threat = getEnemyThreat(enemy, player);
      if (threat > bestThreat) {
        bestThreat = threat;
        best = enemy;
      }
    }
    return best;
  }

  function aimAngle(fromX, fromY, toX, toY) {
    return Math.atan2(fromY - toY, fromX - toX);
  }

  function updatePlayer() {
    const player = game.player;
    if (!player) return;

    player.x += moveStick.vector.x * PLAYER_SPEED;
    player.y += moveStick.vector.y * PLAYER_SPEED;
    clampActor(player);

    game.currentTarget = findHighestThreatEnemy(player);

    game.fireFrame++;
    if (game.currentTarget && game.fireFrame % FIRE_COOLDOWN_FRAMES === 0) {
      const angle = aimAngle(player.x, player.y, game.currentTarget.x, game.currentTarget.y);
      fireBullets(player, angle);
    }
  }

  function fireBullets(player, angle) {
    if (game.multiplier >= 2 && game.multiplier < 4) {
      game.bullets.push(createBullet(player.x, player.y, 11, angle, false));
      if (game.fireNow) {
        game.bullets.push(createBullet(player.x, player.y, 11, angle + 5 * (Math.PI / 180), false));
        game.bullets.push(createBullet(player.x, player.y, 11, angle - 5 * (Math.PI / 180), false));
        game.fireNow = false;
      } else {
        game.fireNow = true;
      }
    } else if (game.multiplier >= 4) {
      game.bullets.push(createBullet(player.x, player.y, 12, angle, false));
      game.bullets.push(createBullet(player.x, player.y, WAVE_BULLET_SPEED, angle, true));
    } else {
      game.bullets.push(createBullet(player.x, player.y, 10, angle, false));
    }
  }

  function updateEnemy(enemy, pullTarget) {
    const player = game.player;
    const targetX = pullTarget ? pullTarget.x : (player ? player.x : enemy.x);
    const targetY = pullTarget ? pullTarget.y : (player ? player.y : enemy.y);

    const dx = enemy.x - targetX;
    const dy = enemy.y - targetY;
    const dist = Math.hypot(dx, dy) || 1;

    if (pullTarget) {
      const pull = (6 + pullTarget.strength * 12) * pullTarget.delta;
      enemy.x -= (dx / dist) * pull;
      enemy.y -= (dy / dist) * pull;
      return;
    }

    const chaseSpeed = enemy.type === "one" ? ONE_CHASE_SPEED : ZERO_CHASE_SPEED;

    enemy.x -= (dx / dist) * chaseSpeed;
    enemy.y -= (dy / dist) * chaseSpeed;

    if (enemy.type === "zero") {
      const orbitAngle = Math.atan2(dy, dx) + (enemy.orbitClockwise ? -Math.PI / 2 : Math.PI / 2);
      enemy.x -= Math.cos(orbitAngle) * ZERO_ORBIT_SPEED;
      enemy.y -= Math.sin(orbitAngle) * ZERO_ORBIT_SPEED;
    }

    clampActor(enemy);
  }

  function updateBullet(bullet) {
    let angle = bullet.angle;
    if (bullet.wave) {
      bullet.wave.counter += bullet.wave.frequency;
      angle = bullet.wave.baseAngle + (Math.PI / 2) * Math.sin(bullet.wave.counter);
    }
    bullet.x -= Math.cos(angle) * bullet.speed;
    bullet.y -= Math.sin(angle) * bullet.speed;
  }

  function updateParticle(particle) {
    particle.rotation += Math.PI / 110;
    particle.x -= Math.cos(particle.angle) * 5 * particle.speed;
    particle.y -= Math.sin(particle.angle) * 5 * particle.speed;
  }

  function spawnEnemy() {
    const corner = game.corners[(Math.random() * 4) | 0];
    if (Math.random() < 0.5) {
      const zero = createZero();
      zero.x = corner.x;
      zero.y = corner.y;
      game.zeroes.push(zero);
    } else {
      const one = createOne();
      one.x = corner.x;
      one.y = corner.y;
      game.ones.push(one);
    }
  }

  function enemyCount() {
    return game.zeroes.length + game.ones.length;
  }

  function generateParticles(x, y) {
    const count = 20 + ((Math.random() * 10) | 0);
    for (let i = 0; i < count; i++) {
      game.particles.push(createParticle(x, y));
    }
  }

  function addExplosion(x, y) {
    game.explosions.push({
      x: x / width,
      y: y / height,
      size: 0.00001,
      phase: 1,
    });
  }

  function clearEnemies() {
    game.zeroes = [];
    game.ones = [];
  }

  function clearScreen() {
    game.bullets = [];
    clearEnemies();
  }

  function startDeathSequence(x, y) {
    game.deathSequence = {
      phase: "collapse",
      startTime: performance.now(),
      virtualElapsed: 0,
      x,
      y,
      blackHoleRadius: 18,
      explodeRadius: 0,
      strength: 0,
    };
    game.player = null;
    game.bullets = [];
    game.currentTarget = null;
    game.conwayAccumulator = 0;
  }

  function destroyEnemyAt(x, y, awardScore) {
    if (awardScore) {
      game.score += game.multiplier * game.pointsPerKill;
      if (game.score > game.targetScore) {
        game.targetScore *= 4;
        game.multiplier *= 2;
      }
    }
    generateParticles(x, y);
    addExplosion(x, y);
  }

  function destroyEnemiesHitByWave(sequence) {
    const waveEdge = sequence.explodeRadius;

    game.zeroes = game.zeroes.filter((enemy) => {
      const dist = Math.hypot(enemy.x - sequence.x, enemy.y - sequence.y);
      if (dist <= waveEdge + enemy.radius) {
        destroyEnemyAt(enemy.x, enemy.y, true);
        return false;
      }
      return true;
    });

    game.ones = game.ones.filter((enemy) => {
      const dist = Math.hypot(enemy.x - sequence.x, enemy.y - sequence.y);
      if (dist <= waveEdge + enemy.radius) {
        destroyEnemyAt(enemy.x, enemy.y, true);
        return false;
      }
      return true;
    });
  }

  function updateDeathSequence(now, deltaMs) {
    const sequence = game.deathSequence;
    if (!sequence) return;

    const slowDelta = deltaMs * DEATH_SLOWMO;
    sequence.virtualElapsed = (sequence.virtualElapsed || 0) + slowDelta;

    if (sequence.phase === "collapse") {
      const t = Math.min(1, sequence.virtualElapsed / DEATH_COLLAPSE_MS);
      sequence.strength = t;
      sequence.blackHoleRadius = 18 + t * 42;

      const pullTarget = {
        x: sequence.x,
        y: sequence.y,
        strength: sequence.strength,
        delta: slowDelta / 16,
      };
      for (const enemy of game.zeroes) updateEnemy(enemy, pullTarget);
      for (const enemy of game.ones) updateEnemy(enemy, pullTarget);

      if (sequence.virtualElapsed >= DEATH_COLLAPSE_MS) {
        sequence.phase = "explode";
        sequence.explodeRadius = sequence.blackHoleRadius;
        addExplosion(sequence.x, sequence.y);
      }
      return;
    }

    if (sequence.phase === "explode") {
      sequence.explodeRadius += DEATH_EXPLODE_EXPAND * (deltaMs / 1000);
      sequence.blackHoleRadius = Math.max(0, sequence.blackHoleRadius - 280 * (deltaMs / 1000));

      destroyEnemiesHitByWave(sequence);
      conway.applyExplosionWave(sequence.x, sequence.y, sequence.explodeRadius, width, height);

      const maxRadius = Math.hypot(width, height) * 1.15;
      if (sequence.explodeRadius >= maxRadius) {
        for (const enemy of game.zeroes.concat(game.ones)) {
          destroyEnemyAt(enemy.x, enemy.y, true);
        }
        clearEnemies();
        sequence.phase = "done";
        finishDeathSequence();
      }
    }
  }

  function finishDeathSequence() {
    game.deathSequence = null;
    game.lives -= 1;
    updateHud();

    if (game.lives <= 0) {
      endGame();
      return;
    }

    game.lastSpawn = performance.now() + 1000;
    game.player = createPlayer();
  }

  function onPlayerHit() {
    if (game.deathSequence) return;
    const player = game.player;
    if (!player) return;
    startDeathSequence(player.x, player.y);
  }

  function onEnemyKilled(x, y) {
    game.score += game.multiplier * game.pointsPerKill;
    if (game.score > game.targetScore) {
      game.targetScore *= 4;
      game.multiplier *= 2;
    }
    generateParticles(x, y);
    addExplosion(x, y);
  }

  function handleCollisions() {
    const actors = collidableActors();
    for (let i = 0; i < actors.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = actors[i];
        const b = actors[j];
        if (relationship(a, b) !== "enemy") continue;
        if (a.radius + b.radius >= distance(a, b)) {
          if (a.type === "player" || b.type === "player") {
            onPlayerHit();
            return;
          }
          const enemy = a.type === "zero" || a.type === "one" ? a : b;
          onEnemyKilled(enemy.x, enemy.y);
          game.bullets = game.bullets.filter((item) => item !== a && item !== b);
          game.zeroes = game.zeroes.filter((item) => item !== a && item !== b);
          game.ones = game.ones.filter((item) => item !== a && item !== b);
        }
      }
    }
  }

  function updateExplosions() {
    game.explosions = game.explosions.filter((explosion) => {
      if (explosion.phase === 1) {
        explosion.size += 0.05 / 3;
        if (explosion.size >= 0.05) explosion.phase = 0;
        return true;
      }
      explosion.size *= 0.9;
      return explosion.size >= 0.000001;
    });
  }

  function updateConway(randomCells, stepCount) {
    conway.randomize(randomCells);
    conway.stampActors(allActors());
    for (let i = 0; i < stepCount; i++) {
      conway.step();
    }
    conway.renderAlphaMask(conwayCtx);
  }

  function update(timestamp, deltaMs) {
    if (!running || gameOver) return;

    if (game.deathSequence) {
      updateDeathSequence(timestamp, deltaMs);

      const now = performance.now();
      for (const particle of game.particles) updateParticle(particle);
      game.particles = game.particles.filter((particle) => particle.expiresAt > now);
      updateExplosions();

      game.conwayAccumulator += deltaMs;
      if (game.conwayAccumulator >= 16) {
        updateConway(2, 1);
        game.conwayAccumulator = 0;
      }
      return;
    }

    updateDifficulty(timestamp);
    updatePlayer();

    for (const enemy of game.zeroes) updateEnemy(enemy);
    for (const enemy of game.ones) updateEnemy(enemy);

    for (const bullet of game.bullets) updateBullet(bullet);
    game.bullets = game.bullets.filter((bullet) => !isOutOfView(bullet));

    const now = performance.now();
    for (const particle of game.particles) updateParticle(particle);
    game.particles = game.particles.filter((particle) => particle.expiresAt > now);

    if (timestamp - game.lastSpawn > game.spawnInterval && enemyCount() < game.enemyCap) {
      for (let i = 0; i < game.spawnBatch && enemyCount() < game.enemyCap; i++) {
        spawnEnemy();
      }
      game.lastSpawn = timestamp;
    }

    handleCollisions();
    updateExplosions();

    updateConway(5, 1);

    updateHud();
  }

  function updateHud() {
    hudMultiplier.textContent = `Multiplier: ${game.multiplier}`;
    hudScore.textContent = `Score: ${game.score}`;
    hudLives.textContent = `Lives: ${game.lives}`;
  }

  function drawBackground() {
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(backgroundImage, 0, 0, width, height);
    ctx.globalCompositeOperation = "destination-in";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(conwayCanvas, 0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    for (const explosion of game.explosions) {
      const ex = explosion.x * width;
      const ey = explosion.y * height;
      const radius = explosion.size * Math.max(width, height) * 4;
      const gradient = ctx.createRadialGradient(ex, ey, 0, ex, ey, radius);
      gradient.addColorStop(0, "rgba(124, 252, 0, 0.35)");
      gradient.addColorStop(1, "rgba(124, 252, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(actor, blackHole) {
    const dx = blackHole ? blackHole.x - actor.x : 0;
    const dy = blackHole ? blackHole.y - actor.y : 0;
    const dist = blackHole ? Math.hypot(dx, dy) || 1 : 1;
    const angle = Math.atan2(dy, dx);
    const stretch = blackHole ? 1 + Math.min(2.2, 120 / (dist + 20)) : 1;

    ctx.save();
    ctx.translate(actor.x, actor.y);
    if (blackHole) {
      ctx.rotate(angle);
      ctx.scale(stretch, 1 / Math.sqrt(stretch));
    }

    if (actor.type === "zero") {
      ctx.fillStyle = COLORS.zero;
      ctx.beginPath();
      ctx.arc(0, 0, actor.radius, 0, Math.PI * 2);
      ctx.fill();
      if (blackHole) {
        ctx.strokeStyle = "rgba(124, 252, 0, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(actor.radius * 1.6, 0);
        ctx.stroke();
      }
      ctx.fillStyle = "#001100";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("0", 0, 1);
    } else if (actor.type === "one") {
      ctx.fillStyle = COLORS.one;
      ctx.beginPath();
      ctx.arc(0, 0, actor.radius, 0, Math.PI * 2);
      ctx.fill();
      if (blackHole) {
        ctx.strokeStyle = "rgba(0, 255, 127, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(actor.radius * 1.6, 0);
        ctx.stroke();
      }
      ctx.fillStyle = "#001100";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1", 0, 1);
    }

    ctx.restore();
  }

  function drawBlackHole(sequence) {
    const { x, y, blackHoleRadius, explodeRadius, phase } = sequence;

    ctx.save();
    ctx.translate(x, y);

    if (phase === "explode" && explodeRadius > 0) {
      const ringThickness = Math.max(18, explodeRadius * 0.08);
      const inner = Math.max(0, explodeRadius - ringThickness);
      const wave = ctx.createRadialGradient(0, 0, inner, 0, 0, explodeRadius);
      wave.addColorStop(0, "rgba(255, 255, 255, 0)");
      wave.addColorStop(0.55, "rgba(255, 255, 255, 0.75)");
      wave.addColorStop(0.8, "rgba(124, 252, 0, 0.55)");
      wave.addColorStop(1, "rgba(124, 252, 0, 0)");
      ctx.fillStyle = wave;
      ctx.beginPath();
      ctx.arc(0, 0, explodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const disk = ctx.createRadialGradient(0, 0, blackHoleRadius * 0.2, 0, 0, blackHoleRadius * 1.8);
    disk.addColorStop(0, "#000000");
    disk.addColorStop(0.45, "#111111");
    disk.addColorStop(0.7, "rgba(64, 224, 208, 0.35)");
    disk.addColorStop(1, "rgba(64, 224, 208, 0)");
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(0, 0, blackHoleRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(0, 0, blackHoleRadius, 0, Math.PI * 2);
    ctx.fill();

    const spikeCount = 12;
    ctx.strokeStyle = "rgba(180, 180, 180, 0.35)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < spikeCount; i++) {
      const spikeAngle = (Math.PI * 2 * i) / spikeCount + performance.now() * 0.001;
      const inner = blackHoleRadius * 1.05;
      const outer = blackHoleRadius * (1.8 + sequence.strength * 0.8);
      ctx.beginPath();
      ctx.moveTo(Math.cos(spikeAngle) * inner, Math.sin(spikeAngle) * inner);
      ctx.lineTo(Math.cos(spikeAngle) * outer, Math.sin(spikeAngle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawActor(actor) {
    ctx.save();
    ctx.translate(actor.x, actor.y);

    if (actor.type === "player") {
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.moveTo(0, -actor.radius);
      ctx.lineTo(actor.radius, 0);
      ctx.lineTo(0, actor.radius);
      ctx.lineTo(-actor.radius, 0);
      ctx.closePath();
      ctx.fill();
    } else if (actor.type === "bullet") {
      ctx.fillStyle = COLORS.bullet;
      ctx.beginPath();
      ctx.arc(0, 0, actor.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (actor.type === "particle") {
      const lifeLeft = actor.expiresAt - performance.now();
      const alpha = Math.min(Math.abs(lifeLeft / 100), 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.particle;
      ctx.rotate(actor.rotation);
      ctx.fillRect(-3, -3, 6, 6);
    }

    ctx.restore();
  }

  function drawTargetIndicator() {
    if (!game.player || !game.currentTarget) return;

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.strokeStyle = "rgba(255, 80, 80, 0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(game.player.x, game.player.y);
    ctx.lineTo(game.currentTarget.x, game.currentTarget.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(255, 80, 80, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.currentTarget.x, game.currentTarget.y, game.currentTarget.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    if (game.player) drawActor(game.player);
    for (const bullet of game.bullets) drawActor(bullet);

    const blackHole = game.deathSequence;
    for (const enemy of game.zeroes) drawEnemy(enemy, blackHole);
    for (const enemy of game.ones) drawEnemy(enemy, blackHole);

    for (const particle of game.particles) drawActor(particle);

    if (blackHole) drawBlackHole(blackHole);

    ctx.restore();
    if (!blackHole) drawTargetIndicator();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    const aspect = width / height;
    let drawWidth = displayWidth;
    let drawHeight = displayWidth / aspect;
    if (drawHeight > displayHeight) {
      drawHeight = displayHeight;
      drawWidth = displayHeight * aspect;
    }

    scale = (drawWidth / width) * dpr;
    offsetX = ((displayWidth - drawWidth) / 2) * dpr;
    offsetY = ((displayHeight - drawHeight) / 2) * dpr;

    game.corners = [
      { x: 0, y: 0 },
      { x: 0, y: height },
      { x: width, y: 0 },
      { x: width, y: height },
    ];
  }

  function resetGame() {
    game.score = 0;
    game.multiplier = 1;
    game.targetScore = BASE_POINTS_PER_KILL * 40;
    game.lives = MAX_LIVES;
    game.pointsPerKill = BASE_POINTS_PER_KILL;
    game.bullets = [];
    game.zeroes = [];
    game.ones = [];
    game.particles = [];
    game.explosions = [];
    game.fireNow = true;
    game.fireFrame = 0;
    game.currentTarget = null;
    game.deathSequence = null;
    game.conwayAccumulator = 0;
    game.startTime = performance.now();
    game.spawnInterval = SPAWN_INTERVAL_MS;
    game.enemyCap = COUNT_THRESHOLD;
    game.spawnBatch = 1;
    game.lastSpawn = performance.now();
    game.player = createPlayer();
    conway.reset();
    gameOver = false;
    menu.classList.add("hidden");
    updateHud();
  }

  function startGame() {
    resetGame();
    startScreen.classList.add("hidden");
    document.body.classList.add("playing");
    running = true;
  }

  function endGame() {
    gameOver = true;
    running = false;
    game.player = null;
    document.body.classList.remove("playing");
    finalScore.textContent = `Score: ${game.score}`;
    menu.classList.remove("hidden");
  }

  function loop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaMs = Math.min(32, timestamp - lastFrameTime);
    lastFrameTime = timestamp;

    if (running || game.deathSequence) {
      update(timestamp, deltaMs);
      draw();
    }
    requestAnimationFrame(loop);
  }

  function bindTap(element, handler) {
    let lastActivation = 0;

    function activate(event) {
      const now = Date.now();
      if (now - lastActivation < 350) return;
      lastActivation = now;
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      handler();
    }

    element.addEventListener("pointerup", activate);
    element.addEventListener("click", activate);
  }

  bindTap(startScreen, startGame);
  bindTap(btnNewGame, startGame);

  window.addEventListener("resize", resize);
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  resize();
  updateHud();
  requestAnimationFrame(loop);
})();
