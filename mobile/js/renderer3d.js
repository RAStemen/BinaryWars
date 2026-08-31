(function () {
  "use strict";

  const ACTOR_SCALE = 1.15;

  function createPlayerMesh() {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x40e0d0,
      emissive: 0x0a5048,
      emissiveIntensity: 0.45,
      metalness: 0.55,
      roughness: 0.28,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(14 * ACTOR_SCALE);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    return mesh;
  }

  function createZeroMesh() {
    const geometry = new THREE.TorusGeometry(1, 0.38, 12, 28);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7cfc00,
      emissive: 0x1a4a00,
      emissiveIntensity: 0.35,
      metalness: 0.35,
      roughness: 0.38,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(10 * ACTOR_SCALE);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    return mesh;
  }

  function createOneMesh() {
    const geometry = new THREE.CapsuleGeometry(0.42, 1.2, 6, 12);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff7f,
      emissive: 0x004422,
      emissiveIntensity: 0.35,
      metalness: 0.35,
      roughness: 0.38,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(14 * ACTOR_SCALE);
    mesh.castShadow = true;
    return mesh;
  }

  function ActorRenderer3D(canvas, gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(48, 1, 1, 4000);
    this.camera.position.set(0, 420, 320);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambient = new THREE.AmbientLight(0x334455, 0.55);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(120, 260, 80);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 50;
    keyLight.shadow.camera.far = 900;
    keyLight.shadow.camera.left = -500;
    keyLight.shadow.camera.right = 500;
    keyLight.shadow.camera.top = 500;
    keyLight.shadow.camera.bottom = -500;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x40e0d0, 0.45);
    rimLight.position.set(-180, 120, -140);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x7cfc00, 0.25);
    fillLight.position.set(60, 80, 220);
    this.scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(gameWidth * 1.4, gameHeight * 1.4),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.playerMesh = null;
    this.enemyMeshes = new Map();
    this.tempVec = new THREE.Vector3();
  }

  ActorRenderer3D.prototype.gameToWorld = function (x, y) {
    return {
      x: x - this.gameWidth / 2,
      z: y - this.gameHeight / 2,
    };
  };

  ActorRenderer3D.prototype.resize = function (pixelWidth, pixelHeight, scale, offsetX, offsetY, drawWidth, drawHeight) {
    this.renderer.setSize(pixelWidth, pixelHeight, false);
    this.viewport = { scale, offsetX, offsetY, pixelWidth, pixelHeight, drawWidth, drawHeight };

    const viewportWidth = Math.floor(drawWidth);
    const viewportHeight = Math.floor(drawHeight);
    const viewportX = Math.floor(offsetX);
    const viewportY = Math.floor(pixelHeight - offsetY - drawHeight);

    this.renderer.setScissorTest(true);
    this.renderer.setScissor(viewportX, viewportY, viewportWidth, viewportHeight);
    this.renderer.setViewport(viewportX, viewportY, viewportWidth, viewportHeight);

    this.camera.aspect = drawWidth / drawHeight;
    this.camera.updateProjectionMatrix();
  };

  ActorRenderer3D.prototype.ensurePlayerMesh = function () {
    if (!this.playerMesh) {
      this.playerMesh = createPlayerMesh();
      this.scene.add(this.playerMesh);
    }
    return this.playerMesh;
  };

  ActorRenderer3D.prototype.removePlayerMesh = function () {
    if (!this.playerMesh) return;
    this.scene.remove(this.playerMesh);
    this.playerMesh.geometry.dispose();
    this.playerMesh.material.dispose();
    this.playerMesh = null;
  };

  ActorRenderer3D.prototype.acquireEnemyMesh = function (enemy) {
    let mesh = this.enemyMeshes.get(enemy);
    if (!mesh) {
      mesh = enemy.type === "zero" ? createZeroMesh() : createOneMesh();
      this.enemyMeshes.set(enemy, mesh);
      this.scene.add(mesh);
    }
    return mesh;
  };

  ActorRenderer3D.prototype.releaseEnemyMesh = function (enemy) {
    const mesh = this.enemyMeshes.get(enemy);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    this.enemyMeshes.delete(enemy);
  };

  ActorRenderer3D.prototype.syncEnemies = function (enemies, blackHole) {
    const live = new Set(enemies);

    for (const [enemy, mesh] of this.enemyMeshes) {
      if (!live.has(enemy)) {
        this.releaseEnemyMesh(enemy);
      }
    }

    for (const enemy of enemies) {
      const mesh = this.acquireEnemyMesh(enemy);
      const world = this.gameToWorld(enemy.x, enemy.y);
      mesh.position.x = world.x;
      mesh.position.z = world.z;
      mesh.position.y = 0;

      mesh.rotation.set(0, 0, 0);
      mesh.scale.setScalar((enemy.type === "zero" ? 10 : 14) * ACTOR_SCALE);

      if (blackHole) {
        const dx = blackHole.x - enemy.x;
        const dy = blackHole.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);
        const stretch = 1 + Math.min(2.2, 120 / (dist + 20));

        mesh.rotation.y = -angle;
        mesh.scale.x *= stretch;
        mesh.scale.z /= Math.sqrt(stretch);

        const pullLift = Math.min(18, 120 / (dist + 12));
        mesh.position.y = pullLift;
      }

      mesh.rotation.y += performance.now() * 0.00035 * (enemy.type === "zero" ? 1 : -1);
      if (enemy.type === "zero") {
        mesh.rotation.z = Math.sin(performance.now() * 0.002 + enemy.x * 0.01) * 0.12;
      }
    }
  };

  ActorRenderer3D.prototype.sync = function (game) {
    if (game.player) {
      const mesh = this.ensurePlayerMesh();
      const world = this.gameToWorld(game.player.x, game.player.y);
      mesh.position.set(world.x, 6, world.z);
      mesh.rotation.y = performance.now() * 0.0018;
      mesh.rotation.z = Math.sin(performance.now() * 0.003) * 0.08;
    } else {
      this.removePlayerMesh();
    }

    const enemies = game.zeroes.concat(game.ones);
    this.syncEnemies(enemies, game.deathSequence);
  };

  ActorRenderer3D.prototype.render = function () {
    this.renderer.render(this.scene, this.camera);
  };

  ActorRenderer3D.prototype.clear = function () {
    this.removePlayerMesh();
    for (const enemy of Array.from(this.enemyMeshes.keys())) {
      this.releaseEnemyMesh(enemy);
    }
  };

  ActorRenderer3D.prototype.dispose = function () {
    this.clear();
    this.renderer.dispose();
  };

  window.ActorRenderer3D = ActorRenderer3D;
})();
