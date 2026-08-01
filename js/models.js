/* 极地风暴 - 3D 模型模块（全部程序化生成） */
(function () {
  'use strict';

  /* ================= 噪声 ================= */
  function hash2(x, z, seed) {
    const s = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function vnoise(x, z, seed) {
    const xi = Math.floor(x), zi = Math.floor(z);
    const xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = hash2(xi, zi, seed), b = hash2(xi + 1, zi, seed);
    const c = hash2(xi, zi + 1, seed), d = hash2(xi + 1, zi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, z, oct, seed) {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * vnoise(x * freq, z * freq, seed + i * 17);
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  }
  function smoothstep(e0, e1, x) {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ================= 材质 ================= */
  function std(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color: color === undefined ? 0xffffff : color,
      roughness: opts.roughness === undefined ? 0.8 : opts.roughness,
      metalness: opts.metalness || 0,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity || 1,
      transparent: opts.transparent || false,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      envMapIntensity: opts.env === undefined ? 0.35 : opts.env,
      flatShading: opts.flat || false,
      vertexColors: opts.vertexColors || false
    });
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  /* 毛发顶点着色：在基础毛色上叠加低频噪点，让皮毛有真实的不均匀感 */
  function furTint(mesh, color, amount, seed) {
    const pos = mesh.geometry.attributes.position;
    const n = pos.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const v = clamp01(1 + (fbm(x * 1.5 + seed, z * 1.5 - seed, 2, seed) - 0.5) * amount);
      col[i * 3] = c.r * v;
      col[i * 3 + 1] = c.g * v;
      col[i * 3 + 2] = c.b * v;
    }
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }

  /* ================= 纹理 ================= */
  function makeSoftTexture(inner, outer, size) {
    size = size || 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, inner || 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, outer || 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }
  function makeSnowflakeTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    g.translate(32, 32);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      g.rotate(Math.PI / 3);
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(0, -26);
      g.moveTo(0, -14); g.lineTo(-5, -20);
      g.moveTo(0, -14); g.lineTo(5, -20);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    return t;
  }
  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 64, 10, 128, 64, 110);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.5, 'rgba(240,248,255,0.42)');
    grad.addColorStop(1, 'rgba(240,248,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 128);
    return new THREE.CanvasTexture(c);
  }

  /* ================= 通用小部件 ================= */
  function displaceFur(mesh, amount, seed) {
    const pos = mesh.geometry.attributes.position;
    const norm = mesh.geometry.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = fbm(x * 2.2 + seed, z * 2.2 - y, 2, seed) - 0.5;
      pos.setXYZ(i,
        x + norm.getX(i) * n * amount,
        y + norm.getY(i) * n * amount,
        z + norm.getZ(i) * n * amount);
    }
    mesh.geometry.computeVertexNormals();
    mesh.geometry.attributes.position.needsUpdate = true;
  }

  function makeRing(color, opacity) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1, 48),
      new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: opacity === undefined ? 0.8 : opacity,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
      })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  function makeDisc(color, opacity) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: opacity === undefined ? 0.35 : opacity,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  function makeBeam(len) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, len, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x9fe8ff, transparent: true, opacity: 0.85, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    );
    return m;
  }
  function makeGlow(r) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    return m;
  }
  function makeIceShard() {
    const geo = new THREE.ConeGeometry(0.14, 1.2, 6);
    geo.rotateX(Math.PI / 2); // tip +Z
    const m = new THREE.Mesh(geo, std(0xbfe9ff, { roughness: 0.25, env: 0.9, emissive: 0x236b9e, emissiveIntensity: 0.35, transparent: true, opacity: 0.92 }));
    return m;
  }
  function makeBoulder() {
    const geo = new THREE.IcosahedronGeometry(0.85, 1);
    const m = new THREE.Mesh(geo, std(0xb9c2ca, { roughness: 0.95, env: 0.2 }));
    displaceFur(m, 0.08, 77);
    return m;
  }
  function makeDropPod() {
    const g = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 1.7, 12), std(0xd94a3d, { roughness: 0.5, metalness: 0.25, env: 0.5 }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.1, 8, 20), std(0x8f9aa5, { roughness: 0.4, metalness: 0.6, env: 0.7 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.78;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 12), std(0xcf5347, { roughness: 0.5, env: 0.4 }));
    cone.position.y = 1.28;
    const chute = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.1, 12), std(0xf2f6f8, { roughness: 0.9, transparent: true, opacity: 0.94 }));
    chute.position.y = 3.1;
    const ropeMat = std(0xd9d4c8, { roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 5), ropeMat);
      rope.position.set(Math.cos(a) * 1.6, 2.0, Math.sin(a) * 1.6);
      g.add(rope);
    }
    g.add(pod, rim, cone, chute);
    return g;
  }

  /* ================= 北极熊 ================= */
  function buildBear() {
    const fur = std(0xefe8db, { roughness: 0.93, env: 0.28, vertexColors: true });
    const furShade = std(0xd6cdbc, { roughness: 0.93, env: 0.25, vertexColors: true });
    const belly = std(0xf8f3ea, { roughness: 0.92, env: 0.3, vertexColors: true });
    const black = std(0x1d1f24, { roughness: 0.55, env: 0.35 });
    const inner = std(0xc2af98, { roughness: 0.85, env: 0.2 });

    const root = new THREE.Group();
    const bodyGrp = new THREE.Group();
    root.add(bodyGrp);

    // 有机体块：多个球体自然融合出肌肉轮廓，避免机械拼接感
    const blob = (mat, r, sx, sy, sz, x, y, z, disp, seed, seg) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 34, Math.round((seg || 34) * 0.72)), mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      if (disp) displaceFur(m, disp, seed);
      if (mat.vertexColors) furTint(m, mat.color.getHex(), 0.15, seed + 7);
      return m;
    };

    // 躯干：肩、腰、臀一体成型
    const torso = blob(fur, 0.62, 1.35, 1.04, 0.78, 0, 1.12, -0.1, 0.055, 9, 46);
    const chest = blob(fur, 0.52, 1.1, 1.0, 0.86, 0, 1.42, 0.4, 0.05, 17, 42);
    const neck = blob(fur, 0.44, 0.92, 0.95, 0.82, 0, 1.66, 0.32, 0.045, 41, 34);
    const haunchL = blob(fur, 0.52, 0.95, 0.88, 0.8, -0.48, 1.0, -0.52, 0.045, 25, 38);
    const haunchR = blob(fur, 0.52, 0.95, 0.88, 0.8, 0.48, 1.0, -0.52, 0.045, 26, 38);
    const rump = blob(fur, 0.5, 1.05, 0.9, 0.72, 0, 0.98, -0.68, 0.045, 33, 38);
    const bellyBlob = blob(belly, 0.45, 1.25, 0.52, 0.78, 0, 0.86, 0.08, 0.03, 49, 34);
    const tail = blob(fur, 0.17, 1, 0.95, 0.8, 0, 0.84, -1.02, 0.02, 55, 16);
    bodyGrp.add(torso, chest, neck, haunchL, haunchR, rump, bellyBlob, tail);

    // 腿：大腿粗壮、小腿渐细、圆踝、掌垫与趾爪
    function makeLeg(x, z, len, thick, isHind) {
      const g = new THREE.Group();
      g.position.set(x, (isHind ? 0.84 : 0.94), z);
      const hip = blob(fur, thick * 0.9, 1.0, 1.05, 0.95, 0, -len * 0.14, 0.05, 0.035, isHind ? 61 : 62, 28);
      const upper = blob(furShade, thick * 0.72, 0.9, 1.25, 0.85, 0, -len * 0.4, 0.06, 0.03, isHind ? 63 : 64, 26);
      const ankle = blob(furShade, thick * 0.52, 1.0, 0.62, 1.1, 0, -len * 0.66, 0.1, 0.025, 65, 24);
      const paw = blob(furShade, thick * 0.58, 1.45, 0.48, 1.05, 0, -len * 0.86, 0.16, 0.02, 67, 28);
      g.add(hip, upper, ankle, paw);
      for (let i = 0; i < 4; i++) {
        const tx = (i - 1.5) * thick * 0.27;
        const toe = blob(furShade, thick * 0.17, 1.0, 0.72, 1.0, tx, -len * 0.9, 0.32, 0.01, 68 + i, 12);
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.15, 6), black);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(tx, -len * 0.92, 0.4);
        g.add(toe, claw);
      }
      return g;
    }
    const legFL = makeLeg(-0.56, 0.48, 1.0, 0.24, false);
    const legFR = makeLeg(0.56, 0.48, 1.0, 0.24, false);
    const legBL = makeLeg(-0.58, -0.48, 0.94, 0.29, true);
    const legBR = makeLeg(0.58, -0.48, 0.94, 0.29, true);
    bodyGrp.add(legFL, legFR, legBL, legBR);

    // 头部：圆颅、渐细吻部、眼窝、圆耳
    const headGrp = new THREE.Group();
    headGrp.position.set(0, 1.98, 0.5);
    const skull = blob(fur, 0.5, 1.0, 0.92, 0.86, 0, 0.05, -0.04, 0.05, 81, 40);
    const bridge = blob(fur, 0.3, 0.78, 0.62, 0.95, 0, 0.06, 0.2, 0.035, 85, 26);
    const snout = blob(furShade, 0.27, 0.88, 0.68, 1.5, 0, -0.15, 0.34, 0.035, 83, 26);
    const snoutTip = blob(furShade, 0.17, 0.9, 0.62, 1.0, 0, -0.14, 0.6, 0.025, 84, 20);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 10), black);
    nose.scale.set(1, 0.78, 0.9);
    nose.position.set(0, -0.01, 0.74);
    const jawGrp = new THREE.Group();
    jawGrp.position.set(0, -0.2, 0.36);
    const jaw = blob(furShade, 0.2, 0.9, 0.55, 1.1, 0, -0.05, 0.22, 0.025, 87, 22);
    jawGrp.add(jaw);
    const glintMat = std(0xffffff, { roughness: 0.2, env: 1 });
    for (const s of [-1, 1]) {
      const socket = blob(furShade, 0.1, 1.15, 0.7, 0.85, 0.2 * s, 0.12, 0.46, 0.015, 89 + s, 16);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), black);
      eye.position.set(0.2 * s, 0.14, 0.52);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), glintMat);
      glint.position.set(0.225 * s, 0.17, 0.55);
      const ear = blob(fur, 0.15, 1.0, 0.9, 1.0, 0.4 * s, 0.36, -0.06, 0.02, 95 + s, 16);
      const earIn = blob(inner, 0.07, 1.0, 0.8, 1.0, 0.42 * s, 0.33, -0.1, 0, 97 + s, 10);
      headGrp.add(socket, eye, glint, ear, earIn);
    }
    headGrp.add(skull, bridge, snout, snoutTip, nose, jawGrp);
    bodyGrp.add(headGrp);

    root.scale.setScalar(1);
    return {
      group: root,
      refs: {
        bodyGrp, headGrp, jawGrp, legFL, legFR, legBL, legBR, armL: legFL, armR: legFR, tail, head: skull
      }
    };
  }

  /* ================= 企鹅 ================= */
  function buildPenguin(typeId) {
    const C = PENGUIN_CFG[typeId] || PENGUIN_CFG.adelie;
    const s = C.scale || 1;
    const bodyCol = C.bodyColor || 0x20262e;
    const bellyCol = C.bellyColor || 0xf5f7f9;
    const beakCol = C.beakColor || 0xffa53e;
    const bodyMat = std(bodyCol, { roughness: 0.72, env: 0.3 });
    const bellyMat = std(bellyCol, { roughness: 0.55, env: 0.4 });
    const beakMat = std(beakCol, { roughness: 0.45, env: 0.5 });
    const darkMat = std(0x15181e, { roughness: 0.6, env: 0.35 });

    const root = new THREE.Group();
    const bodyGrp = new THREE.Group();
    root.add(bodyGrp);

    // 身体（蛋形）
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 26, 20), bodyMat);
    body.scale.set(1, 1.14, 0.78);
    body.position.set(0, 0.74, 0);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.4, 22, 16), bellyMat);
    belly.scale.set(1.06, 1.02, 0.62);
    belly.position.set(0, 0.7, 0.27);
    bodyGrp.add(body, belly);

    // 头
    const headGrp = new THREE.Group();
    headGrp.position.set(0, 1.28, 0.1);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 22, 18), bodyMat);
    head.scale.set(1, 0.98, 0.92);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.28, 8), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.05, 0.3);
    const beakLow = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 8), std(0xe08a2e, { roughness: 0.5, env: 0.4 }));
    beakLow.rotation.x = Math.PI / 2;
    beakLow.position.set(0, -0.12, 0.26);
    headGrp.add(head, beak, beakLow);

    const eyeCol = C.eyeColor || 0xffffff;
    for (const sd of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), std(eyeCol, { roughness: 0.25, env: 0.8 }));
      eye.position.set(0.12 * sd, 0.08, 0.28);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), darkMat);
      pupil.position.set(0.14 * sd, 0.08, 0.34);
      headGrp.add(eye, pupil);
    }
    bodyGrp.add(headGrp);

    // 鳍
    function makeFlipper(sd) {
      const g = new THREE.Group();
      g.position.set(0.4 * sd, 0.98, 0.14);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.05), bodyMat);
      fl.position.y = -0.2;
      g.rotation.z = 0.32 * sd;
      g.add(fl);
      return g;
    }
    const flipperL = makeFlipper(-1);
    const flipperR = makeFlipper(1);
    bodyGrp.add(flipperL, flipperR);

    // 脚
    function makeFoot(sd) {
      const g = new THREE.Group();
      g.position.set(0.17 * sd, 0.07, 0.14);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.24), beakMat);
      foot.rotation.y = 0.15 * sd;
      g.add(foot);
      return g;
    }
    const footL = makeFoot(-1);
    const footR = makeFoot(1);
    bodyGrp.add(footL, footR);

    // ============ 兵种配件 ============
    const acc = {};
    const metalMat = std(0x9aa3ad, { roughness: 0.42, metalness: 0.7, env: 0.8 });
    const goldMat = std(0xf5c542, { roughness: 0.35, metalness: 0.85, env: 1.0 });

    if (typeId === 'chick') {
      const fluff = std(0x555c66, { roughness: 0.95 });
      for (const sd of [-1, 1]) {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), fluff);
        tuft.position.set(0.2 * sd, 1.62, 0.05);
        bodyGrp.add(tuft);
      }
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), fluff);
      tuft.position.set(0, 1.66, 0.02);
      bodyGrp.add(tuft);
    }
    if (typeId === 'rockhopper') {
      for (const sd of [-1, 1]) {
        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 6), std(0xf6c445, { roughness: 0.5, env: 0.5 }));
        crest.position.set(0.13 * sd, 1.5, 0.0);
        crest.rotation.z = -0.55 * sd;
        headGrp.add(crest);
      }
    }
    if (typeId === 'adelie') {
      for (const sd of [-1, 1]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 6, 14), std(0xf3f6f8, { roughness: 0.4, env: 0.6 }));
        ring.position.set(0.12 * sd, 0.09, 0.27);
        ring.rotation.x = 0.5;
        headGrp.add(ring);
      }
    }
    if (typeId === 'thrower') {
      const quiverMat = std(0x6b7280, { roughness: 0.8, env: 0.3 });
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 6), quiverMat);
        spike.position.set((i - 1) * 0.1, 1.35 + i * 0.12, -0.28 - i * 0.05);
        spike.rotation.x = 0.35;
        bodyGrp.add(spike);
      }
      const held = makeIceShard();
      held.scale.setScalar(0.55);
      held.position.set(0.32, -0.32, 0.26);
      held.rotation.x = -1.4;
      held.rotation.z = -0.5;
      flipperR.add(held);
      acc.heldShard = held;
    }
    if (typeId === 'armored') {
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), metalMat);
      helm.position.set(0, 1.46, 0.1);
      headGrp.add(helm);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.46, 0.42), metalMat);
      plate.position.set(0, 0.92, -0.04);
      bodyGrp.add(plate);
      for (const sd of [-1, 1]) {
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), metalMat);
        pad.position.set(0.55 * sd, 1.1, 0.04);
        bodyGrp.add(pad);
      }
    }
    if (typeId === 'diver') {
      for (const sd of [-1, 1]) {
        const goggle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.035, 8, 14), std(0x2b3440, { roughness: 0.3, metalness: 0.4, env: 0.8 }));
        goggle.position.set(0.12 * sd, 0.09, 0.3);
        goggle.rotation.x = 0.35;
        headGrp.add(goggle);
      }
      footL.scale.set(1.6, 1, 1.5);
      footR.scale.set(1.6, 1, 1.5);
    }
    if (typeId === 'healer') {
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.05), std(0xf0f2f4, { roughness: 0.6 }));
      crossH.position.set(0, 0.78, 0.48);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.05), std(0xf0f2f4, { roughness: 0.6 }));
      crossV.position.set(0, 0.78, 0.48);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), std(0xffffff, { roughness: 0.6 }));
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.42, 0.92, 0.18);
      arm.rotation.x = -0.4;
      bodyGrp.add(crossH, crossV, arm);
    }
    if (typeId === 'bomber') {
      acc.chargeLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10),
        std(0xff3322, { emissive: 0xff3322, emissiveIntensity: 0.7, roughness: 0.4, env: 0.5 }));
      acc.chargeLight.position.set(0, 0.62, 0.42);
      bodyGrp.add(acc.chargeLight);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 8, 18), std(0x2b2f36, { roughness: 0.7 }));
      band.position.set(0, 0.9, 0.05);
      bodyGrp.add(band);
    }
    if (typeId === 'sniper') {
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 10), std(0x23272e, { roughness: 0.3, metalness: 0.6, env: 0.7 }));
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.05, 0.22);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), std(0x8fd8ff, { emissive: 0x2f7fd6, emissiveIntensity: 0.7, roughness: 0.2, env: 1 }));
      lens.rotation.y = Math.PI / 2;
      lens.position.set(0, 0.05, 0.54);
      const topScope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), std(0x23272e, { roughness: 0.3, metalness: 0.6, env: 0.7 }));
      topScope.position.set(0, 0.24, 0.24);
      topScope.rotation.x = Math.PI / 2;
      headGrp.add(scope, lens, topScope);
      acc.scope = scope;
    }
    if (typeId === 'elite') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.18, 14), std(0x27374d, { roughness: 0.6, env: 0.4 }));
      cap.position.set(0, 1.55, 0.1);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.05, 14), darkMat);
      brim.position.set(0, 1.46, 0.1);
      headGrp.add(cap, brim);
      for (const sd of [-1, 1]) {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.24), goldMat);
        ep.position.set(0.42 * sd, 1.14, 0.12);
        bodyGrp.add(ep);
      }
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16), std(0xb5282f, { roughness: 0.6, env: 0.3 }));
      band.position.set(0, 0.66, 0.05);
      bodyGrp.add(band);
    }
    if (typeId === 'wizard') {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 12), std(0x3a5bbf, { roughness: 0.5, env: 0.5 }));
      hat.position.set(0, 1.72, 0.08);
      hat.rotation.z = 0.08;
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.34, 0.05, 14), std(0x33509f, { roughness: 0.5, env: 0.5 }));
      brim.position.set(0, 1.46, 0.08);
      headGrp.add(hat, brim);
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), std(0x6b4a2b, { roughness: 0.8, env: 0.3 }));
      staff.position.set(0.34, -0.45, 0.3);
      staff.rotation.z = -0.12;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), std(0x46e0ff, { emissive: 0x37c8ff, emissiveIntensity: 0.9, roughness: 0.15, env: 1 }));
      gem.position.set(0.34, 0.02, 0.3);
      flipperR.add(staff, gem);
      acc.staff = staff; acc.gem = gem;
    }
    if (typeId === 'colossus') {
      root.scale.setScalar(2.7);
      bodyGrp.scale.y = 1.12;
      const rockMat = std(0x8f979e, { roughness: 0.92, env: 0.2 });
      for (const sd of [-1, 1]) {
        const sh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), rockMat);
        sh.position.set(0.68 * sd, 1.22, 0.0);
        sh.rotation.set(Math.random(), Math.random(), Math.random());
        bodyGrp.add(sh);
      }
      const back = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), rockMat);
      back.position.set(0, 1.35, -0.5);
      bodyGrp.add(back);
      acc.glowingEyes = [];
      for (const sd of [-1, 1]) {
        const gl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), std(0xff2a1a, { emissive: 0xff2a1a, emissiveIntensity: 1.4, roughness: 0.2 }));
        gl.position.set(0.09 * sd, 0.1, 0.36);
        headGrp.add(gl);
        acc.glowingEyes.push(gl);
      }
    }
    if (typeId === 'assassin') {
      bodyMat.color.setHex(0x10141a);
      bellyMat.color.setHex(0x2a3340);
      const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.28), std(0x8f1f2a, { roughness: 0.75, env: 0.3 }));
      scarf.position.set(0, 1.12, 0.14);
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.05), darkMat);
      mask.position.set(0, 0.1, 0.33);
      headGrp.add(mask);
      bodyGrp.add(scarf);
    }
    if (typeId === 'ancient') {
      bodyMat.color.setHex(0x8ec6e4);
      bodyMat.emissive.setHex(0x1d5f8c);
      bodyMat.emissiveIntensity = 0.25;
      bellyMat.color.setHex(0xd8f0fa);
      const iceSpikeMat = std(0xbde9ff, { roughness: 0.2, env: 1, emissive: 0x2f7fd6, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 });
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 6), iceSpikeMat);
        spike.position.set((i - 2) * 0.16, 1.5 + Math.abs(i - 2) * 0.12, -0.28 - i * 0.02);
        spike.rotation.x = 0.5;
        bodyGrp.add(spike);
      }
      for (const sd of [-1, 1]) {
        const shard = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 6), iceSpikeMat);
        shard.position.set(0.14 * sd, 1.55, 0.06);
        headGrp.add(shard);
      }
      const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), std(0xa8dcff, { roughness: 0.15, env: 1, transparent: true, opacity: 0.7, emissive: 0x2f7fd6, emissiveIntensity: 0.35 }));
      shield.position.set(0.4, -0.35, 0.24);
      shield.scale.set(1.5, 1.8, 1.2);
      flipperR.add(shield);
      acc.shield = shield;
    }
    if (typeId === 'king') {
      root.scale.setScalar(2.0);
      bodyGrp.scale.y = 1.08;
      bellyMat.color.setHex(0xf5c542);
      bellyMat.metalness = 0.7;
      bellyMat.roughness = 0.3;
      bellyMat.envMapIntensity = 0.8;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.16, 12), goldMat);
      crown.position.set(0, 1.56, 0.1);
      headGrp.add(crown);
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 6), goldMat);
        tip.position.set(Math.cos(a) * 0.24, 1.66, 0.1 + Math.sin(a) * 0.24);
        headGrp.add(tip);
      }
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.07), std(0x8f1f2a, { roughness: 0.7, env: 0.35 }));
      cape.position.set(0, 0.82, -0.44);
      cape.rotation.x = 0.08;
      bodyGrp.add(cape);
      acc.glowingEyes = [];
      for (const sd of [-1, 1]) {
        const gl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), std(0xffb020, { emissive: 0xffa000, emissiveIntensity: 1.2, roughness: 0.2 }));
        gl.position.set(0.09 * sd, 0.09, 0.36);
        headGrp.add(gl);
        acc.glowingEyes.push(gl);
      }
    }

    root.scale.multiplyScalar(s);
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return {
      group: root,
      refs: { bodyGrp, headGrp, flipperL, flipperR, footL, footR, beak, acc }
    };
  }

  const PENGUIN_CFG = {
    chick: { scale: 0.52, bodyColor: 0x4a5058, bellyColor: 0x6d747e, beakColor: 0xffb45a },
    rockhopper: { scale: 0.92, bodyColor: 0x16191e, bellyColor: 0xf2f5f8, beakColor: 0xff8c2e, eyeColor: 0xff5a4a },
    adelie: { scale: 1.0, bodyColor: 0x14171b, bellyColor: 0xf5f7f9, beakColor: 0xff9c35 },
    thrower: { scale: 1.0, bodyColor: 0x171b21, bellyColor: 0xecf1f5, beakColor: 0xff9c35 },
    armored: { scale: 1.18, bodyColor: 0x15181e, bellyColor: 0xdde4ea, beakColor: 0xffa53e },
    diver: { scale: 1.05, bodyColor: 0x131c26, bellyColor: 0xddeef7, beakColor: 0xff9c35 },
    healer: { scale: 1.0, bodyColor: 0x1d2228, bellyColor: 0xf7f9fb, beakColor: 0xffa53e },
    bomber: { scale: 0.95, bodyColor: 0x1a1e24, bellyColor: 0x2a2e34, beakColor: 0xff9c35 },
    sniper: { scale: 1.1, bodyColor: 0x151a20, bellyColor: 0xdfe7ee, beakColor: 0xffa53e },
    elite: { scale: 1.2, bodyColor: 0x141a24, bellyColor: 0xf0f4f8, beakColor: 0xffa53e },
    wizard: { scale: 1.12, bodyColor: 0x1b2334, bellyColor: 0xdce4f5, beakColor: 0xffa53e },
    colossus: { scale: 1.0, bodyColor: 0x22262c, bellyColor: 0xb8c0c8, beakColor: 0xff8c2e, eyeColor: 0xff2a1a },
    assassin: { scale: 1.02, bodyColor: 0x10141a, bellyColor: 0x2a3340, beakColor: 0x8a949e, eyeColor: 0x8fe3ff },
    ancient: { scale: 1.2, bodyColor: 0x8ec6e4, bellyColor: 0xd8f0fa, beakColor: 0x9adcff, eyeColor: 0x9fe8ff },
    king: { scale: 1.0, bodyColor: 0x141a22, bellyColor: 0xf5c542, beakColor: 0xffb020, eyeColor: 0xffb020 }
  };

  /* ================= 地形 ================= */
  function heightFunc(x, z) {
    let h = fbm(x * 0.009 + 3.7, z * 0.009 - 1.2, 4, 11) * 7.5;
    h += fbm(x * 0.042, z * 0.042, 3, 23) * 1.5;
    h += (Math.sin(x * 0.021) + Math.cos(z * 0.017)) * 0.9;
    const d = Math.hypot(x, z);
    h *= smoothstep(26, 54, d);
    // 冰裂缝
    const crevasse = Math.abs(Math.sin(x * 0.31 + fbm(x * 0.02, z * 0.02, 2, 8) * 4) * 2.4) - 1.9;
    if (d > 34 && crevasse > 0) h -= crevasse * 1.6;
    return h;
  }

  function buildTerrain() {
    const SIZE = 620, SEG = 230;
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cIce = new THREE.Color(0x9fd8ee);
    const cSnow = new THREE.Color(0xf4f6fa);
    const cRock = new THREE.Color(0x9aa4ae);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = heightFunc(x, z);
      pos.setY(i, h);
      const n = fbm(x * 0.08, z * 0.08, 2, 55);
      tmp.copy(cSnow).lerp(cIce, Math.max(0, Math.min(1, (1.2 - h) * 0.55)) * (0.7 + n * 0.3));
      if (h > 5) tmp.lerp(cRock, Math.min(1, (h - 5) * 0.28));
      tmp.multiplyScalar(0.93 + n * 0.14);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02, envMapIntensity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;

    // 冻结湖面
    const lakes = [];
    const rng = mulberry32(20260701);
    let tried = 0;
    while (lakes.length < 6 && tried < 80) {
      tried++;
      const a = rng() * Math.PI * 2;
      const d = 30 + rng() * 55;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = heightFunc(x, z);
      if (h > -0.2 && h < 1.4) {
        const r = 3 + rng() * 6;
        const lake = new THREE.Mesh(
          new THREE.CircleGeometry(r, 30),
          new THREE.MeshStandardMaterial({ color: 0x8fd0e8, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.92, envMapIntensity: 0.9 })
        );
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(x, h + 0.035, z);
        lakes.push({ mesh: lake, x, z, r, h });
      }
    }
    return { mesh, heightFunc, lakes };
  }

  /* ================= 场景布置 ================= */
  function buildScenery(terrain) {
    const group = new THREE.Group();
    const rng = mulberry32(8848);
    const colliders = [];

    // 远山
    const rockGeo = new THREE.ConeGeometry(1, 1, 7);
    const snowGeo = new THREE.ConeGeometry(1, 1, 7);
    const rockMat = std(0x87929c, { roughness: 0.95, env: 0.15, flat: true });
    const snowCapMat = std(0xf2f5f9, { roughness: 0.9, env: 0.3 });
    const MT = 26;
    const mtnRock = new THREE.InstancedMesh(rockGeo, rockMat, MT);
    const mtnSnow = new THREE.InstancedMesh(snowGeo, snowCapMat, MT);
    const mtx = new THREE.Matrix4();
    const mtx2 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < MT; i++) {
      const a = i / MT * Math.PI * 2 + rng() * 0.2;
      const d = 255 + rng() * 95;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = 35 + rng() * 85;
      const w = 18 + rng() * 30;
      const groundY = terrain.heightFunc(x, z);
      p.set(x, groundY + h / 2 - 2, z);
      q.setFromEuler(new THREE.Euler(rng() * 0.05, rng() * Math.PI * 2, rng() * 0.05));
      sc.set(w, h, w);
      mtx.compose(p, q, sc);
      mtnRock.setMatrixAt(i, mtx);
      p.y += h * 0.36;
      sc.set(w * 0.56, h * 0.16, w * 0.56);
      mtx2.compose(p, q, sc);
      mtnSnow.setMatrixAt(i, mtx2);
    }
    mtnRock.instanceMatrix.needsUpdate = true;
    mtnSnow.instanceMatrix.needsUpdate = true;
    mtnRock.receiveShadow = true;
    group.add(mtnRock, mtnSnow);

    // 冰山
    const iceGeo = new THREE.IcosahedronGeometry(1, 1);
    const iceMat = std(0xbfe8f8, { roughness: 0.28, env: 0.85, transparent: true, opacity: 0.9 });
    const N_ICE = 14;
    const icebergs = new THREE.InstancedMesh(iceGeo, iceMat, N_ICE);
    for (let i = 0; i < N_ICE; i++) {
      const a = rng() * Math.PI * 2;
      const d = 70 + rng() * 130;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = terrain.heightFunc(x, z);
      const ry = 4 + rng() * 12;
      const rx = 3 + rng() * 7;
      p.set(x, h + ry / 2, z);
      q.setFromEuler(new THREE.Euler(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3));
      sc.set(rx, ry, rx);
      mtx.compose(p, q, sc);
      icebergs.setMatrixAt(i, mtx);
      colliders.push({ x, z, r: rx * 0.7 });
    }
    icebergs.instanceMatrix.needsUpdate = true;
    group.add(icebergs);

    // 岩石
    const rockGeo2 = new THREE.DodecahedronGeometry(1, 0);
    const rockMat2 = std(0xb9c2ca, { roughness: 0.95, env: 0.2, flat: true });
    const N_ROCK = 70;
    const rocks = new THREE.InstancedMesh(rockGeo2, rockMat2, N_ROCK);
    for (let i = 0; i < N_ROCK; i++) {
      const a = rng() * Math.PI * 2;
      const d = 8 + rng() * 120;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = terrain.heightFunc(x, z);
      const s = 0.4 + rng() * 1.5;
      p.set(x, h + s * 0.35, z);
      q.setFromEuler(new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI));
      sc.set(s, s * (0.6 + rng() * 0.6), s);
      mtx.compose(p, q, sc);
      rocks.setMatrixAt(i, mtx);
      colliders.push({ x, z, r: s * 0.82 });
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.receiveShadow = true;
    group.add(rocks);

    // 冰晶
    const cryGeo = new THREE.OctahedronGeometry(1, 0);
    const cryMat = std(0xcfefff, { roughness: 0.15, env: 1, emissive: 0x2f7fd6, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
    const N_CRY = 90;
    const crystals = new THREE.InstancedMesh(cryGeo, cryMat, N_CRY);
    for (let i = 0; i < N_CRY; i++) {
      const a = rng() * Math.PI * 2;
      const d = 6 + rng() * 130;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = terrain.heightFunc(x, z);
      const s = 0.35 + rng() * 1.1;
      p.set(x, h + s * 0.85, z);
      q.setFromEuler(new THREE.Euler(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3));
      sc.set(s * 0.55, s * 1.7, s * 0.55);
      mtx.compose(p, q, sc);
      crystals.setMatrixAt(i, mtx);
      colliders.push({ x, z, r: s * 0.34 });
    }
    crystals.instanceMatrix.needsUpdate = true;
    group.add(crystals);

    // 雪屋
    const iglooMat = std(0xf2f6fa, { roughness: 0.85, env: 0.35 });
    for (let k = 0; k < 3; k++) {
      const a = rng() * Math.PI * 2;
      const d = 62 + rng() * 35;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = terrain.heightFunc(x, z);
      const ig = new THREE.Group();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), iglooMat);
      dome.position.y = 0.1;
      const door = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.45, 8, 16, Math.PI), std(0x8fb4cc, { roughness: 0.7, env: 0.5 }));
      door.rotation.y = Math.PI / 2;
      door.rotation.x = Math.PI / 2;
      door.position.set(0, 0.1, 3.7);
      ig.add(dome, door);
      ig.position.set(x, h - 0.2, z);
      ig.rotation.y = rng() * Math.PI * 2;
      const igScale = 1 + rng() * 0.4;
      ig.scale.setScalar(igScale);
      group.add(ig);
      colliders.push({ x, z, r: 4.2 * igScale * 0.94 });
    }

    // 云
    const cloudTex = makeCloudTexture();
    const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false });
    const clouds = [];
    for (let i = 0; i < 10; i++) {
      const sp = new THREE.Sprite(cloudMat.clone());
      sp.material.opacity = 0.3 + rng() * 0.25;
      const a = rng() * Math.PI * 2;
      const d = 120 + rng() * 260;
      sp.position.set(Math.cos(a) * d, 60 + rng() * 60, Math.sin(a) * d);
      const sc = 45 + rng() * 55;
      sp.scale.set(sc * 1.7, sc * 0.7, 1);
      clouds.push(sp);
      group.add(sp);
    }
    return { group, clouds, colliders };
  }

  /* ================= 天空与极光 ================= */
  function buildSky() {
    const geo = new THREE.SphereGeometry(720, 32, 20);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x0d2f55) },
        horColor: { value: new THREE.Color(0xbfe2f2) },
        sunDir: { value: new THREE.Vector3(0.4, 0.5, 0.35).normalize() },
        sunIntensity: { value: 1.0 },
        night: { value: 0.0 }
      },
      vertexShader: [
        'varying vec3 vWorld;',
        'void main(){ vWorld = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor; uniform vec3 horColor; uniform vec3 sunDir; uniform float sunIntensity; uniform float night;',
        'varying vec3 vWorld;',
        'void main(){',
        '  vec3 dir = normalize(vWorld);',
        '  float h = clamp(dir.y, -0.15, 1.0);',
        '  vec3 col = mix(horColor, topColor, pow(h, 0.55));',
        '  float sun = pow(max(dot(dir, sunDir), 0.0), 300.0) * 8.0 * sunIntensity;',
        '  float glow = pow(max(dot(dir, sunDir), 0.0), 14.0) * 0.65 * sunIntensity;',
        '  col += vec3(1.0, 0.9, 0.72) * (sun + glow);',
        '  col = mix(col, vec3(0.02,0.04,0.09), night * smoothstep(0.0,0.4,h));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return mesh;
  }

  function buildAurora() {
    const geo = new THREE.SphereGeometry(560, 48, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0.0 }
      },
      vertexShader: [
        'varying vec3 vDir;',
        'void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
      ].join('\n'),
      fragmentShader: [
        'uniform float time; uniform float intensity;',
        'varying vec3 vDir;',
        'void main(){',
        '  float ang = atan(vDir.z, vDir.x);',
        '  float fade = smoothstep(0.06, 0.35, vDir.y) * (1.0 - smoothstep(0.42, 0.75, vDir.y));',
        '  float band = sin(ang * 3.0 + vDir.y * 9.0 + time * 0.28);',
        '  float ribbon = sin(ang * 7.0 - time * 0.5) * 0.5 + 0.5;',
        '  float a = fade * smoothstep(0.25, 0.95, band * ribbon) * intensity;',
        '  vec3 col = mix(vec3(0.25, 1.0, 0.55), vec3(0.4, 0.75, 1.0), ribbon);',
        '  gl_FragColor = vec4(col * a, a * 0.8);',
        '}'
      ].join('\n')
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    return mesh;
  }

  function buildSnowParticles(count) {
    count = count || 2400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rng = mulberry32(99);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() * 2 - 1) * 380;
      pos[i * 3 + 1] = rng() * 150;
      pos[i * 3 + 2] = (rng() * 2 - 1) * 380;
      vel[i * 3] = (rng() - 0.5) * 2;
      vel[i * 3 + 1] = -(0.8 + rng() * 1.6);
      vel[i * 3 + 2] = (rng() - 0.5) * 2;
      const b = 0.75 + rng() * 0.25;
      col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = 1;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.55, map: makeSnowflakeTexture(), transparent: true, opacity: 0.9,
      depthWrite: false, vertexColors: true, sizeAttenuation: true
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return { points, pos, vel, count, mat };
  }

  window.Models = {
    fbm, smoothstep, mulberry32,
    std,
    makeSoftTexture, makeSnowflakeTexture,
    makeRing, makeDisc, makeBeam, makeGlow, makeIceShard, makeBoulder, makeDropPod,
    buildBear, buildPenguin, PENGUIN_CFG,
    heightFunc, buildTerrain, buildScenery, buildSky, buildAurora, buildSnowParticles
  };
})();
