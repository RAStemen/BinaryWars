(function () {
  "use strict";

  const MAX_LIVES = 5;
  const BASE_POINTS_PER_KILL = 128;
  const SPAWN_INTERVAL_MS = 500;
  const COUNT_THRESHOLD = 100;
  const PLAYER_SPEED = 5;
  const FIRE_COOLDOWN_FRAMES = 6;
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
  let lastTimestamp = 0;
  let running = false;
  let gameOver = false;

  const moveStick = createFloatingStick();

  const game = {
    score: 0,
    multiplier: 1,
    priorityMultiplier: 1,
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
    corners: [],
    rand: Math.random,
  };

  const conway = createConway(CGOL_WIDTH, CGOL_HEIGHT);
  const conwayCanvas = document.createElement("canvas");
  conwayCanvas.width = CGOL_WIDTH;
  conwayCanvas.height = CGOL_HEIGHT;
  const conwayCtx = conwayCanvas.getContext("2d");

  function createFloatingStick() {
    const touchArea = document.getElementById("move-touch-area");
    const zone = document.getElementById("move-zone");
    const knob = document.getElementById("move-knob");
    const state = {
      active: false,
      touchId: null,
      centerX: 0,
      centerY: 0,
      radius: 75,
      vector: { x: 0, y: 0 },
    };

    function placeStick(clientX, clientY) {
      const size = zone.offsetWidth || 150;
      const half = size / 2;
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
      state.touchId = null;
      state.vector.x = 0;
      state.vector.y = 0;
      knob.style.transform = "translate(0px, 0px)";
      zone.classList.remove("active");
      zone.classList.add("hidden");
    }

    touchArea.addEventListener("touchstart", (event) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      state.active = true;
      state.touchId = touch.identifier;
      placeStick(touch.clientX, touch.clientY);
      setVector(touch.clientX, touch.clientY);
    }, { passive: false });

    touchArea.addEventListener("touchmove", (event) => {
      event.preventDefault();
      for (const touch of event.changedTouches) {
        if (touch.identifier === state.touchId) {
          setVector(touch.clientX, touch.clientY);
        }
      }
    }, { passive: false });

    function endTouch(event) {
      for (const touch of event.changedTouches) {
        if (touch.identifier === state.touchId) {
          reset();
        }
      }
    }

    touchArea.addEventListener("touchend", endTouch, { passive: false });
    touchArea.addEventListener("touchcancel", endTouch, { passive: false });

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

    function renderTo(ctx2d) {
      const image = ctx2d.createImageData(w, h);
      const data = image.data;
      for (let i = 0; i < size; i++) {
        const v = grid[i];
        const p = i * 4;
        data[p] = 20;
        data[p + 1] = 120 + (v >> 1);
        data[p + 2] = 40 + (v >> 2);
        data[p + 3] = 255;
      }
      ctx2d.putImageData(image, 0, 0);
    }

    return { randomize, stampActors, step, renderTo, reset() { grid.fill(0); next.fill(0); } };
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

  function updatePlayer() {
    const player = game.player;
    if (!player) return;

    player.x += moveStick.vector.x * PLAYER_SPEED;
    player.y += moveStick.vector.y * PLAYER_SPEED;
    clampActor(player);

    game.currentTarget = findHighestThreatEnemy(player);

    game.fireFrame++;
    if (game.currentTarget && game.fireFrame % FIRE_COOLDOWN_FRAMES === 0) {
      const dx = game.currentTarget.x - player.x;
      const dy = game.currentTarget.y - player.y;
      const angle = Math.atan2(dy, dx);
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
      game.bullets.push(createBullet(player.x, player.y, 6, angle, true));
    } else {
      game.bullets.push(createBullet(player.x, player.y, 10, angle, false));
    }
  }

  function updateEnemy(enemy) {
    const player = game.player;
    if (!player) return;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const chaseSpeed = enemy.type === "one" ? 2.5 * game.priorityMultiplier : 2 * game.priorityMultiplier;

    enemy.x -= (dx / dist) * chaseSpeed;
    enemy.y -= (dy / dist) * chaseSpeed;

    if (enemy.type === "zero") {
      const orbitSpeed = 3 * game.priorityMultiplier;
      const orbitAngle = Math.atan2(dy, dx) + (enemy.orbitClockwise ? -Math.PI / 2 : Math.PI / 2);
      enemy.x -= Math.cos(orbitAngle) * orbitSpeed;
      enemy.y -= Math.sin(orbitAngle) * orbitSpeed;
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

  function clearScreen() {
    game.bullets = [];
    game.zeroes = [];
    game.ones = [];
  }

  function onPlayerHit() {
    game.lives -= 1;
    clearScreen();
    if (game.lives <= 0) {
      endGame();
      return;
    }
    game.lastSpawn = performance.now() + 1000;
    game.player = createPlayer();
  }

  function onEnemyKilled(x, y) {
    game.score += game.multiplier * game.pointsPerKill;
    if (game.score > game.targetScore) {
      game.targetScore *= 4;
      game.priorityMultiplier *= 1.25;
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

  function update(timestamp) {
    if (!running || gameOver) return;

    updatePlayer();

    for (const enemy of game.zeroes) updateEnemy(enemy);
    for (const enemy of game.ones) updateEnemy(enemy);

    for (const bullet of game.bullets) updateBullet(bullet);
    game.bullets = game.bullets.filter((bullet) => !isOutOfView(bullet));

    const now = performance.now();
    for (const particle of game.particles) updateParticle(particle);
    game.particles = game.particles.filter((particle) => particle.expiresAt > now);

    if (timestamp - game.lastSpawn > SPAWN_INTERVAL_MS && enemyCount() < COUNT_THRESHOLD) {
      spawnEnemy();
      game.lastSpawn = timestamp;
    }

    handleCollisions();
    updateExplosions();

    conway.randomize(5);
    conway.stampActors(allActors());
    conway.step();
    conway.renderTo(conwayCtx);

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
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(conwayCanvas, 0, 0, width, height);

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
    } else if (actor.type === "zero") {
      ctx.fillStyle = COLORS.zero;
      ctx.beginPath();
      ctx.arc(0, 0, actor.radius, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.fillStyle = "#001100";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("1", 0, 1);
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
    for (const enemy of game.zeroes) drawActor(enemy);
    for (const enemy of game.ones) drawActor(enemy);
    for (const particle of game.particles) drawActor(particle);

    ctx.restore();
    drawTargetIndicator();
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
    game.priorityMultiplier = 1;
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
    if (timestamp - lastTimestamp >= 16) {
      update(timestamp);
      draw();
      lastTimestamp = timestamp;
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
