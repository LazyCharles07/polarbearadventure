/* 极地风暴 - 游戏主逻辑 */
(function () {
  'use strict';

  /* ================= 数据配置 ================= */
  const ENEMY_TYPES = {
    chick:     { name: '企鹅幼崽', icon: '🐣', hp: 26, spd: 3.1, dmg: 5,  atkRange: 1.15, atkCd: 1.7, xp: 10, desc: '懵懂的小企鹅，刚刚学会挥舞树枝。' },
    rockhopper:{ name: '跳岩企鹅', icon: '🐧', hp: 50, spd: 4.7, dmg: 8,  atkRange: 1.25, atkCd: 1.5, xp: 16, jump: true, desc: '发际线狂野的岩石舞者，喜欢用头顶攻击。' },
    adelie:    { name: '阿德利突击兵', icon: '🛷', hp: 60, spd: 5.3, dmg: 10, atkRange: 1.3, atkCd: 1.4, xp: 20, slide: true, desc: '肚皮滑铲冲锋，速度极快的平头哥。' },
    thrower:   { name: '冰刺投掷手', icon: '🗡️', hp: 66, spd: 3.1, dmg: 12, atkRange: 17, atkCd: 3.1, xp: 26, ranged: true, desc: '远距离抛射冰刺，注意红色落点提示。' },
    armored:   { name: '铁壁装甲兵', icon: '🛡️', hp: 160, spd: 2.7, dmg: 14, atkRange: 1.4, atkCd: 2.0, xp: 34, armor: 0.6, desc: '披挂冰铁重甲，只受到六成伤害。' },
    diver:     { name: '深海突袭者', icon: '🤿', hp: 85, spd: 6.3, dmg: 12, atkRange: 1.25, atkCd: 2.2, xp: 38, burrow: true, desc: '潜入雪下潜行，从你脚下突然钻出。' },
    healer:    { name: '医疗企鹅', icon: '⛑️', hp: 75, spd: 3.0, dmg: 6,  atkRange: 1.0, atkCd: 2.0, xp: 42, healer: true, desc: '为受伤的同伴持续治疗，务必优先击杀！' },
    bomber:    { name: '自爆企鹅', icon: '💥', hp: 45, spd: 7.0, dmg: 30, atkRange: 2.0, atkCd: 0.8, xp: 45, bomber: true, desc: '接近后自爆，威力巨大但非常脆弱。' },
    sniper:    { name: '冰晶狙击手', icon: '🔭', hp: 80, spd: 2.4, dmg: 25, atkRange: 26, atkCd: 4.2, xp: 50, beam: true, desc: '蓄力后射出贯穿光束，提前画出瞄准线。' },
    elite:     { name: '精英队长', icon: '🎖️', hp: 250, spd: 4.1, dmg: 16, atkRange: 1.6, atkCd: 1.6, xp: 70, buff: true, desc: '会咆哮鼓舞周围企鹅，提升攻击力。' },
    wizard:    { name: '寒冰法师', icon: '🔮', hp: 165, spd: 3.0, dmg: 14, atkRange: 19, atkCd: 2.7, xp: 80, magic: true, desc: '挥洒扇形冰晶，并制造减速寒气。' },
    colossus:  { name: '巨像企鹅', icon: '🗿', hp: 680, spd: 1.5, dmg: 22, atkRange: 2.3, atkCd: 2.7, xp: 130, slam: true, desc: '双拳砸地，造成大范围震击与眩晕。' },
    assassin:  { name: '极夜刺客', icon: '🌑', hp: 195, spd: 8.0, dmg: 15, atkRange: 1.4, atkCd: 1.8, xp: 100, stealth: true, desc: '半透明的潜行杀手，背刺伤害翻倍。' },
    ancient:   { name: '远古冰封守卫', icon: '🧊', hp: 980, spd: 1.9, dmg: 26, atkRange: 2.0, atkCd: 2.9, xp: 180, regen: true, freeze: true, desc: '坚冰护甲缓慢修复，身边寒气持续减速。' },
    king:      { name: '企鹅王', icon: '👑', hp: 2600, spd: 3.4, dmg: 30, atkRange: 2.7, atkCd: 2.1, xp: 600, boss: true, desc: '南极暴君，拥有滑铲、冰息、召唤与暴风雪多阶段战斗。' }
  };

  const LEVELS = [
    { name: '初入冰原', line: '空投成功。幼崽们气势汹汹地围了上来', waves: [{ chick: 3 }, { chick: 4 }, { chick: 5 }] },
    { name: '跳岩来客', line: '岩石上蹦下一群发型狂野的企鹅', waves: [{ chick: 3, rockhopper: 2 }, { rockhopper: 4 }, { chick: 3, rockhopper: 4 }] },
    { name: '突击小队', line: '阿德利突击兵发起了滑铲冲锋', waves: [{ rockhopper: 3, adelie: 2 }, { adelie: 4 }, { rockhopper: 2, adelie: 5 }] },
    { name: '冰刺横飞', line: '远处的投掷手正在准备冰刺弹幕', waves: [{ adelie: 3, thrower: 2 }, { thrower: 3, adelie: 3 }, { adelie: 4, thrower: 3, rockhopper: 2 }] },
    { name: '钢铁防线', line: '身披重甲的企鹅军团列阵而来', waves: [{ thrower: 3, armored: 1 }, { armored: 2, adelie: 3 }, { armored: 2, thrower: 3, adelie: 3 }] },
    { name: '深海突袭', line: '海豹突击队……不对，是潜水企鹅！', waves: [{ armored: 2, diver: 2 }, { diver: 3, adelie: 3 }, { armored: 3, diver: 3, thrower: 2 }] },
    { name: '医疗后援', line: '带红十字的企鹅开始救治伤员', waves: [{ diver: 2, healer: 1, adelie: 3 }, { armored: 2, healer: 2, thrower: 2 }, { diver: 2, healer: 2, armored: 2 }] },
    { name: '自爆军团', line: '腹部闪着红光的企鹅疯狂冲向了你', waves: [{ bomber: 3, adelie: 3 }, { bomber: 4, armored: 2 }, { bomber: 5, healer: 1 }] },
    { name: '冰晶狙击', line: '山顶上架起了狙击镜，瞄准线正在逼近', waves: [{ sniper: 2, adelie: 4 }, { sniper: 3, bomber: 2 }, { sniper: 3, armored: 3, healer: 1 }] },
    { name: '精英登场', line: '带着勋章的精英队长咆哮着加入了战场', waves: [{ elite: 1, sniper: 2, adelie: 3 }, { elite: 1, bomber: 3, thrower: 2 }, { elite: 2, sniper: 2, healer: 1 }] },
    { name: '寒冰法师', line: '冰蓝色的法阵亮起，法师挥动法杖', waves: [{ wizard: 2, elite: 1, adelie: 3 }, { wizard: 2, bomber: 3 }, { wizard: 3, elite: 1, sniper: 2 }] },
    { name: '巨像降临', line: '大地在震颤——巨像企鹅来了', waves: [{ colossus: 1, thrower: 3 }, { colossus: 1, wizard: 2 }, { colossus: 1, elite: 1, bomber: 3 }] },
    { name: '极夜暗杀', line: '极夜降临，刺客们在阴影中逼近', waves: [{ assassin: 2, wizard: 2 }, { assassin: 3, sniper: 2 }, { assassin: 2, elite: 2, colossus: 1 }] },
    { name: '远古守卫', line: '古老的冰封守卫从冰川中苏醒', waves: [{ ancient: 1, wizard: 2, assassin: 2 }, { ancient: 1, colossus: 1, healer: 2 }, { ancient: 2, elite: 1, assassin: 2 }] },
    { name: '企鹅王座', line: '王座之上，企鹅王缓缓起身', waves: [{ king: 1 }], boss: true }
  ];

  const SKILL_DEFS = [
    { id: 'claw', name: '利爪连击', icon: '🐾', key: '左键', maxLv: 3, unlockLv: 0,
      desc: l => `三段连击，倍率 ${[1, 1.18, 1.4][l] || 1}，第 2/3 段附带小幅突进。` },
    { id: 'breath', name: '冰霜吐息', icon: '❄️', key: '1', maxLv: 3, unlockLv: 0,
      desc: l => `前方锥形冰息：${[1.3, 1.7, 2.1][l] || 1.3} 倍伤害，减速 ${[35, 45, 55][l] || 35}% 持续 3 秒。` },
    { id: 'pounce', name: '极地猛扑', icon: '🐻', key: '2', maxLv: 3, unlockLv: 0,
      desc: l => `向前猛扑着陆：${[1.7, 2.1, 2.5][l] || 1.7} 倍范围伤害并击退。` },
    { id: 'roar', name: '咆哮威吓', icon: '📢', key: '3', maxLv: 3, unlockLv: 0,
      desc: l => `震慑周围敌人 ${[1.2, 1.6, 2.0][l] || 1.2} 秒，并使其攻击降低 20%。` },
    { id: 'armor', name: '冰晶护甲', icon: '🧊', key: '4', maxLv: 3, unlockLv: 0,
      desc: l => `获得 ${[18, 26, 34][l] || 18}% 最大生命值的护盾，攻击提高 ${[8, 12, 16][l] || 8}%。` },
    { id: 'avalanche', name: '雪崩召唤', icon: '⛰️', key: '5', maxLv: 3, unlockLv: 10,
      desc: l => `召唤雪崩碾碎一切：${[4.5, 5.5, 6.5][l] || 4.5} 倍大范围伤害。（通关第 10 关解锁）` }
  ];
  const SKILL_LVLS = {
    claw: { cd: 0, energy: 0, range: 2.8 },
    breath: { cd: [6, 5.2, 4.5][0] && [6, 5.2, 4.5], energy: [22, 24, 26], range: [7, 8, 9] },
    pounce: { cd: [8, 7, 6], energy: [26, 28, 30], range: [9, 11, 13], radius: [3.5, 4, 4.5] },
    roar: { cd: [14, 12, 11], energy: [30, 32, 34], radius: [5.5, 6.5, 7.5] },
    armor: { cd: [16, 14, 12], energy: [28, 30, 32] },
    avalanche: { cd: [60, 50, 45], energy: [70, 75, 80], radius: [13, 15, 17] }
  };

  const GRAVITY = 27;
  const ARENA_R = 56;
  const SAVE_KEY = 'polar_storm_save_v1';
  // 临时模式：开放全部 15 关（设为 false 恢复按进度解锁）
  const ALL_LEVELS_OPEN = true;
  // 企鹅攻击力基础倍率
  const ENEMY_ATK_MULT = 2.5;
  // 伤害削减：普通关再降 50%，Boss 关再降 60%
  const ATK_DMG_NORMAL = 0.5;
  const ATK_DMG_BOSS = 0.4;
  // 攻击速度倍率（+30% 攻速 = 冷却/前摇 ×0.7）
  const ATK_SPEED_FACTOR = 0.7;
  // 攻击概率（1.0 = 就绪后必定攻击；0.7 = 概率降低 30%）
  const ATK_CHANCE = 0.7;

  function xpNeed(level) { return Math.floor(40 * Math.pow(level, 1.6)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randi(a, b) { return Math.floor(rand(a, b + 1)); }

  /* ================= 主类 ================= */
  class Game {
    constructor() {
      this.state = 'menu';
      this.levelIndex = 0;
      this.enemies = [];
      this.projectiles = [];
      this.drops = [];
      this.effects = [];
      this.particles = null;
      this.keys = {};
      this.touch = { mx: 0, my: 0, camDX: 0 };
      this.time = 0;
      this.weather = { blizzard: false, until: 0, strength: 0 };
      this.save = null;
      this.pausedBefore = null;
      this.showcase = null;
      this.menuCamT = 0;
    }

    /* ---------- 初始化 ---------- */
    init() {
      const canvas = document.getElementById('game-canvas');
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0xd3eaf6, 70, 460);
      this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 1800);
      this.camera.position.set(0, 4, 10);

      // 环境反射
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envScene = new THREE.RoomEnvironment();
      const envTex = pmrem.fromScene(envScene, 0.04).texture;
      this.scene.environment = envTex;
      this.clock = new THREE.Clock();

      // 灯光
      this.hemi = new THREE.HemisphereLight(0xcfe4ff, 0x6d87a3, 0.85);
      this.sun = new THREE.DirectionalLight(0xfff2d9, 1.35);
      this.sun.position.set(90, 130, 55);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      this.sun.shadow.camera.left = -110; this.sun.shadow.camera.right = 110;
      this.sun.shadow.camera.top = 110; this.sun.shadow.camera.bottom = -110;
      this.sun.shadow.camera.far = 420;
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.4;
      this.scene.add(this.hemi, this.sun);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));

      // 世界
      this.buildWorld();
      this.buildPlayerModel();
      this.buildShowcase();
      this.buildParticles();

      // 输入
      this.bindInput();
      window.addEventListener('resize', () => this.onResize());
      this.onResize();

      this.loadSave();
      window.UI.init(this);
      this.state = 'menu';
      document.getElementById('loading').classList.add('hidden');
      this.renderer.setAnimationLoop(() => this.tick());
    }

    buildWorld() {
      const terrain = Models.buildTerrain();
      this.terrain = terrain.mesh;
      this.heightAt = terrain.heightFunc;
      this.scene.add(terrain.mesh);
      for (const lake of terrain.lakes) this.scene.add(lake.mesh);
      const scenery = Models.buildScenery(terrain);
      this.scenery = scenery;
      this.colliders = scenery.colliders || [];
      this.scene.add(scenery.group);
      this.sky = Models.buildSky();
      this.aurora = Models.buildAurora();
      this.scene.add(this.sky, this.aurora);
      const snow = Models.buildSnowParticles();
      this.snow = snow;
      this.scene.add(snow.points);
      this.fogColor = this.scene.fog.color.getHex();
    }

    buildPlayerModel() {
      const bear = Models.buildBear();
      this.bearModel = bear;
      this.scene.add(bear.group);
      bear.group.visible = false;
    }

    buildShowcase() {
      const g = new THREE.Group();
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(7, 7.8, 0.5, 40),
        Models.std(0xe8eef5, { roughness: 0.92, env: 0.3 })
      );
      disc.position.y = -0.25;
      disc.receiveShadow = true;
      g.add(disc);
      const bear = Models.buildBear();
      bear.group.position.set(0, 0.05, 0.8);
      bear.group.rotation.y = Math.PI;
      g.add(bear.group);
      g.userData.bear = bear;
      const arr = ['chick', 'rockhopper', 'adelie', 'armored', 'wizard', 'king'];
      g.userData.penguins = [];
      for (let i = 0; i < arr.length; i++) {
        const p = Models.buildPenguin(arr[i]);
        const a = -Math.PI / 2 + (i / (arr.length - 1)) * Math.PI;
        p.group.position.set(Math.cos(a) * 4.6, 0.05, Math.sin(a) * 4.6 + 0.8);
        p.group.rotation.y = -a + Math.PI;
        g.add(p.group);
        g.userData.penguins.push(p);
      }
      for (let i = 0; i < 6; i++) {
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), Models.std(0xcfefff, { roughness: 0.2, env: 1, transparent: true, opacity: 0.85, emissive: 0x2f7fd6, emissiveIntensity: 0.3 }));
        const a = (i / 6) * Math.PI * 2;
        c.position.set(Math.cos(a) * 8.6, 0.25, Math.sin(a) * 8.6 + 0.8);
        c.scale.set(0.6, 1.7, 0.6);
        g.add(c);
      }
      this.showcase = g;
      this.scene.add(g);
    }

    buildParticles() {
      const makePool = (n, size, additive) => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(n * 3);
        const col = new Float32Array(n * 3);
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size, map: Models.makeSoftTexture(), transparent: true, opacity: 0.95,
          depthWrite: false, vertexColors: true, sizeAttenuation: true,
          blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        this.scene.add(pts);
        return { geo, pos, col, n, pts, next: 0, alive: 0, vel: new Float32Array(n * 3), life: new Float32Array(n), maxLife: new Float32Array(n) };
      };
      this.poolFine = makePool(800, 0.22, false);
      this.poolChunky = makePool(500, 0.85, true);
    }

    /* ---------- 输入 ---------- */
    bindInput() {
      const canvas = this.renderer.domElement;
      window.addEventListener('keydown', e => {
        if (e.code === 'Space') e.preventDefault();
        this.keys[e.code] = true;
        if (!this.keys._init) {
          AudioFX.init();
          AudioFX.resume();
          this.keys._init = true;
        }
        if (this.state === 'battle' || this.state === 'pause') {
          if (e.code === 'Escape') this.togglePause();
          if (e.code === 'KeyV' && this.state === 'battle') this.cameraMode = this.cameraMode === 'fps' ? 'tps' : 'fps';
          if (this.state === 'battle') {
            if (e.code === 'Digit1') this.castSkill(1);
            if (e.code === 'Digit2') this.castSkill(2);
            if (e.code === 'Digit3') this.castSkill(3);
            if (e.code === 'Digit4') this.castSkill(4);
            if (e.code === 'Digit5') this.castSkill(5);
          }
        }
      });
      window.addEventListener('keyup', e => { this.keys[e.code] = false; });
      canvas.addEventListener('click', () => {
        if (this.state === 'battle' && !this.player.dead && !this.player.locked) {
          try {
            const p = canvas.requestPointerLock();
            if (p && p.catch) p.catch(() => {});
          } catch (e) { /* ignore */ }
        }
      });
      document.addEventListener('pointerlockchange', () => {
        const wasLocked = this.locked;
        this.locked = document.pointerLockElement === canvas;
        if (this.locked) {
          this.mouseDX = 0;
          this.mouseDY = 0;
        }
        // 鼠标锁定意外丢失（按 Esc / 切换窗口）时自动暂停，避免角色暴毙
        if (wasLocked && !this.locked && this.state === 'battle' && this.player && !this.player.dead && !this.victoryDone) {
          this.pauseGame();
        }
      });
      document.addEventListener('mousemove', e => {
        if (this.state !== 'battle') {
          this._lastMX = null;
          return;
        }
        if (this.locked) {
          this.mouseDX += e.movementX || 0;
          this.mouseDY += e.movementY || 0;
          this._lastMX = null;
        } else if (this.player && !this.player.locked && !this.player.dead) {
          // 未锁定时也响应鼠标位移（空投落地即可转向，点击后自动切换为指针锁定）
          if (this._lastMX === null) {
            this._lastMX = e.clientX;
            this._lastMY = e.clientY;
          } else {
            this.mouseDX += e.clientX - this._lastMX;
            this.mouseDY += e.clientY - this._lastMY;
            this._lastMX = e.clientX;
            this._lastMY = e.clientY;
          }
        } else {
          this._lastMX = null;
        }
      });
      window.addEventListener('mousedown', e => {
        if (e.button === 0 && this.state === 'battle') this.playerAttack();
        if (e.button === 2 && this.state === 'battle') this.castSkill(2);
      });
      window.addEventListener('contextmenu', e => e.preventDefault());
    }

    /* ---------- 状态切换 ---------- */
    pauseGame() {
      if (this.state === 'battle') {
        this.pausedBefore = 'battle';
        this.state = 'pause';
        window.UI.showScreen('pause');
      }
    }

    releasePointer() {
      try {
        if (document.pointerLockElement) document.exitPointerLock();
      } catch (e) { /* ignore */ }
    }

    togglePause() {
      if (this.state === 'battle') {
        this.releasePointer();
        this.pauseGame();
      } else if (this.state === 'pause') {
        this.state = this.pausedBefore || 'battle';
        this.pausedBefore = null;
        window.UI.showScreen('hud');
        if (this.state === 'battle') {
          try {
            const p = this.renderer.domElement.requestPointerLock();
            if (p && p.catch) p.catch(() => {});
          } catch (e) { /* ignore */ }
        }
      }
    }

    goMap() {
      this.clearBattleEntities();
      this.releasePointer();
      if (this.showcase) this.showcase.visible = false;
      if (this.player) this.player.dead = false;
      this.state = 'map';
      window.UI.showScreen('level-select');
      window.UI.renderMap(this);
    }

    /* ---------- 存档 ---------- */
    loadSave() {
      try {
        // 一次性重置：本次更新后首次运行会清除旧存档，恢复到初始状态
        const RESET_KEY = SAVE_KEY + '_reset_once';
        if (!localStorage.getItem(RESET_KEY)) {
          localStorage.removeItem(SAVE_KEY);
          localStorage.setItem(RESET_KEY, '1');
        }
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          this.save = JSON.parse(raw);
          return;
        }
      } catch (e) { /* ignore */ }
      this.save = {
        unlocked: 1, stars: {}, skillPoints: 2,
        skillLevels: [1, 1, 1, 0, 0, 0],
        bonusAtk: 0, xp: 0, level: 1
      };
    }

    resetSave() {
      this.save = {
        unlocked: 1, stars: {}, skillPoints: 2,
        skillLevels: [1, 1, 1, 0, 0, 0],
        bonusAtk: 0, xp: 0, level: 1
      };
      this.persist();
    }

    persist() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { /* ignore */ }
    }
    getUnlockedCount() { return this.save.unlocked; }
    unlockedCount() { return ALL_LEVELS_OPEN ? LEVELS.length : this.save.unlocked; }

    /* ---------- 玩家数据 ---------- */
    playerStats() {
      const lvl = this.save.level;
      return {
        level: lvl,
        maxHp: 120 + (lvl - 1) * 18,
        atk: 14 + (lvl - 1) * 2.2 + (this.save.bonusAtk || 0),
        def: (lvl - 1) * 0.8,
        energy: 100 + (lvl - 1) * 3,
        spd: 7.2 + lvl * 0.05,
        crit: 0.08
      };
    }

    addXp(amount, silent) {
      this.save.xp += amount;
      let leveled = false;
      while (this.save.xp >= xpNeed(this.save.level)) {
        this.save.xp -= xpNeed(this.save.level);
        this.save.level++;
        leveled = true;
        if (this.player) {
          const oldMax = this.player.maxHp;
          Object.assign(this.player, this.playerStats());
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.player.maxHp - oldMax) * 0.5 + this.player.maxHp * 0.3);
        }
        if (!silent) {
          window.UI.toast('🐻 升级！ 等级 ' + this.save.level, 'gold');
          AudioFX.levelUp();
        }
        if (this.save.level % 3 === 0) this.save.skillPoints++;
      }
      if (!silent && !leveled) window.UI.floatText(this.player.pos, '+' + amount + ' 经验', '#7dffa8');
      this.persist();
      return leveled;
    }

    /* ---------- 开始关卡 ---------- */
    startLevel(index) {
      if (index >= this.unlockedCount()) return;
      this.levelIndex = index;
      if (this.showcase) this.showcase.visible = false;
      this.clearBattleEntities();
      const st = this.playerStats();
      this.player = {
        pos: new THREE.Vector3(0, 0, 0),
        vel: new THREE.Vector3(),
        hp: st.maxHp, maxHp: st.maxHp,
        energy: st.energy, maxEnergy: st.energy,
        atk: st.atk, def: st.def, spd: st.spd, crit: st.crit,
        level: st.level,
        onGround: true, dead: false, locked: true,
        comboCount: 0, comboT: 0, comboMult: 1,
        shield: 0, invuln: 0, dashT: 0, dashDir: new THREE.Vector3(),
        skillCd: [0, 0, 0, 0, 0, 0],
        buffs: [], slowT: 0,
        attackT: 0, roarT: 0, hitFlash: 0,
        animT: 0, moving: false, lastHitDir: new THREE.Vector3()
      };
      this.player.pos.set(0, this.heightAt(0, 0), 6);
      this.bearModel.group.visible = true;
      this.bearModel.group.position.copy(this.player.pos);
      this.bearModel.group.rotation.y = Math.PI;
      this.cameraMode = 'tps';
      this.mouseDX = 0; this.mouseDY = 0;
      this.cameraYaw = 0; this.cameraPitch = 0.18;

      // 波次
      this.waveIndex = 0;
      this.spawnQueue = [];
      this.wavePause = 0;
      this.bossSummoned = false;
      this.bossPhase = 1;
      this.victoryDone = false;

      // 天气
      this.weather.blizzard = Math.random() < 0.28 && index >= 3;
      this.weather.notified = false;
      this.weather.until = this.time + 24;
      this.weather.strength = 0;
      this.aoes = [];
      this.kingEnemy = null;
      window.UI.hideBoss();

      // 空投
      this.introT = 2.8;
      this.dropPod = Models.makeDropPod();
      this.dropPod.position.set(0, this.heightAt(0, 0) + 42, 6);
      this.dropPod.rotation.y = Math.PI;
      this.scene.add(this.dropPod);
      this.bearModel.group.visible = false;
      AudioFX.airdrop();

      this.state = 'battle';
      window.UI.showScreen('hud');
      window.UI.setWave(this, 1, LEVELS[index].waves.length, LEVELS[index]);
      window.UI.buildSkillBar(this);
      window.UI.toast('🚁 正在空投至「' + LEVELS[index].name + '」…', 'warn');
    }

    /* ---------- 战斗实体清理 ---------- */
    clearBattleEntities() {
      for (const e of this.enemies) { if (e.group) this.scene.remove(e.group); }
      for (const p of this.projectiles) { if (p.mesh) this.scene.remove(p.mesh); }
      for (const d of this.drops) { if (d.mesh) this.scene.remove(d.mesh); }
      for (const f of this.effects) { if (f.mesh) this.scene.remove(f.mesh); }
      if (this.aoes) for (const a of this.aoes) { if (a.mark) this.scene.remove(a.mark); }
      this.aoes = [];
      if (this.dropPod) { this.scene.remove(this.dropPod); this.dropPod = null; }
      this.enemies = [];
      this.projectiles = [];
      this.drops = [];
      this.effects = [];
      if (this.particles) this.resetParticles();
    }

    /* ---------- 波次 ---------- */
    startWave(idx) {
      const cfg = LEVELS[this.levelIndex].waves[idx];
      const total = Object.values(cfg).reduce((a, b) => a + b, 0);
      const types = Object.keys(cfg);
      this.spawnQueue = [];
      for (const t of types) {
        for (let i = 0; i < cfg[t]; i++) {
          this.spawnQueue.push({ type: t, delay: i * rand(0.45, 0.9) + this.spawnQueue.length * 0.08 });
        }
      }
      this.spawnQueue.sort((a, b) => a.delay - b.delay);
      const names = types.map(t => ENEMY_TYPES[t].icon + ENEMY_TYPES[t].name).join(' ');
      window.UI.setWave(this, idx + 1, LEVELS[this.levelIndex].waves.length, LEVELS[this.levelIndex]);
      window.UI.toast('第 ' + (idx + 1) + ' 波：' + names + ' ×' + total, 'warn');
      AudioFX.waveStart();
    }

    spawnEnemy(typeId, pos) {
      const cfg = ENEMY_TYPES[typeId];
      const m = 1 + this.levelIndex * 0.13 + (this.save.level - 1) * 0.05;
      const atkScale = ENEMY_ATK_MULT * (this.levelIndex === LEVELS.length - 1 ? ATK_DMG_BOSS : ATK_DMG_NORMAL);
      const model = Models.buildPenguin(typeId);
      const e = {
        id: this.enemies.length + Math.random(),
        type: typeId, cfg,
        group: model.group, refs: model.refs,
        baseScale: model.group.scale.x,
        pos: pos.clone(), vel: new THREE.Vector3(),
        hp: Math.round(cfg.hp * m), maxHp: Math.round(cfg.hp * m),
        dmg: Math.round(cfg.dmg * (0.9 + this.levelIndex * 0.09 + (this.save.level - 1) * 0.03) * atkScale),
        xp: Math.round(cfg.xp * (1 + this.levelIndex * 0.05)),
        spd: cfg.spd * 1.08, atkRange: cfg.atkRange, atkCd: cfg.atkCd,
        state: 'spawn', stateT: 0.9, atkTimer: rand(0.3, 0.8) * ATK_SPEED_FACTOR,
        specialT: rand(3, 6), facing: Math.atan2(-pos.x, -pos.z),
        animT: Math.random() * 10, dead: false, hurtFlash: 0,
        slowT: 0, stunT: 0, dmgDownT: 0, buffT: 0,
        telegraph: null, alive: true, stuckT: 0,
        slideT: 0, slideHitDone: false, burrowPhase: 0, special: null,
        burrowT: 0, burrowMark: null, beamLine: null,
        slamRing: null, boomRing: null, kingMove: null,
        dropFrom: typeId === 'chick' ? 14 : 0,
        phase: typeId === 'king' ? 1 : 0,
        kingTimer: 5
      };
      this.resolveColliders(e.pos, Math.max(0.3, 0.5 * e.baseScale));
      e.group.position.copy(e.pos);
      e.group.position.y += e.dropFrom;
      e.group.scale.setScalar(e.group.scale.x);
      this.scene.add(e.group);
      if (cfg.boss) {
        this.kingEnemy = e;
        window.UI.setBoss(e.hp, e.maxHp, cfg.name);
      }
      // 生成提示
      const warn = Models.makeDisc(0xff5544, 0.35);
      warn.scale.setScalar(1.2);
      warn.position.copy(e.pos); warn.position.y = this.heightAt(e.pos.x, e.pos.z) + 0.06;
      this.scene.add(warn);
      e.spawnWarn = warn;
      e.spawnWarnT = 0.9;
      this.enemies.push(e);
      return e;
    }

    /* ---------- 主循环 ---------- */
    tick() {
      const dt = Math.min(this.clock ? this.clock.getDelta() : 1 / 60, 0.05);
      this.time += dt;
      this.updateSky(dt);
      this.updateSnow(dt);
      this.updateScenery(dt);
      this.updateParticles(dt);
      this.updateEffects(dt);
      if (this.state === 'menu') this.updateMenu(dt);
      else if (this.state === 'battle') this.updateBattle(dt);
      this.renderer.render(this.scene, this.camera);
      if (window.UI) window.UI.update(this, dt);
    }

    updateSky(dt) {
      const s = this.sky.material.uniforms;
      s.time = s.time || 0;
      // 缓慢的极昼-极夜循环（约 6 分钟）
      const day = 0.5 + 0.5 * Math.sin(this.time / 180 + Math.PI * 0.35);
      const night = clamp(1 - day * 1.4, 0, 1);
      const top = new THREE.Color(0x0d2f55).lerp(new THREE.Color(0x0a1830), night);
      const hor = new THREE.Color(0xcfe8f8).lerp(new THREE.Color(0x274a68), night * 0.8);
      s.topColor.value.lerp(top, Math.min(1, dt * 0.4));
      s.horColor.value.lerp(hor, Math.min(1, dt * 0.4));
      s.night.value = lerp(s.night.value, night, Math.min(1, dt * 0.5));
      const sunI = clamp(0.35 + day * 1.0, 0, 1.5);
      this.sun.intensity = lerp(this.sun.intensity, sunI, Math.min(1, dt * 0.5));
      this.aurora.material.uniforms.intensity.value = lerp(
        this.aurora.material.uniforms.intensity.value,
        night * (0.55 + 0.3 * Math.sin(this.time * 0.1)),
        Math.min(1, dt * 0.3)
      );
      this.aurora.material.uniforms.time.value = this.time;
      this.scene.fog.color.setHex(this.fogColor).lerp(new THREE.Color(0x24405c), night * 0.55 + this.weather.strength * 0.35);
    }

    updateSnow(dt) {
      const s = this.snow;
      const windX = Math.sin(this.time * 0.15) * 1.5 + this.weather.strength * 6;
      const fall = this.weather.blizzard ? 5.2 : 1.3;
      for (let i = 0; i < s.count; i++) {
        s.pos[i * 3] += (s.vel[i * 3] * 0.5 + windX * (0.35 + (i % 7) * 0.12)) * dt;
        s.pos[i * 3 + 1] += (s.vel[i * 3 + 1] * (fall * 0.8)) * dt;
        s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * 0.5 * dt;
        if (s.pos[i * 3 + 1] < 0) {
          s.pos[i * 3 + 1] = rand(90, 160);
          s.pos[i * 3] = rand(-380, 380);
          s.pos[i * 3 + 2] = rand(-380, 380);
        }
      }
      s.pos.needsUpdate = true;
    }

    updateScenery(dt) {
      if (!this.scenery) return;
      for (const c of this.scenery.clouds) {
        c.position.x += dt * 1.1;
        if (c.position.x > 400) c.position.x = -400;
      }
    }

    updateMenu(dt) {
      this.menuCamT += dt * 0.13;
      const r = 15;
      this.camera.position.set(Math.sin(this.menuCamT) * r, 4.2 + Math.sin(this.menuCamT * 0.7) * 1.2, Math.cos(this.menuCamT) * r);
      this.camera.lookAt(0, 1.5, 0.8);
      if (this.showcase) {
        const t = this.time;
        const b = this.showcase.userData.bear || null;
        if (b) {
          b.refs.bodyGrp.position.y = Math.sin(t * 2) * 0.025;
          b.refs.headGrp.rotation.y = Math.sin(t * 0.8) * 0.12;
        }
        for (const p of this.showcase.userData.penguins) {
          p.refs.bodyGrp.position.y = Math.abs(Math.sin(t * 3 + p.group.position.x)) * 0.03;
          p.refs.flipperL.rotation.z = Math.sin(t * 6 + p.group.position.x) * 0.25 - 0.32;
          p.refs.flipperR.rotation.z = -Math.sin(t * 6 + p.group.position.x) * 0.25 + 0.32;
        }
      }
    }

    /* ---------- 粒子 ---------- */
    resetParticles() {
      for (const pool of [this.poolFine, this.poolChunky]) {
        for (let i = 0; i < pool.n; i++) pool.life[i] = 0;
        pool.alive = 0;
        pool.pos.fill(0);
        pool.col.fill(0);
        pool.pos.needsUpdate = true;
        pool.col.needsUpdate = true;
      }
    }

    spawnParticles(pool, opts) {
      const o = opts || {};
      const n = o.n || 10;
      const p = o.pos || new THREE.Vector3();
      for (let k = 0; k < n; k++) {
        const i = pool.next;
        pool.next = (pool.next + 1) % pool.n;
        const life = o.life ? o.life * rand(0.6, 1.3) : rand(0.3, 0.7);
        pool.life[i] = life;
        pool.maxLife[i] = life;
        pool.pos[i * 3] = p.x + rand(-(o.spreadX || o.spread || 0.2), o.spreadX || o.spread || 0.2);
        pool.pos[i * 3 + 1] = p.y + rand(-(o.spreadY || o.spread || 0.2), o.spreadY || o.spread || 0.2);
        pool.pos[i * 3 + 2] = p.z + rand(-(o.spreadZ || o.spread || 0.2), o.spreadZ || o.spread || 0.2);
        const sp = o.speed || 3;
        pool.vel[i * 3] = (o.dir ? o.dir.x : 0) * sp + rand(-sp, sp) * (o.random === false ? 0 : 1);
        pool.vel[i * 3 + 1] = (o.dir ? o.dir.y : 0) * sp + rand(-sp * 0.5, sp) * (o.random === false ? 0 : 1);
        pool.vel[i * 3 + 2] = (o.dir ? o.dir.z : 0) * sp + rand(-sp, sp) * (o.random === false ? 0 : 1);
        pool.vel[i * 3 + 1] += o.up || 0;
        const c = o.color || new THREE.Color(1, 1, 1);
        pool.col[i * 3] = c.r; pool.col[i * 3 + 1] = c.g; pool.col[i * 3 + 2] = c.b;
        pool.alive++;
      }
      pool.pos.needsUpdate = true;
      pool.col.needsUpdate = true;
    }

    updateParticles(dt) {
      for (const pool of [this.poolFine, this.poolChunky]) {
        for (let i = 0; i < pool.n; i++) {
          if (pool.life[i] <= 0) continue;
          pool.life[i] -= dt;
          pool.vel[i * 3 + 1] -= (pool === this.poolFine ? 4.5 : 2.2) * dt;
          const drag = pool === this.poolFine ? 0.96 : 0.985;
          pool.vel[i * 3] *= drag; pool.vel[i * 3 + 1] *= drag; pool.vel[i * 3 + 2] *= drag;
          pool.pos[i * 3] += pool.vel[i * 3] * dt;
          pool.pos[i * 3 + 1] += pool.vel[i * 3 + 1] * dt;
          pool.pos[i * 3 + 2] += pool.vel[i * 3 + 2] * dt;
          if (pool.life[i] <= 0) {
            pool.alive--;
            pool.pos[i * 3 + 1] = -100;
          }
        }
        pool.pos.needsUpdate = true;
      }
    }

    /* ---------- 特效 ---------- */
    addEffect(mesh, life, opts) {
      this.scene.add(mesh);
      this.effects.push({
        mesh, life, maxLife: life,
        grow: opts && opts.grow ? opts.grow : 0,
        fade: !opts || opts.fade !== false,
        rot: opts && opts.rot ? opts.rot : 0,
        update: opts && opts.update
      });
    }

    updateEffects(dt) {
      const keep = [];
      for (const f of this.effects) {
        f.life -= dt;
        if (f.life <= 0) { this.scene.remove(f.mesh); continue; }
        const t = 1 - f.life / f.maxLife;
        if (f.grow) {
          const s = 1 + t * f.grow;
          f.mesh.scale.set(s, s, s);
        }
        if (f.rot) f.mesh.rotation.y += f.rot * dt;
        if (f.fade && f.mesh.material) {
          const base = f.baseOpacity === undefined ? (f.mesh.material.opacity !== undefined ? f.mesh.material.opacity : 1) : f.baseOpacity;
          f.mesh.material.opacity = base * (1 - t * t);
        }
        if (f.update) f.update(f, dt, t);
        keep.push(f);
      }
      this.effects = keep;
    }

    /* ---------- 工具 ---------- */
    groundY(x, z) { return this.heightAt(x, z); }

    resolveColliders(v, radius) {
      const cs = this.colliders;
      if (!cs) return;
      for (const c of cs) {
        const dx = v.x - c.x, dz = v.z - c.z;
        const d = Math.hypot(dx, dz);
        const minD = c.r + radius;
        if (d < minD) {
          const push = minD - d;
          if (d > 0.0001) {
            v.x += dx / d * push;
            v.z += dz / d * push;
          } else {
            v.x += minD;
          }
        }
      }
    }

    shake(amount) { this.trauma = Math.min(1, (this.trauma || 0) + amount); }

    /* ---------- 窗口 ---------- */
    onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    /* ---------- 战斗主循环 ---------- */
    updateBattle(dt) {
      if (!this.player) return;
      // 空投进场
      if (this.introT !== undefined && this.introT > 0) {
        this.introT -= dt;
        const t = Math.max(0, this.introT / 2.8);
        const gy = this.groundY(0, 6);
        this.dropPod.position.y = gy + 42 * t;
        this.dropPod.rotation.y += dt * 0.6;
        this.camera.position.set(10, gy + 42 * t + 5, 14);
        this.camera.lookAt(0, gy + 42 * t, 6);
        if (this.introT <= 0) {
          this.scene.remove(this.dropPod);
          this.dropPod = null;
          this.player.pos.set(0, gy, 6);
          this.player.locked = false;
          this.bearModel.group.visible = true;
          this.bearModel.group.position.copy(this.player.pos);
          this.spawnParticles(this.poolChunky, { n: 40, pos: this.player.pos, spread: 1.6, spreadY: 0.8, speed: 5, up: 3, color: new THREE.Color(0xffffff), life: 0.9 });
          AudioFX.land();
          this.shake(0.4);
          window.UI.toast('🛬 空投成功！' + LEVELS[this.levelIndex].line, 'good');
          this.wavePause = 1.2;
          this.updateWaves(dt);
        }
        return;
      }
      this.updatePlayer(dt);
      this.updateCamera(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updateDrops(dt);
      this.updateWaves(dt);
      this.updateAoes(dt);
      this.updateWeather(dt);
      this.updateRadar();
    }

    /* ---------- 玩家 ---------- */
    updatePlayer(dt) {
      const p = this.player;
      if (p.dead || p.locked) return;

      // 冷却与状态
      for (let i = 0; i < 6; i++) p.skillCd[i] = Math.max(0, p.skillCd[i] - dt);
      p.comboT -= dt; if (p.comboT <= 0) { p.comboCount = 0; }
      p.invuln = Math.max(0, p.invuln - dt);
      p.slowT = Math.max(0, p.slowT - dt);
      p.attackT = Math.max(0, p.attackT - dt);
      p.hitFlash = Math.max(0, p.hitFlash - dt);
      p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
      for (let i = p.buffs.length - 1; i >= 0; i--) {
        if (p.buffs[i].until <= this.time) p.buffs.splice(i, 1);
      }
      p.energy = Math.min(p.maxEnergy, p.energy + 10.5 * dt);

      // 移动输入
      let mx = (this.keys.KeyD ? 1 : 0) - (this.keys.KeyA ? 1 : 0) + this.touch.mx;
      let mz = (this.keys.KeyW ? 1 : 0) - (this.keys.KeyS ? 1 : 0) + this.touch.my;
      const yaw = this.cameraYaw || 0;
      const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const move = new THREE.Vector3().addScaledVector(right, mx).addScaledVector(fwd, mz);
      const moveLen = move.length();
      if (moveLen > 1) move.divideScalar(moveLen);

      // 冲刺
      if ((this.keys.ShiftLeft || this.touch.dash) && moveLen > 0.1 && p.dashCd <= 0 && !p.dashT) {
        p.dashT = 0.26;
        p.dashDir.copy(move);
        p.dashCd = 2.6;
        p.invuln = 0.2;
        p.slowT = 0;
        AudioFX.dash();
      }
      this.touch.dash = false;

      const blizz = this.weather.strength;
      const spd = p.spd * (p.slowT > 0 ? 0.68 : 1) * (blizz > 0 ? (1 - 0.1 * blizz) : 1);
      const accel = 1 - Math.exp(-11 * dt);

      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vel.x = p.dashDir.x * 25;
        p.vel.z = p.dashDir.z * 25;
        p.vel.y = 0;
        this.spawnParticles(this.poolFine, { n: 6, pos: p.pos, spread: 0.5, speed: 2, up: 1, color: new THREE.Color(0xbfe9ff), life: 0.5 });
      } else if (p.pounce) {
        p.pounce.t -= dt;
        const po = p.pounce;
        p.vel.x = po.dir.x * (po.speed || 13);
        p.vel.z = po.dir.z * (po.speed || 13);
        if (p.pounce.t <= 0.32) p.vel.y -= GRAVITY * 0.5 * dt;
        this.spawnParticles(this.poolFine, { n: 3, pos: p.pos, spread: 0.7, speed: 1.5, up: 0.5, color: new THREE.Color(0xffffff), life: 0.4 });
      } else {
        p.vel.x = lerp(p.vel.x, move.x * spd, accel);
        p.vel.z = lerp(p.vel.z, move.z * spd, accel);
      }

      // 跳跃
      if ((this.keys.Space || this.touch.jump) && p.onGround && !p.pounce) {
        p.vel.y = 9.4;
        p.onGround = false;
        AudioFX.jump();
      }
      this.touch.jump = false;

      // 重力
      if (!p.onGround && !p.dashT) {
        p.vel.y -= GRAVITY * dt;
        if (p.pounce && p.pounce.t > 0.2) p.vel.y = Math.max(p.vel.y, 4);
      }
      p.vel.y = Math.min(p.vel.y, 15);

      // 位置
      p.pos.x += p.vel.x * dt;
      p.pos.z += p.vel.z * dt;
      p.pos.y += p.vel.y * dt;

      // 地形
      const gy = this.groundY(p.pos.x, p.pos.z);
      if (p.pos.y <= gy + 0.01) {
        const fell = p.pos.y - gy;
        p.pos.y = gy;
        if (!p.onGround) {
          p.onGround = true;
          if (p.pounce) {
            const po = p.pounce;
            p.pounce = null;
            this.pounceImpact(po);
          } else if (fell < -7) {
            AudioFX.land();
            this.spawnParticles(this.poolChunky, { n: 14, pos: p.pos, spread: 1, speed: 3.5, up: 2, color: new THREE.Color(0xffffff), life: 0.6 });
          }
        }
        p.vel.y = 0;
      } else {
        p.onGround = false;
      }

      // 场地边界
      const dist = Math.hypot(p.pos.x, p.pos.z);
      if (dist > ARENA_R) {
        p.pos.x *= ARENA_R / dist;
        p.pos.z *= ARENA_R / dist;
        p.vel.multiplyScalar(0.5);
      }
      this.resolveColliders(p.pos, 0.62);

      // 朝向
      p.moving = moveLen > 0.15 && !p.pounce && !p.dashT;
      const aim = this.aimDir();
      if (p.attackT > 0) p.faceDir = aim;
      else if (p.moving) p.faceDir = move.clone().normalize();
      else p.faceDir = p.faceDir || aim;
      this.bearModel.group.position.copy(p.pos);
      this.bearModel.group.rotation.y = Math.atan2(p.faceDir.x, p.faceDir.z);

      this.animateBear(dt);
      this.updatePlayerShield();
    }

    animateBear(dt) {
      const p = this.player;
      const br = this.bearModel.refs;
      p.animT += dt;
      const t = p.animT;
      if (p.dead) {
        br.bodyGrp.rotation.x = lerp(br.bodyGrp.rotation.x, 1.2, 0.05);
        return;
      }
      if (p.attackT > 0) {
        // 挥爪动画：双臂向前挥
        const prog = 1 - p.attackT / 0.32;
        const sw = Math.sin(prog * Math.PI);
        br.armL.rotation.x = lerp(br.armL.rotation.x, -2.1 + sw * 2.6, 0.4);
        br.armR.rotation.x = lerp(br.armR.rotation.x, -2.1 + sw * 2.6, 0.4);
        br.bodyGrp.rotation.x = lerp(br.bodyGrp.rotation.x, 0.12 + sw * 0.1, 0.3);
      } else if (p.dashT > 0) {
        br.bodyGrp.rotation.x = lerp(br.bodyGrp.rotation.x, 0.32, 0.2);
        br.armL.rotation.x = lerp(br.armL.rotation.x, -0.5, 0.2);
        br.armR.rotation.x = lerp(br.armR.rotation.x, -0.5, 0.2);
      } else if (p.moving && p.onGround) {
        const ph = t * 8.5;
        br.legFL.rotation.x = Math.sin(ph) * 0.6;
        br.legFR.rotation.x = Math.sin(ph + Math.PI) * 0.6;
        br.legBL.rotation.x = Math.sin(ph + Math.PI) * 0.65;
        br.legBR.rotation.x = Math.sin(ph) * 0.65;
        br.armL.rotation.x = Math.sin(ph + Math.PI) * 0.38;
        br.armR.rotation.x = Math.sin(ph) * 0.38;
        br.bodyGrp.rotation.x = lerp(br.bodyGrp.rotation.x, Math.sin(ph * 2) * 0.05, 0.3);
      } else {
        const idle = Math.sin(t * 2.2) * 0.04;
        for (const leg of [br.legFL, br.legFR, br.legBL, br.legBR]) leg.rotation.x = lerp(leg.rotation.x, 0, 0.15);
        br.armL.rotation.x = lerp(br.armL.rotation.x, 0.15 + idle, 0.15);
        br.armR.rotation.x = lerp(br.armR.rotation.x, 0.15 + idle, 0.15);
        br.bodyGrp.rotation.x = lerp(br.bodyGrp.rotation.x, idle * 0.5, 0.15);
      }
      // 呼吸
      br.bodyGrp.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
      br.bodyGrp.scale.x = br.bodyGrp.scale.z = 1 - Math.sin(t * 2.2) * 0.008;
      // 受击闪白
      const flash = p.hitFlash > 0 ? 1.06 + Math.sin(this.time * 40) * 0.03 : 1;
      this.bearModel.group.scale.set(flash, flash, flash);
    }

    updatePlayerShield() {
      const p = this.player;
      if (!this.playerShell) {
        this.playerShell = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.55, 1),
          new THREE.MeshStandardMaterial({
            color: 0x8fd8ff, transparent: true, opacity: 0.35, roughness: 0.15,
            metalness: 0.2, envMapIntensity: 1, emissive: 0x2f7fd6, emissiveIntensity: 0.25,
            depthWrite: false, side: THREE.DoubleSide
          })
        );
        this.scene.add(this.playerShell);
      }
      if (p.shield > 0) {
        this.playerShell.visible = true;
        this.playerShell.position.copy(p.pos).y += 1.1;
        this.playerShell.material.opacity = 0.22 + Math.sin(this.time * 6) * 0.1;
      } else this.playerShell.visible = false;
    }

    /* ---------- 相机 ---------- */
    updateCamera(dt) {
      if (this.locked || this.mouseDX !== 0 || this.mouseDY !== 0) {
        const sens = (window.UI && window.UI.sens) || 1;
        this.cameraYaw -= this.mouseDX * 0.0021 * sens;
        this.cameraPitch = clamp(this.cameraPitch - this.mouseDY * 0.0021 * sens, -0.45, 1.25);
        this.mouseDX = 0; this.mouseDY = 0;
      }
      const p = this.player;
      if (this.cameraMode === 'fps') {
        this.camera.position.set(p.pos.x, p.pos.y + 2.0, p.pos.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.cameraYaw;
        this.camera.rotation.x = this.cameraPitch;
        this.camera.rotation.z = 0;
        if (this.bearModel) this.bearModel.group.visible = false;
      } else {
        this.bearModel.group.visible = true;
        const dist = 7.0;
        const back = new THREE.Vector3(Math.sin(this.cameraYaw) * dist, 0, Math.cos(this.cameraYaw) * dist);
        const target = p.pos.clone().add(new THREE.Vector3(0, 1.3, 0));
        const camPos = target.clone().add(back);
        camPos.y += 2.9 - Math.sin(this.cameraPitch) * 4.6;
        const k = 1 - Math.exp(-12 * dt);
        this.camera.position.lerp(camPos, k);
        this.camera.lookAt(target);
      }
      if (this.trauma > 0) {
        this.trauma = Math.max(0, this.trauma - dt * 1.5);
        const s = this.trauma * this.trauma * 0.5;
        this.camera.position.x += rand(-s, s);
        this.camera.position.y += rand(-s, s);
        this.camera.position.z += rand(-s, s);
        this.camera.rotation.z = rand(-s, s) * 0.08;
      } else {
        this.camera.rotation.z = 0;
      }
    }

    aimDir() {
      if (this.cameraMode === 'fps') {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        dir.y = 0;
        if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
        return dir.normalize();
      }
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);
      return dir.normalize();
    }

    /* ---------- 攻击 ---------- */
    playerAttack() {
      const p = this.player;
      if (!p || p.dead || p.locked || p.attackT > 0) return;
      const lvl = this.skillLevel(0);
      p.attackT = 0.32;
      p.comboCount = (p.comboCount % 3) + 1;
      p.comboT = 2.0;
      const mult = [1, 1.18, 1.4][p.comboCount - 1] * (lvl > 0 ? 1.02 * lvl : 1);
      const dir = this.aimDir();
      p.faceDir = dir;
      p.vel.x += dir.x * 3.0;
      p.vel.z += dir.z * 3.0;
      AudioFX.swing();
      // 爪痕特效
      const arc = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 1.0, 28, 1, 0, 2.1),
        new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
      );
      arc.rotation.x = -Math.PI / 2;
      arc.position.set(p.pos.x + dir.x * 1.7, p.pos.y + 1.0, p.pos.z + dir.z * 1.7);
      arc.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
      this.addEffect(arc, 0.2, { grow: 1.6 });
      // 判定
      const range = 2.9;
      let anyHit = false;
      for (const e of this.enemies) {
        if (e.dead || e.state === 'spawn') continue;
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > range + 0.6) continue;
        const ang = Math.atan2(dx, dz);
        const aimAng = Math.atan2(dir.x, dir.z);
        let diff = Math.abs(ang - aimAng);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff > 1.15) continue;
        this.damageEnemy(e, p.atk * mult, dir, { melee: true, critChance: p.crit });
        anyHit = true;
      }
      if (anyHit) this.rollLifesteal();
      window.UI.setCombo(p.comboCount);
    }

    damageEnemy(e, baseDmg, dir, opts) {
      if (e.dead) return;
      const crit = opts && opts.critChance ? Math.random() < opts.critChance : false;
      let dmg = Math.max(1, Math.round(baseDmg * (crit ? 1.8 : 1) * this.atkMult()));
      if (e.cfg.armor) dmg = Math.max(1, Math.round(dmg * e.cfg.armor));
      if (e.type === 'assassin' && e.stealthOn) dmg = Math.round(dmg * 1.5);
      e.hp -= dmg;
      e.hurtFlash = 0.25;
      if (e.cfg.boss) window.UI.setBoss(e.hp, e.maxHp, e.cfg.name);
      const dirX = dir ? dir.x : 0, dirZ = dir ? dir.z : 0;
      e.vel.x += dirX * 4; e.vel.z += dirZ * 4;
      e.vel.y = Math.max(e.vel.y, 2.2);
      this.spawnParticles(this.poolFine, { n: 6, pos: e.pos, spread: 0.5, spreadY: 0.8, speed: 3, up: 2, color: new THREE.Color(0x9fe8ff), life: 0.45 });
      window.UI.floatText(e.pos, String(dmg), crit ? '#ffd166' : '#ffffff', crit);
      AudioFX.hit(crit);
      if (crit) this.shake(0.12);
      if (e.hp <= 0) this.killEnemy(e);
    }

    atkMult() {
      let m = 1;
      if (this.player) for (const b of this.player.buffs) if (b.type === 'atk') m += b.val;
      return m;
    }

    // 攻击吸血：均等概率回复 2/4/6/8/10 点生命，回满为止
    rollLifesteal() {
      const p = this.player;
      if (!p || p.dead || p.hp >= p.maxHp) return;
      const heal = [2, 4, 6, 8, 10][randi(0, 4)];
      const before = p.hp;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      const actual = Math.round(p.hp - before);
      if (actual > 0) {
        window.UI.floatText(p.pos, '+' + actual + ' 吸血', '#7dffa8');
      }
    }

    killEnemy(e) {
      if (e.dead) return;
      e.dead = true;
      this.scene.remove(e.group);
      if (e.telegraph) { this.scene.remove(e.telegraph); e.telegraph = null; }
      if (e.spawnWarn) { this.scene.remove(e.spawnWarn); e.spawnWarn = null; }
      if (e.burrowMark) { this.scene.remove(e.burrowMark); e.burrowMark = null; }
      if (e.beamLine) { this.scene.remove(e.beamLine); e.beamLine = null; }
      if (e.boomRing) { this.scene.remove(e.boomRing); e.boomRing = null; }
      if (e.slamRing) { this.scene.remove(e.slamRing); e.slamRing = null; }
      this.spawnParticles(this.poolChunky, { n: e.cfg.boss ? 60 : 14, pos: e.pos, spread: 0.9, spreadY: 1.0, speed: 4, up: 3, color: new THREE.Color(e.cfg.boss ? 0xffd166 : 0xe8f6ff), life: 0.7 });
      this.spawnParticles(this.poolFine, { n: 10, pos: e.pos, spread: 0.8, speed: 2.5, up: 2, color: new THREE.Color(0xffffff), life: 0.5 });
      AudioFX.penguinDie();
      this.addXp(e.xp, false);
      // 掉落
      const roll = Math.random();
      if (e.cfg.boss) {
        this.dropItem('gold', e.pos);
        this.dropItem('fish', e.pos);
        this.save.bonusAtk += 1;
        window.UI.toast('👑 击败企鹅王！北极星石：攻击 +1', 'gold');
      } else {
        if (roll < 0.42) this.dropItem('fish', e.pos);
        else if (roll < 0.66) this.dropItem('snow', e.pos);
        else if (roll < 0.74) this.dropItem('gold', e.pos);
        else if (['elite', 'ancient', 'colossus'].includes(e.type) && Math.random() < 0.45) {
          this.save.bonusAtk += 1;
          window.UI.toast('💎 北极星石：攻击 +1', 'gold');
        }
      }
      this.persist();
      if (e.type === 'king') this.victory();
    }

    dropItem(kind, pos) {
      let mesh;
      if (kind === 'fish') {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), Models.std(0xff9c5a, { roughness: 0.4, env: 0.6 }));
        body.rotation.x = Math.PI / 2;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 6), Models.std(0xf07c4a, { roughness: 0.5 }));
        tail.rotation.x = -Math.PI / 2;
        tail.position.z = -0.3;
        g.add(body, tail);
        mesh = g;
      } else if (kind === 'snow') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), Models.std(0xdff4ff, { roughness: 0.2, env: 1, emissive: 0x7fd4ff, emissiveIntensity: 0.45, transparent: true, opacity: 0.9 }));
      } else {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), Models.std(0xffd166, { roughness: 0.2, metalness: 0.9, env: 1, emissive: 0xffa000, emissiveIntensity: 0.35 }));
      }
      mesh.position.copy(pos);
      mesh.position.y = this.groundY(pos.x, pos.z) + 0.45;
      this.scene.add(mesh);
      this.drops.push({ kind, mesh, pos: mesh.position.clone(), t: Math.random() * 10 });
    }

    updateDrops(dt) {
      const p = this.player;
      const keep = [];
      for (const d of this.drops) {
        d.t += dt;
        d.mesh.position.y = this.groundY(d.pos.x, d.pos.z) + 0.42 + Math.sin(d.t * 3) * 0.12;
        d.mesh.rotation.y += dt * 2.4;
        const dx = d.pos.x - p.pos.x, dz = d.pos.z - p.pos.z;
        if (Math.hypot(dx, dz) < 1.8) {
          if (d.kind === 'fish') {
            p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12);
            window.UI.floatText(p.pos, '+生命', '#7dffa8');
            AudioFX.pickup();
          } else if (d.kind === 'snow') {
            p.energy = Math.min(p.maxEnergy, p.energy + 26);
            window.UI.floatText(p.pos, '+能量', '#8fe3ff');
            AudioFX.pickup();
          } else {
            p.energy = Math.min(p.maxEnergy, p.energy + 30);
            p.buffs.push({ type: 'atk', val: 0.2, until: this.time + 10 });
            window.UI.floatText(p.pos, '攻击 +20%', '#ffd166');
            window.UI.toast('✨ 金色小鱼：攻击提升 20%（10秒）', 'gold');
            AudioFX.pickupGold();
          }
          this.scene.remove(d.mesh);
          continue;
        }
        keep.push(d);
      }
      this.drops = keep;
    }

    /* ---------- 技能 ---------- */
    skillLevel(idx) {
      return this.save.skillLevels[idx] || 0;
    }
    castSkill(n) {
      const p = this.player;
      if (!p || p.dead || p.locked) return;
      const idx = n; // 1-5 对应 breath..avalanche
      const def = SKILL_DEFS[idx];
      if (!def) return;
      if (def.unlockLv > 0 && this.unlockedCount() <= def.unlockLv) {
        window.UI.toast('⛰️ 通关第 ' + def.unlockLv + ' 关后解锁', 'warn');
        return;
      }
      const lvl = this.skillLevel(idx);
      if (lvl <= 0) return;
      const cd = SKILL_LVLS[def.id].cd[lvl];
      const cost = SKILL_LVLS[def.id].energy[lvl];
      if (p.skillCd[idx] > 0) return;
      if (p.energy < cost) {
        window.UI.toast('❄️ 能量不足', 'warn');
        return;
      }
      p.energy -= cost;
      p.skillCd[idx] = cd;
      if (def.id === 'breath') this.castBreath(lvl);
      else if (def.id === 'pounce') this.castPounce(lvl);
      else if (def.id === 'roar') this.castRoar(lvl);
      else if (def.id === 'armor') this.castArmor(lvl);
      else if (def.id === 'avalanche') this.castAvalanche(lvl);
    }

    castBreath(lvl) {
      const p = this.player;
      const dir = this.aimDir();
      const range = SKILL_LVLS.breath.range[lvl];
      const mult = [1.3, 1.7, 2.1][lvl];
      const slow = [35, 45, 55][lvl];
      const origin = p.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
      for (let i = 0; i < 34; i++) {
        const a = rand(-0.55, 0.55);
        const spreadDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
        this.spawnParticles(this.poolFine, {
          n: 1, pos: origin.clone().add(new THREE.Vector3(rand(-0.3, 0.3), rand(-0.2, 0.3), rand(-0.3, 0.3))),
          dir: spreadDir, spreadX: 0.25, spreadZ: 0.25, speed: 9, life: 0.55, random: false,
          color: new THREE.Color(0xcfefff)
        });
      }
      const glow = makeGlowScale(2.2);
      glow.position.copy(p.pos).y += 1.3;
      this.addEffect(glow, 0.3, { grow: 3, fade: true });
      AudioFX.cast();
      this.shake(0.12);
      let hit = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > range + 0.8) continue;
        const ang = Math.atan2(dx, dz), aimAng = Math.atan2(dir.x, dir.z);
        let diff = Math.abs(ang - aimAng);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff > 0.85) continue;
        e.slowT = 3;
        this.damageEnemy(e, p.atk * mult, dir, { critChance: p.crit });
        hit = true;
      }
      if (hit) this.rollLifesteal();
      window.UI.toast('❄️ 冰霜吐息！', 'good');
    }

    castPounce(lvl) {
      const p = this.player;
      const dir = this.aimDir();
      const speed = [12, 14, 16][lvl];
      p.pounce = { t: 0.42, landed: false, dmg: p.atk * [1.7, 2.1, 2.5][lvl], radius: SKILL_LVLS.pounce.radius[lvl], dir, speed };
      p.onGround = false;
      p.vel.y = 7.5;
      AudioFX.cast();
      window.UI.toast('🐻 极地猛扑！', 'good');
    }

    pounceImpact(po) {
      const p = this.player;
      this.spawnParticles(this.poolChunky, { n: 26, pos: p.pos, spread: po.radius, spreadY: 0.6, speed: 5, up: 3.5, color: new THREE.Color(0xffffff), life: 0.7 });
      const ring = Models.makeRing(0xffffff, 0.9);
      ring.position.copy(p.pos); ring.position.y += 0.1;
      this.addEffect(ring, 0.4, { grow: 4, fade: true });
      AudioFX.land();
      this.shake(0.35);
      let hit = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = e.pos.distanceTo(p.pos);
        if (d < po.radius + 0.8) {
          const dir = e.pos.clone().sub(p.pos).normalize();
          this.damageEnemy(e, po.dmg, dir, { critChance: p.crit });
          e.vel.y += 4;
          hit = true;
        }
      }
      if (hit) this.rollLifesteal();
    }

    castRoar(lvl) {
      const p = this.player;
      const radius = SKILL_LVLS.roar.radius[lvl];
      const stun = [1.2, 1.6, 2.0][lvl];
      const ring = Models.makeRing(0xffcf9e, 0.95);
      ring.position.copy(p.pos); ring.position.y += 0.12;
      this.addEffect(ring, 0.5, { grow: radius, fade: true });
      const glow = makeGlowScale(1.8);
      glow.position.copy(p.pos).y += 1.4;
      this.addEffect(glow, 0.4, { grow: 2, fade: true });
      AudioFX.roar();
      this.shake(0.4);
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (e.pos.distanceTo(p.pos) < radius + 0.8) {
          e.stunT = Math.max(e.stunT, stun);
          e.dmgDownT = 5;
          window.UI.floatText(e.pos, '震慑!', '#ffcf9e');
        }
      }
      window.UI.toast('📢 咆哮威吓！', 'good');
    }

    castArmor(lvl) {
      const p = this.player;
      p.shield += Math.round(p.maxHp * [0.18, 0.26, 0.34][lvl]);
      p.buffs.push({ type: 'atk', val: [0.08, 0.12, 0.16][lvl], until: this.time + 6 });
      AudioFX.shield();
      this.updatePlayerShield();
      window.UI.toast('🧊 冰晶护甲！', 'good');
    }

    castAvalanche(lvl) {
      const p = this.player;
      const radius = SKILL_LVLS.avalanche.radius[lvl];
      const dmg = p.atk * [4.5, 5.5, 6.5][lvl];
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 14),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      dome.position.copy(p.pos).y += 0.8;
      this.addEffect(dome, 0.55, { grow: radius, fade: true });
      this.spawnParticles(this.poolChunky, { n: 90, pos: p.pos, spread: radius * 0.7, spreadY: 2, speed: 12, up: 6, color: new THREE.Color(0xffffff), life: 1.1 });
      AudioFX.avalanche();
      this.shake(0.95);
      let hit = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (e.pos.distanceTo(p.pos) < radius) {
          const dir = e.pos.clone().sub(p.pos).normalize();
          this.damageEnemy(e, dmg, dir, { critChance: p.crit });
          e.vel.y += 5;
          hit = true;
        }
      }
      if (hit) this.rollLifesteal();
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        if (pr.from === 'enemy' && pr.pos.distanceTo(p.pos) < radius) {
          this.scene.remove(pr.mesh);
          this.projectiles.splice(i, 1);
        }
      }
      window.UI.toast('⛰️ 雪崩召唤！！！', 'gold');
    }

    /* ---------- 玩家受伤 ---------- */
    applyPlayerDamage(amount, srcPos, opts) {
      const p = this.player;
      if (!p || p.dead || p.locked) return;
      if (p.invuln > 0 || p.dashT > 0) return;
      let d = Math.max(1, Math.round(amount - p.def * 0.5));
      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, d);
        p.shield -= absorbed;
        d -= absorbed;
        this.spawnParticles(this.poolFine, { n: 8, pos: p.pos, spread: 0.9, spreadY: 1.2, speed: 3, up: 2, color: new THREE.Color(0x8fd8ff), life: 0.5 });
        if (d <= 0) { AudioFX.iceCrack(); return; }
      }
      p.hp -= d;
      p.hitFlash = 0.3;
      const vg = document.getElementById('vignette');
      vg.classList.add('damage');
      clearTimeout(this._vgT);
      this._vgT = setTimeout(() => vg.classList.remove('damage'), 220);
      if (srcPos) {
        const dir = p.pos.clone().sub(srcPos);
        dir.y = 0;
        if (dir.lengthSq() > 0.0001) dir.normalize();
        p.vel.x += dir.x * 7;
        p.vel.z += dir.z * 7;
      }
      AudioFX.hurt();
      this.shake(0.3);
      window.UI.floatText(p.pos, '-' + d, '#ff6b5e');
      if (p.hp <= 0) {
        p.hp = 0;
        p.dead = true;
        AudioFX.defeat();
        this.state = 'defeat';
        this.releasePointer();
        window.UI.showResult(this, 'lose');
      }
    }

    /* ---------- 敌人 ---------- */
    updateEnemies(dt) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        this.updateEnemy(e, dt);
      }
      // 分离
      for (let i = 0; i < this.enemies.length; i++) {
        const a = this.enemies[i];
        if (a.dead) continue;
        for (let j = i + 1; j < this.enemies.length; j++) {
          const b = this.enemies[j];
          if (b.dead) continue;
          const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.001 && d < 1.0) {
            const push = (1.0 - d) * 0.5;
            a.pos.x -= dx / d * push; a.pos.z -= dz / d * push;
            b.pos.x += dx / d * push; b.pos.z += dz / d * push;
          }
        }
      }
      this.collidePlayerEnemies();
    }

    // 玩家与企鹅实体碰撞：不可互相穿越
    collidePlayerEnemies() {
      const p = this.player;
      if (!p || p.dead) return;
      const pR = 0.62;
      for (const e of this.enemies) {
        if (e.dead || e.burrowPhase === 1) continue;
        const eR = Math.max(0.3, 0.5 * e.baseScale);
        const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z;
        const d = Math.hypot(dx, dz);
        const minD = pR + eR;
        if (d < minD) {
          const push = minD - d;
          let nx, nz;
          if (d > 0.0001) { nx = dx / d; nz = dz / d; } else { nx = 1; nz = 0; }
          p.pos.x += nx * push * 0.6;
          p.pos.z += nz * push * 0.6;
          e.pos.x -= nx * push * 0.4;
          e.pos.z -= nz * push * 0.4;
        }
      }
    }

    updateEnemy(e, dt) {
      const p = this.player;
      e.animT += dt;
      e.facingTarget = e.facingTarget || 0;
      if (e.state === 'spawn') {
        e.stateT -= dt;
        if (e.spawnWarn) {
          e.spawnWarnT -= dt;
          if (e.spawnWarnT <= 0) { this.scene.remove(e.spawnWarn); e.spawnWarn = null; }
        }
        if (e.dropFrom > 0) {
          e.pos.y -= 13 * dt;
          const gy = this.groundY(e.pos.x, e.pos.z);
          if (e.pos.y <= gy) { e.pos.y = gy; e.dropFrom = 0; }
        }
        e.group.position.copy(e.pos);
        if (e.stateT <= 0) {
          e.state = 'approach';
          this.spawnParticles(this.poolFine, { n: 10, pos: e.pos, spread: 0.8, speed: 2.5, up: 2, color: new THREE.Color(0xffffff), life: 0.5 });
          if (!e.cfg.boss) AudioFX.penguin(0.1);
        }
        this.animateEnemy(e, dt);
        return;
      }
      if (e.stunT > 0) {
        e.stunT -= dt;
        e.vel.multiplyScalar(0.85);
        this.moveEnemy(e, dt);
        this.animateEnemy(e, dt);
        return;
      }
      if (e.slowT > 0) e.slowT -= dt;
      if (e.dmgDownT > 0) e.dmgDownT -= dt;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;

      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z;
      const dist = Math.hypot(dx, dz) || 0.01;
      const dirX = dx / dist, dirZ = dz / dist;
      const t = e.cfg;

      if (e.type === 'king') { this.updateKing(e, dt, dist, dirX, dirZ); return; }
      if (t.bomber) { this.updateBomber(e, dt, dist, dirX, dirZ); return; }
      if (t.burrow) { this.updateBurrow(e, dt, dist, dirX, dirZ); return; }
      if (t.healer) { this.updateHealer(e, dt, dist, dirX, dirZ); return; }
      if (t.sniper) { this.updateSniper(e, dt, dist, dirX, dirZ); return; }
      if (t.magic) { this.updateWizard(e, dt, dist, dirX, dirZ); return; }
      if (t.regen) { this.updateAncient(e, dt, dist, dirX, dirZ); return; }
      if (t.stealth) e.stealthOn = true;
      if (t.slam) { this.updateSpecial(e, dt, dist, dirX, dirZ); }
      if (t.buff) { this.updateSpecial(e, dt, dist, dirX, dirZ); }

      // 状态机
      switch (e.state) {
        case 'approach': {
          e.facing = Math.atan2(dirX, dirZ);
          const stopDist = t.ranged ? 9 : e.atkRange * 0.75;
          if (dist > stopDist) {
            const sp = e.spd * (1 + this.weather.strength * 0.12) * (e.slowT > 0 ? 0.6 : 1);
            e.vel.x = dirX * sp; e.vel.z = dirZ * sp;
          } else {
            e.vel.x = lerp(e.vel.x, 0, 0.2); e.vel.z = lerp(e.vel.z, 0, 0.2);
          }
          if (t.ranged && dist < 4) {
            e.vel.x = -dirX * e.spd * 0.7; e.vel.z = -dirZ * e.spd * 0.7;
          }
          e.atkTimer -= dt;
          // 滑铲特技
          if (t.slide && dist > 4.5 && dist < 13 && e.specialT <= 0 && e.atkTimer <= 0 && Math.random() < 0.25 * dt * 8 * ATK_CHANCE) {
            e.special = 'slide';
            e.state = 'windup'; e.stateT = 0.4 * ATK_SPEED_FACTOR;
            e.vel.set(0, 0, 0);
            this.showTelegraph(e, 2.4, 0xff8855, true);
            AudioFX.penguin(0.15);
            break;
          }
          if (dist <= e.atkRange + 0.5 && e.atkTimer <= 0) {
            if (Math.random() < ATK_CHANCE) {
              e.state = 'windup';
              e.stateT = (t.windup || 0.55) * 0.75 * ATK_SPEED_FACTOR;
              e.vel.set(0, 0, 0);
              this.showTelegraph(e, 1.6, 0xff5544, false);
              AudioFX.penguin(0.12);
            } else {
              e.atkTimer = 0.35;
            }
          } else if (t.ranged && dist <= 18 && e.atkTimer <= 0) {
            if (Math.random() < ATK_CHANCE) {
              e.state = 'windup';
              e.stateT = 0.6 * ATK_SPEED_FACTOR;
              this.showTelegraph(e, 1.4, 0xff8855, false);
              AudioFX.cast();
            } else {
              e.atkTimer = 0.35;
            }
          }
          break;
        }
        case 'windup':
          e.stateT -= dt;
          e.vel.multiplyScalar(0.75);
          if (e.stateT <= 0) {
            this.enemyAttack(e);
            e.state = 'recover';
            e.stateT = (t.recover || 0.5) * 0.8 * ATK_SPEED_FACTOR;
          }
          break;
        case 'recover':
          e.stateT -= dt;
          e.vel.multiplyScalar(0.85);
          if (e.stateT <= 0) {
            e.state = 'approach';
            e.atkTimer = e.atkCd * rand(0.7, 1.0) * ATK_SPEED_FACTOR;
            e.special = null;
          }
          break;
        case 'slide':
          e.slideT -= dt;
          e.vel.set(e.slideDir.x * 17, 0, e.slideDir.z * 17);
          if (dist < 1.6 && !e.slideHitDone) {
            e.slideHitDone = true;
            this.applyPlayerDamage(e.dmg * 1.15, e.pos);
            this.spawnParticles(this.poolFine, { n: 12, pos: p.pos, spread: 1, speed: 4, up: 2, color: new THREE.Color(0xffffff), life: 0.5 });
            e.state = 'recover'; e.stateT = 0.6;
          }
          if (e.slideT <= 0) { e.state = 'recover'; e.stateT = 0.55; }
          break;
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    updateSpecial(e, dt, dist, dirX, dirZ) {
      const t = e.cfg;
      e.specialT -= dt;
      if (e.specialT <= 0) {
        e.specialT = t.slam ? 6 * ATK_SPEED_FACTOR : 6.5;
        if (t.slam && dist < 9) {
          if (Math.random() < ATK_CHANCE) {
            e.state = 'slamwindup';
            e.stateT = 0.8 * ATK_SPEED_FACTOR;
            e.vel.set(0, 0, 0);
            const ring = Models.makeRing(0xff6644, 0.7);
            ring.scale.setScalar(4.6);
            ring.position.copy(e.pos); ring.position.y = this.groundY(e.pos.x, e.pos.z) + 0.08;
            this.scene.add(ring);
            e.slamRing = ring;
            AudioFX.penguin(0.2);
          } else {
            e.specialT = 1.0;
          }
        } else if (t.buff) {
          e.buffT = 6;
          AudioFX.roar();
          const ring = Models.makeRing(0xffd166, 0.8);
          ring.position.copy(e.pos); ring.position.y += 0.1;
          this.addEffect(ring, 0.45, { grow: 3.4, fade: true });
          window.UI.floatText(e.pos, '鼓舞!', '#ffd166');
        }
      }
      if (e.state === 'slamwindup') {
        e.stateT -= dt;
        if (e.slamRing) e.slamRing.scale.multiplyScalar(1 + dt * 0.8);
        if (e.stateT <= 0) {
          if (e.slamRing) { this.scene.remove(e.slamRing); e.slamRing = null; }
          this.spawnParticles(this.poolChunky, { n: 26, pos: e.pos, spread: 3, spreadY: 1.5, speed: 7, up: 4, color: new THREE.Color(0xffffff), life: 0.7 });
          AudioFX.land();
          this.shake(0.5);
          const ring = Models.makeRing(0xff6644, 0.9);
          ring.position.copy(e.pos); ring.position.y += 0.1;
          this.addEffect(ring, 0.4, { grow: 8, fade: true });
          if (dist < 5.5) {
            this.applyPlayerDamage(e.dmg * 1.4, e.pos);
            if (!this.player.dead) {
              this.player.slowT = Math.max(this.player.slowT, 2);
              window.UI.toast('💥 被震晕了！', 'warn');
            }
          }
          e.state = 'recover'; e.stateT = 1.0 * ATK_SPEED_FACTOR;
        }
      }
      // 鼓舞光环
      if (e.buffT > 0) {
        e.buffT -= dt;
        for (const o of this.enemies) {
          if (o !== e && o.pos.distanceTo(e.pos) < 7) o.buffT = Math.max(o.buffT, 0.5);
        }
      }
    }

    updateBomber(e, dt, dist, dirX, dirZ) {
      if (e.state === 'boom') {
        e.stateT -= dt;
        const cl = e.refs.acc.chargeLight;
        if (cl) cl.material.emissiveIntensity = 0.5 + Math.sin(this.time * 26) * 2.2;
        if (e.stateT <= 0) {
          this.spawnParticles(this.poolChunky, { n: 40, pos: e.pos, spread: 3, spreadY: 2, speed: 9, up: 5, color: new THREE.Color(0xff8855), life: 0.8 });
          this.spawnParticles(this.poolFine, { n: 20, pos: e.pos, spread: 2.4, speed: 6, up: 3, color: new THREE.Color(0xffe0c0), life: 0.6 });
          const ring = Models.makeRing(0xff6644, 0.95);
          ring.position.copy(e.pos); ring.position.y += 0.1;
          this.addEffect(ring, 0.45, { grow: 9, fade: true });
          AudioFX.explode();
          this.shake(0.6);
          if (dist < 5.2) this.applyPlayerDamage(e.dmg * 1.2, e.pos);
          if (e.boomRing) { this.scene.remove(e.boomRing); e.boomRing = null; }
          this.killEnemy(e);
        }
        return;
      }
      const low = e.hp < e.maxHp * 0.35;
      if ((dist < 3.0 || low) && e.state !== 'boom') {
        e.state = 'boom';
        e.stateT = 0.75 * ATK_SPEED_FACTOR;
        e.vel.set(0, 0, 0);
        const ring = Models.makeDisc(0xff5544, 0.4);
        ring.scale.setScalar(4.4);
        ring.position.copy(e.pos); ring.position.y = this.groundY(e.pos.x, e.pos.z) + 0.06;
        this.scene.add(ring);
        e.boomRing = ring;
        AudioFX.penguin(0.2);
      } else {
        const sp = e.spd * 1.15;
        e.vel.x = dirX * sp; e.vel.z = dirZ * sp;
        e.facing = Math.atan2(dirX, dirZ);
        this.moveEnemy(e, dt);
        this.animateEnemy(e, dt);
      }
    }

    updateBurrow(e, dt, dist, dirX, dirZ) {
      if (e.burrowPhase === 0) {
        if (e.state !== 'burrowwindup' && e.specialT <= 0 && dist > 3 && dist < 16 && e.atkTimer <= 0) {
          if (Math.random() < ATK_CHANCE) {
            e.state = 'burrowwindup';
            e.stateT = 0.42 * ATK_SPEED_FACTOR;
            e.vel.set(0, 0, 0);
            this.showTelegraph(e, 1.4, 0xff8844, false);
          } else {
            e.atkTimer = 0.4;
          }
        }
        if (e.state === 'burrowwindup') {
          e.stateT -= dt;
          e.group.position.y = lerp(e.group.position.y, this.groundY(e.pos.x, e.pos.z) - 0.7, 0.08);
          if (e.stateT <= 0) {
            e.burrowPhase = 1;
            e.burrowT = 1.3;
            e.group.visible = false;
            this.spawnParticles(this.poolFine, { n: 12, pos: e.pos, spread: 0.9, speed: 2.5, up: 1, color: new THREE.Color(0xffffff), life: 0.5 });
            e.burrowMark = Models.makeDisc(0xffcc66, 0.4);
            e.burrowMark.scale.setScalar(1.2);
            e.burrowMark.position.copy(this.player.pos);
            e.burrowMark.position.y = this.groundY(this.player.pos.x, this.player.pos.z) + 0.05;
            this.scene.add(e.burrowMark);
          }
        } else {
          e.facing = Math.atan2(dirX, dirZ);
          e.vel.x = dirX * e.spd; e.vel.z = dirZ * e.spd;
          e.atkTimer -= dt;
          this.moveEnemy(e, dt);
          this.animateEnemy(e, dt);
        }
      } else if (e.burrowPhase === 1) {
        e.burrowT -= dt;
        e.burrowMark.position.x = lerp(e.burrowMark.position.x, this.player.pos.x, 0.08);
        e.burrowMark.position.z = lerp(e.burrowMark.position.z, this.player.pos.z, 0.08);
        e.burrowMark.position.y = this.groundY(e.burrowMark.position.x, e.burrowMark.position.z) + 0.05;
        if (e.burrowT <= 0) {
          e.burrowPhase = 2;
          e.stateT = 0.4;
          e.pos.copy(e.burrowMark.position);
          e.pos.y = this.groundY(e.pos.x, e.pos.z);
          e.group.visible = true;
          this.scene.remove(e.burrowMark); e.burrowMark = null;
          this.spawnParticles(this.poolFine, { n: 20, pos: e.pos, spread: 1.2, speed: 4, up: 3, color: new THREE.Color(0xffffff), life: 0.6 });
        }
      } else {
        e.stateT -= dt;
        const d = e.pos.distanceTo(this.player.pos);
        if (d < 2.2 && e.stateT > 0.1) {
          this.applyPlayerDamage(e.dmg * 1.2, e.pos);
          e.stateT = 0.05;
        }
        if (e.stateT <= 0) {
          e.burrowPhase = 0;
          e.specialT = rand(4, 7);
          e.atkTimer = e.atkCd * 0.8 * ATK_SPEED_FACTOR;
        }
      }
    }

    updateHealer(e, dt, dist, dirX, dirZ) {
      e.specialT -= dt;
      const want = 7;
      if (dist > want + 0.5) { e.vel.x = dirX * e.spd; e.vel.z = dirZ * e.spd; }
      else if (dist < want - 0.5) { e.vel.x = -dirX * e.spd * 0.7; e.vel.z = -dirZ * e.spd * 0.7; }
      else { e.vel.x = lerp(e.vel.x, 0, 0.2); e.vel.z = lerp(e.vel.z, 0, 0.2); }
      e.facing = Math.atan2(dirX, dirZ);
      if (e.specialT <= 0) {
        e.specialT = 4.2;
        let target = null;
        for (const o of this.enemies) {
          if (o === e || o.dead) continue;
          if (o.hp < o.maxHp && (target === null || o.hp / o.maxHp < target.hp / target.maxHp)) {
            if (o.pos.distanceTo(e.pos) < 22) target = o;
          }
        }
        if (target) {
          target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.15);
          window.UI.floatText(target.pos, '+治疗', '#7dffa8');
          const mid = e.pos.clone().lerp(target.pos, 0.5);
          mid.y += 1;
          this.spawnParticles(this.poolFine, { n: 14, pos: mid, spread: 0.4, speed: 1.5, up: 1, color: new THREE.Color(0x7dffa8), life: 0.8 });
          AudioFX.heal();
        } else {
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.05);
        }
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    updateSniper(e, dt, dist, dirX, dirZ) {
      e.specialT -= dt;
      if (e.state === 'aim') {
        e.stateT -= dt;
        if (e.beamLine) {
          e.beamLine.position.copy(e.pos).y += 0.9;
          e.beamLine.rotation.y = Math.atan2(e.beamDir.x, e.beamDir.z);
          e.beamLine.rotation.x = Math.PI / 2;
        }
        if (e.stateT <= 0) {
          if (e.beamLine) { this.scene.remove(e.beamLine); e.beamLine = null; }
          AudioFX.beam();
          this.shake(0.15);
          this.spawnParticles(this.poolFine, { n: 26, pos: this.player.pos, spread: 0.8, speed: 6, up: 2, color: new THREE.Color(0x9fe8ff), life: 0.5 });
          const beamFx = makeBeamScale(24);
          beamFx.position.copy(e.pos).y += 0.9;
          beamFx.rotation.y = Math.atan2(e.beamDir.x, e.beamDir.z);
          beamFx.rotation.x = Math.PI / 2;
          this.addEffect(beamFx, 0.25, { fade: true });
          // 判定：玩家是否在瞄准线附近
          const toP = this.player.pos.clone().sub(e.pos);
          toP.y = 0;
          const distAlong = toP.dot(e.beamDir);
          if (distAlong > 0 && distAlong < 24) {
            const proj = e.pos.clone().addScaledVector(e.beamDir, distAlong);
            proj.y = this.player.pos.y;
            if (this.player.pos.distanceTo(proj) < 1.4) {
              this.applyPlayerDamage(e.dmg, e.pos);
            }
          }
          e.state = 'recover'; e.stateT = 0.6 * ATK_SPEED_FACTOR;
          e.atkTimer = e.atkCd * rand(0.75, 1.05) * ATK_SPEED_FACTOR;
        }
      } else if (e.state === 'approach' || e.state === 'recover') {
        if (e.state === 'recover') {
          e.stateT -= dt;
          if (e.stateT <= 0) e.state = 'approach';
        } else {
          e.facing = Math.atan2(dirX, dirZ);
          if (dist > 11) { e.vel.x = dirX * e.spd; e.vel.z = dirZ * e.spd; }
          else if (dist < 6.5) { e.vel.x = -dirX * e.spd * 0.6; e.vel.z = -dirZ * e.spd * 0.6; }
          else { e.vel.x = lerp(e.vel.x, 0, 0.2); e.vel.z = lerp(e.vel.z, 0, 0.2); }
          e.atkTimer -= dt;
          if (dist <= 24 && e.atkTimer <= 0) {
            if (Math.random() < ATK_CHANCE) {
              e.state = 'aim';
              e.stateT = 0.9 * ATK_SPEED_FACTOR;
              e.beamDir = new THREE.Vector3(dirX, 0, dirZ).normalize();
              e.beamLine = makeBeamScale(26);
              e.beamLine.position.copy(e.pos).y += 0.9;
              e.beamLine.rotation.x = Math.PI / 2;
              this.scene.add(e.beamLine);
              AudioFX.penguin(0.15);
            } else {
              e.atkTimer = 0.5;
            }
          }
        }
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    updateWizard(e, dt, dist, dirX, dirZ) {
      e.specialT -= dt;
      if (e.state === 'cast') {
        e.stateT -= dt;
        if (e.stateT <= 0) {
          AudioFX.cast();
          const base = Math.atan2(dirX, dirZ);
          for (let i = -1; i <= 1; i++) {
            const a = base + i * 0.45;
            this.fireShard(e.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), e.dmg);
          }
          e.state = 'recover'; e.stateT = 0.4 * ATK_SPEED_FACTOR;
          e.atkTimer = e.atkCd * rand(0.75, 1.05) * ATK_SPEED_FACTOR;
        }
      } else if (e.state === 'approach' || e.state === 'recover') {
        if (e.state === 'recover') {
          e.stateT -= dt;
          if (e.stateT <= 0) e.state = 'approach';
        } else {
          e.facing = Math.atan2(dirX, dirZ);
          if (dist > 10) { e.vel.x = dirX * e.spd; e.vel.z = dirZ * e.spd; }
          else if (dist < 5.5) { e.vel.x = -dirX * e.spd * 0.6; e.vel.z = -dirZ * e.spd * 0.6; }
          else { e.vel.x = lerp(e.vel.x, 0, 0.2); e.vel.z = lerp(e.vel.z, 0, 0.2); }
          e.atkTimer -= dt;
          if (dist <= 19 && e.atkTimer <= 0) {
            if (Math.random() < ATK_CHANCE) {
              e.state = 'cast'; e.stateT = 0.65 * ATK_SPEED_FACTOR;
              this.showTelegraph(e, 1.3, 0x7fd4ff, false);
            } else {
              e.atkTimer = 0.5;
            }
          }
        }
      }
      // 减速寒气
      if (dist < 4.5 && e.specialT <= 0) {
        this.player.slowT = Math.max(this.player.slowT, 0.35);
        if (Math.random() < dt * 2) {
          this.spawnParticles(this.poolFine, { n: 4, pos: e.pos, spread: 2, speed: 1, up: 1.5, color: new THREE.Color(0x8fd8ff), life: 0.6 });
        }
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    updateAncient(e, dt, dist, dirX, dirZ) {
      e.specialT -= dt;
      // 冰甲修复
      if (e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.015 * dt);
      }
      // 冰冻光环
      if (dist < 5) this.player.slowT = Math.max(this.player.slowT, 0.5);
      if (e.state === 'approach' || e.state === 'recover') {
        if (e.state === 'recover') {
          e.stateT -= dt;
          if (e.stateT <= 0) e.state = 'approach';
        } else {
          e.facing = Math.atan2(dirX, dirZ);
          if (dist > e.atkRange * 0.85) { e.vel.x = dirX * e.spd; e.vel.z = dirZ * e.spd; }
          else { e.vel.x = lerp(e.vel.x, 0, 0.15); e.vel.z = lerp(e.vel.z, 0, 0.15); }
          e.atkTimer -= dt;
          if (dist <= e.atkRange + 0.6 && e.atkTimer <= 0) {
            if (Math.random() < ATK_CHANCE) {
              e.state = 'windup'; e.stateT = 0.55 * ATK_SPEED_FACTOR;
              this.showTelegraph(e, 1.8, 0xff5544, false);
            } else {
              e.atkTimer = 0.4;
            }
          }
        }
        if (e.specialT <= 0 && dist < 10) {
          if (Math.random() < ATK_CHANCE) {
            e.specialT = 5 * ATK_SPEED_FACTOR;
            e.icicleBurst = 1;
            e.icicleCount = 8;
            e.state = 'burst';
            e.stateT = 0.4 * ATK_SPEED_FACTOR;
          } else {
            e.specialT = 1.2;
          }
        }
      } else if (e.state === 'windup') {
        e.stateT -= dt;
        if (e.stateT <= 0) {
          this.enemyAttack(e);
          e.state = 'recover'; e.stateT = 0.8 * ATK_SPEED_FACTOR;
        }
      } else if (e.state === 'burst') {
        e.stateT -= dt;
        if (e.stateT <= 0 && e.icicleBurst) {
          e.icicleBurst = 0;
          for (let i = 0; i < e.icicleCount; i++) {
            const a = i / e.icicleCount * Math.PI * 2 + rand(-0.2, 0.2);
            const r = rand(2.5, 5.5);
            const x = e.pos.x + Math.cos(a) * r;
            const z = e.pos.z + Math.sin(a) * r;
            this.fireIcicle(new THREE.Vector3(x, this.groundY(x, z) + 16, z), e.dmg * 0.7);
          }
          AudioFX.iceCrack();
          e.state = 'recover'; e.stateT = 0.6 * ATK_SPEED_FACTOR;
        }
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    updateKing(e, dt, dist, dirX, dirZ) {
      const ratio = e.hp / e.maxHp;
      const newPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      if (newPhase !== e.phase) {
        e.phase = newPhase;
        e.vel.multiplyScalar(0.3);
        this.spawnParticles(this.poolChunky, { n: 40, pos: e.pos, spread: 2.5, speed: 7, up: 4, color: new THREE.Color(0xffd166), life: 0.9 });
        AudioFX.bossRoar();
        this.shake(0.6);
        if (e.phase === 2) window.UI.toast('👑 企鹅王发怒了！召唤皇家卫队！', 'warn');
        if (e.phase === 3) window.UI.toast('🌪️ 企鹅王进入狂暴状态！暴风雪降临！', 'warn');
        if (e.phase >= 2 && !e.summon2) {
          e.summon2 = true;
          e.kingTimer = 0.5;
        }
        if (e.phase === 3 && !e.summon3) {
          e.summon3 = true;
          e.kingTimer = 0.5;
        }
      }
      e.kingTimer -= dt;
      if (e.kingTimer <= 0 && e.state !== 'windup' && e.state !== 'slide') {
        if (Math.random() >= ATK_CHANCE) {
          e.kingTimer = 1.0;
        } else {
          e.kingTimer = (e.phase === 3 ? 3.5 : 4.2) * ATK_SPEED_FACTOR;
          const opts = ['swipe'];
          opts.push('charge');
          if (e.phase >= 2) opts.push('breath');
          if (e.phase === 3) opts.push('storm');
          if (e.phase >= 2 && e.summon2 && !e.summon2done) { opts.push('summon'); e.summon2done = true; }
          if (e.phase === 3 && e.summon3 && !e.summon3done) { opts.push('summon'); e.summon3done = true; }
          e.kingMove = opts[randi(0, opts.length - 1)];
          e.state = 'windup';
          if (e.kingMove === 'swipe') e.stateT = 0.45 * ATK_SPEED_FACTOR;
          if (e.kingMove === 'charge') e.stateT = 0.5 * ATK_SPEED_FACTOR;
          if (e.kingMove === 'breath') e.stateT = 0.7 * ATK_SPEED_FACTOR;
          if (e.kingMove === 'storm') e.stateT = 0.35 * ATK_SPEED_FACTOR;
          if (e.kingMove === 'summon') e.stateT = 0.55 * ATK_SPEED_FACTOR;
          e.vel.set(0, 0, 0);
          if (e.kingMove === 'charge') this.showTelegraph(e, 4, 0xff8855, true);
          else if (e.kingMove === 'breath') this.showTelegraph(e, 7, 0x7fd4ff, true);
          else this.showTelegraph(e, 2.2, 0xff5544, false);
          AudioFX.penguin(0.25);
        }
      }
      if (e.state === 'windup') {
        e.stateT -= dt;
        if (e.stateT <= 0) this.kingExecute(e, dirX, dirZ, dist);
      } else if (e.state === 'slide') {
        e.slideT -= dt;
        e.vel.set(e.slideDir.x * 20, 0, e.slideDir.z * 20);
        this.spawnParticles(this.poolFine, { n: 5, pos: e.pos, spread: 1.2, speed: 3, up: 1.2, color: new THREE.Color(0xffffff), life: 0.5 });
        if (dist < 2.0 && !e.slideHitDone) {
          e.slideHitDone = true;
          this.applyPlayerDamage(e.dmg * 1.3, e.pos);
          e.state = 'recover'; e.stateT = 0.8 * ATK_SPEED_FACTOR;
        } else if (e.slideT <= 0) {
          e.state = 'recover'; e.stateT = 0.7 * ATK_SPEED_FACTOR;
        }
      } else if (e.state === 'recover') {
        e.stateT -= dt;
        if (e.stateT <= 0) e.state = 'approach';
      } else {
        // approach
        e.facing = Math.atan2(dirX, dirZ);
        const sp = e.spd * (e.phase === 3 ? 1.35 : 1);
        if (dist > 2.4) { e.vel.x = dirX * sp; e.vel.z = dirZ * sp; }
        else { e.vel.x = lerp(e.vel.x, 0, 0.2); e.vel.z = lerp(e.vel.z, 0, 0.2); }
      }
      this.moveEnemy(e, dt);
      this.animateEnemy(e, dt);
    }

    kingExecute(e, dirX, dirZ, dist) {
      const mv = e.kingMove;
      if (mv === 'swipe') {
        if (dist < 3.4) {
          this.applyPlayerDamage(e.dmg, e.pos);
          this.spawnParticles(this.poolFine, { n: 10, pos: this.player.pos, spread: 1, speed: 4, up: 2, color: new THREE.Color(0xffe0c0), life: 0.5 });
        }
        AudioFX.swing();
        e.state = 'recover'; e.stateT = 0.55 * ATK_SPEED_FACTOR;
      } else if (mv === 'charge') {
        e.slideHitDone = false;
        e.slideDir = new THREE.Vector3(dirX, 0, dirZ).normalize();
        e.slideT = 0.85;
        e.state = 'slide';
        AudioFX.dash();
      } else if (mv === 'breath') {
        AudioFX.beam();
        const base = Math.atan2(dirX, dirZ);
        for (let i = 0; i < 30; i++) {
          const a = base + rand(-0.6, 0.6);
          const sp = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
          this.spawnParticles(this.poolFine, { n: 1, pos: e.pos.clone().add(new THREE.Vector3(0, 1.8, 0)), dir: sp, spreadX: 0.3, spreadZ: 0.3, speed: 14, life: 0.6, random: false, color: new THREE.Color(0x9fe8ff) });
        }
        this.shake(0.2);
        const pd = Math.hypot(this.player.pos.x - e.pos.x, this.player.pos.z - e.pos.z);
        if (pd < 9) {
          const pa = Math.atan2(this.player.pos.x - e.pos.x, this.player.pos.z - e.pos.z);
          let diff = Math.abs(pa - base);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < 0.9) {
            this.applyPlayerDamage(e.dmg * 0.9, e.pos);
            this.player.slowT = Math.max(this.player.slowT, 2.5);
          }
        }
        e.state = 'recover'; e.stateT = 0.8 * ATK_SPEED_FACTOR;
      } else if (mv === 'storm') {
        for (let i = 0; i < 5; i++) {
          const a = rand(0, Math.PI * 2);
          const r = rand(2, 6);
          const x = this.player.pos.x + Math.cos(a) * r;
          const z = this.player.pos.z + Math.sin(a) * r;
          this.addAoe(new THREE.Vector3(x, this.groundY(x, z), z), 2.2, 1.2, e.dmg * 0.65);
          this.spawnParticles(this.poolFine, { n: 6, pos: new THREE.Vector3(x, this.groundY(x, z) + 0.2, z), spread: 1.6, speed: 1, up: 1, color: new THREE.Color(0x9fe8ff), life: 0.8 });
        }
        AudioFX.iceCrack();
        e.state = 'recover'; e.stateT = 0.6 * ATK_SPEED_FACTOR;
      } else if (mv === 'summon') {
        const kinds = e.phase === 2 ? ['elite', 'armored', 'chick'] : ['ancient', 'elite', 'wizard'];
        const cnt = e.phase === 2 ? 3 : 4;
        for (let i = 0; i < cnt; i++) {
          const a = i / cnt * Math.PI * 2;
          const x = e.pos.x + Math.cos(a) * 4;
          const z = e.pos.z + Math.sin(a) * 4;
          this.spawnEnemy(kinds[randi(0, kinds.length - 1)], new THREE.Vector3(x, this.groundY(x, z), z));
        }
        window.UI.toast('👑 皇家卫队出动！', 'warn');
        AudioFX.waveStart();
        e.state = 'recover'; e.stateT = 1.0 * ATK_SPEED_FACTOR;
      }
    }

    enemyAttack(e) {
      const t = e.cfg;
      const p = this.player;
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z;
      const dist = Math.hypot(dx, dz);
      if (e.special === 'slide') {
        e.slideHitDone = false;
        e.slideDir = new THREE.Vector3(dx / dist, 0, dz / dist);
        e.slideT = 0.7;
        e.state = 'slide';
        AudioFX.dash();
        return;
      }
      if (t.ranged) {
        const dir = new THREE.Vector3(dx / dist, 0, dz / dist);
        this.fireSpike(e.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), dir, e.dmg);
        AudioFX.penguin(0.14);
        e.atkTimer = e.atkCd * ATK_SPEED_FACTOR;
        return;
      }
      const dirToP = new THREE.Vector3(dx / dist, 0, dz / dist);
      e.facing = Math.atan2(dx, dz);
      e.vel.x += dirToP.x * 3.5; e.vel.z += dirToP.z * 3.5;
      if (dist < e.atkRange + 0.8) {
        let dmg = e.dmg;
        if (e.dmgDownT > 0) dmg = Math.round(dmg * 0.8);
        if (e.buffT > 0) dmg = Math.round(dmg * 1.15);
        if (e.type === 'assassin') {
          const pdir = this.aimDir();
          if (pdir.dot(dirToP) < -0.3) dmg = Math.round(dmg * 2);
        }
        this.applyPlayerDamage(dmg, e.pos);
        if (t.jump) {
          e.vel.y = 3.5;
          e.lungeT = 0.35;
        }
        AudioFX.penguin(0.18);
      }
      e.atkTimer = e.atkCd * rand(0.85, 1.2) * ATK_SPEED_FACTOR;
    }

    moveEnemy(e, dt) {
      const gy = this.groundY(e.pos.x, e.pos.z);
      e.pos.x += e.vel.x * dt;
      e.pos.z += e.vel.z * dt;
      if (e.lungeT) {
        e.lungeT -= dt;
      }
      if (e.state === 'burrowwindup' || e.burrowPhase === 1) {
        // 保持入地状态
      } else {
        e.pos.y += e.vel.y * dt;
        e.vel.y -= GRAVITY * dt;
        if (e.pos.y < gy) { e.pos.y = gy; e.vel.y = 0; }
      }
      const d = Math.hypot(e.pos.x, e.pos.z);
      if (d > ARENA_R) {
        e.pos.x *= ARENA_R / d;
        e.pos.z *= ARENA_R / d;
        e.vel.multiplyScalar(0.4);
      }
      this.resolveColliders(e.pos, Math.max(0.3, 0.5 * e.baseScale));
      e.group.position.copy(e.pos);
      e.group.rotation.y = lerpAngle(e.group.rotation.y, e.facing || 0, 0.15);
    }

    animateEnemy(e, dt) {
      const r = e.refs;
      const moving = Math.hypot(e.vel.x, e.vel.z) > 0.5;
      const spd = e.cfg.spd;
      if (e.state === 'slide' || e.kingMove === 'charge' && e.state === 'slide') {
        r.bodyGrp.rotation.x = lerp(r.bodyGrp.rotation.x, -1.25, 0.2);
      } else {
        r.bodyGrp.rotation.x = lerp(r.bodyGrp.rotation.x, 0, 0.15);
      }
      if (moving && e.state !== 'windup' && e.state !== 'cast' && e.state !== 'aim' && e.state !== 'boom') {
        r.bodyGrp.position.y = Math.abs(Math.sin(e.animT * 7)) * 0.045;
        r.flipperL.rotation.z = Math.sin(e.animT * 8) * 0.32 - 0.32;
        r.flipperR.rotation.z = -Math.sin(e.animT * 8) * 0.32 + 0.32;
        r.footL.rotation.y = Math.sin(e.animT * 7) * 0.35;
        r.footR.rotation.y = Math.sin(e.animT * 7 + Math.PI) * 0.35;
      } else {
        r.bodyGrp.position.y = Math.abs(Math.sin(e.animT * 2.4)) * 0.018;
        r.flipperL.rotation.z = lerp(r.flipperL.rotation.z, -0.3, 0.1);
        r.flipperR.rotation.z = lerp(r.flipperR.rotation.z, 0.3, 0.1);
        r.footL.rotation.y = 0; r.footR.rotation.y = 0;
      }
      if (e.state === 'windup') r.bodyGrp.position.y = lerp(r.bodyGrp.position.y, 0.06, 0.2);
      if (e.stealthOn) {
        const op = e.hurtFlash > 0 ? 1 : 0.18 + Math.sin(e.animT * 10) * 0.05;
        e.group.traverse(o => {
          if (o.isMesh && o.material) {
            o.material.transparent = true;
            o.material.opacity = op;
          }
        });
      } else if (e.hurtFlash > 0) {
        e.group.scale.setScalar(e.baseScale * (1 + Math.sin(this.time * 50) * 0.04));
      } else {
        e.group.scale.setScalar(e.baseScale);
      }
      // 恢复透明度
      if (!e.stealthOn && e.group.userData.restored !== true) {
        e.group.userData.restored = true;
        e.group.traverse(o => {
          if (o.isMesh && o.material && o.material.userData.baseOpacity !== undefined) {
            o.material.opacity = o.material.userData.baseOpacity;
          }
        });
      }
    }

    showTelegraph(e, radius, color, directional) {
      if (e.telegraph) { this.scene.remove(e.telegraph); e.telegraph = null; }
      const disc = Models.makeDisc(color, 0.32);
      disc.scale.setScalar(radius);
      disc.position.copy(e.pos);
      disc.position.y = this.groundY(e.pos.x, e.pos.z) + 0.07;
      this.scene.add(disc);
      e.telegraph = disc;
    }

    /* ---------- 投射物 ---------- */
    fireShard(pos, dir, dmg) {
      const mesh = makeIceShardScale(0.9);
      mesh.position.copy(pos);
      const dirX = dir.x, dirZ = dir.z;
      mesh.rotation.y = Math.atan2(dirX, dirZ);
      this.scene.add(mesh);
      const vel = new THREE.Vector3(dirX, 0.3, dirZ).normalize().multiplyScalar(18);
      this.projectiles.push({ kind: 'shard', from: 'enemy', mesh, pos: pos.clone(), vel, dmg, life: 4 });
    }

    fireSpike(pos, dir, dmg) {
      const mesh = makeIceShardScale(1.0);
      mesh.position.copy(pos);
      const dirX = dir.x, dirZ = dir.z;
      mesh.rotation.y = Math.atan2(dirX, dirZ);
      this.scene.add(mesh);
      this.projectiles.push({ kind: 'spike', from: 'enemy', mesh, pos: pos.clone(), vel: new THREE.Vector3(dirX * 19.5, 5.5, dirZ * 19.5), dmg, life: 4, grav: 9.5 });
    }

    fireIcicle(pos, dmg) {
      const mesh = makeIceShardScale(0.75);
      mesh.position.copy(pos);
      mesh.rotation.x = Math.PI / 2;
      this.scene.add(mesh);
      this.projectiles.push({ kind: 'icicle', from: 'enemy', mesh, pos: pos.clone(), vel: new THREE.Vector3(0, -24, 0), dmg, life: 3, grav: 0 });
    }

    updateProjectiles(dt) {
      const p = this.player;
      const keep = [];
      for (const pr of this.projectiles) {
        pr.life -= dt;
        if (pr.life <= 0) { this.scene.remove(pr.mesh); continue; }
        if (pr.grav) pr.vel.y -= pr.grav * dt;
        pr.pos.addScaledVector(pr.vel, dt);
        pr.mesh.position.copy(pr.pos);
        const gy = this.groundY(pr.pos.x, pr.pos.z);
        let remove = false;
        if (pr.pos.y <= gy + 0.05) {
          remove = true;
          if (pr.kind === 'spike') {
            this.spawnParticles(this.poolFine, { n: 10, pos: pr.pos, spread: 1, speed: 3, up: 2, color: new THREE.Color(0xbfe9ff), life: 0.5 });
            if (p.pos.distanceTo(pr.pos) < 1.8) this.applyPlayerDamage(pr.dmg, pr.pos);
          }
          if (pr.kind === 'icicle') {
            this.spawnParticles(this.poolFine, { n: 12, pos: pr.pos, spread: 1.2, speed: 4, up: 2, color: new THREE.Color(0x9fe8ff), life: 0.5 });
            AudioFX.iceCrack();
            if (p.pos.distanceTo(pr.pos) < 1.1) this.applyPlayerDamage(pr.dmg, pr.pos);
          }
        }
        if (!remove && pr.kind === 'shard' && pr.from === 'enemy' && p.pos.distanceTo(pr.pos) < 0.9) {
          this.applyPlayerDamage(pr.dmg, pr.pos);
          this.spawnParticles(this.poolFine, { n: 8, pos: pr.pos, spread: 0.7, speed: 3, up: 2, color: new THREE.Color(0xbfe9ff), life: 0.4 });
          remove = true;
        }
        if (remove) this.scene.remove(pr.mesh);
        else keep.push(pr);
      }
      this.projectiles = keep;
    }

    addAoe(pos, radius, delay, dmg) {
      this.aoes = this.aoes || [];
      const mark = Models.makeDisc(0x7fd4ff, 0.4);
      mark.scale.setScalar(radius);
      mark.position.copy(pos);
      mark.position.y += 0.06;
      this.scene.add(mark);
      this.aoes.push({ pos, radius, t: delay, dmg, mark });
    }

    updateAoes(dt) {
      if (!this.aoes) return;
      const keep = [];
      for (const a of this.aoes) {
        a.t -= dt;
        if (a.t <= 0) {
          this.scene.remove(a.mark);
          this.spawnParticles(this.poolChunky, { n: 16, pos: a.pos, spread: a.radius * 0.6, spreadY: 0.5, speed: 5, up: 4, color: new THREE.Color(0x9fe8ff), life: 0.7 });
          AudioFX.iceCrack();
          if (this.player.pos.distanceTo(a.pos) < a.radius) this.applyPlayerDamage(a.dmg, a.pos);
          continue;
        }
        keep.push(a);
      }
      this.aoes = keep;
    }

    /* ---------- 波次与胜负 ---------- */
    updateWaves(dt) {
      const waves = LEVELS[this.levelIndex].waves;
      if (this.wavePause > 0) {
        this.wavePause -= dt;
        if (this.wavePause <= 0) this.startWave(this.waveIndex);
        return;
      }
      if (this.spawnQueue.length > 0) {
        const head = this.spawnQueue[0];
        head.delay -= dt;
        if (head.delay <= 0) {
          this.spawnQueue.shift();
          const a = rand(0, Math.PI * 2);
          const rr = ENEMY_TYPES[head.type].boss ? rand(7, 9) : rand(48, 55);
          const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
          this.spawnEnemy(head.type, new THREE.Vector3(x, this.groundY(x, z), z));
        }
      } else if (this.enemies.every(e => e.dead)) {
        this.enemies = this.enemies.filter(e => !e.dead);
        if (this.waveIndex < waves.length - 1) {
          this.waveIndex++;
          this.wavePause = 3.2;
          window.UI.toast('✅ 第 ' + (this.waveIndex) + ' 波击退！', 'good');
        } else if (!this.victoryDone) {
          this.victory();
        }
      }
    }

    victory() {
      if (this.victoryDone) return;
      this.victoryDone = true;
      const p = this.player;
      const ratio = p.hp / p.maxHp;
      const stars = ratio >= 0.7 ? 3 : ratio >= 0.4 ? 2 : 1;
      const idx = this.levelIndex + 1;
      this.save.stars = this.save.stars || {};
      this.save.stars[idx] = Math.max(this.save.stars[idx] || 0, stars);
      if (!ALL_LEVELS_OPEN && idx === this.save.unlocked && idx < LEVELS.length) this.save.unlocked++;
      const bonus = 40 + stars * 20;
      this.addXp(bonus, true);
      this.persist();
      this.state = 'victory';
      this.releasePointer();
      AudioFX.victory();
      this.player.dead = true; // 冻结操作
      window.UI.showResult(this, 'win', { stars, bonus });
    }

    /* ---------- 天气 ---------- */
    updateWeather(dt) {
      const target = this.weather.blizzard && this.time < this.weather.until ? 1 : 0;
      this.weather.strength = lerp(this.weather.strength, target, Math.min(1, dt * 0.35));
      AudioFX.setWind(this.weather.strength);
      if (this.weather.blizzard && this.time >= this.weather.until) {
        this.weather.blizzard = false;
        window.UI.toast('🌤️ 暴风雪过去了', 'good');
      }
      if (this.weather.blizzard && !this.weather.notified) {
        this.weather.notified = true;
        window.UI.toast('🌨️ 暴风雪！能见度下降，企鹅加速', 'warn');
      }
      const tag = document.getElementById('weather-tag');
      if (this.weather.blizzard) tag.classList.remove('hidden');
      else if (this.weather.strength < 0.2) tag.classList.add('hidden');
    }

    /* ---------- 雷达 ---------- */
    updateRadar() {
      const cv = document.getElementById('radar');
      if (!cv || cv.classList.contains('hidden')) return;
      const g = cv.getContext('2d');
      g.clearRect(0, 0, 168, 168);
      g.save();
      g.translate(84, 84);
      g.strokeStyle = 'rgba(127,212,255,0.3)';
      g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, 60, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(-72, 0); g.lineTo(72, 0); g.moveTo(0, -72); g.lineTo(0, 72); g.stroke();
      const p = this.player;
      const scale = 72 / 58;
      g.fillStyle = '#7fffd4';
      g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill();
      const facing = Math.atan2(p.faceDir ? p.faceDir.x : 0, p.faceDir ? p.faceDir.z : 0);
      g.strokeStyle = '#7fffd4';
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.sin(facing) * 10, Math.cos(facing) * 10);
      g.stroke();
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = (e.pos.x - p.pos.x) * scale;
        const dz = (e.pos.z - p.pos.z) * scale;
        if (Math.hypot(dx, dz) > 72) continue;
        g.fillStyle = e.cfg.boss ? '#ffd166' : '#ff5a4a';
        g.beginPath(); g.arc(dx, dz, e.cfg.boss ? 5 : 3, 0, Math.PI * 2); g.fill();
      }
      for (const d of this.drops) {
        const dx = (d.pos.x - p.pos.x) * scale;
        const dz = (d.pos.z - p.pos.z) * scale;
        if (Math.hypot(dx, dz) > 72) continue;
        g.fillStyle = d.kind === 'gold' ? '#ffd166' : '#7dffa8';
        g.fillRect(dx - 1.5, dz - 1.5, 3, 3);
      }
      g.restore();
    }
  }

  /* ---------- 辅助 ---------- */
  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }
  function makeGlowScale(r) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    return m;
  }
  function makeBeamScale(len) {
    return Models.makeBeam(len);
  }
  function makeIceShardScale(s) {
    const m = Models.makeIceShard();
    m.scale.setScalar(s);
    return m;
  }

  window.Game = new Game();
  window.Game.SKILL_DEFS = SKILL_DEFS;
  window.Game.SKILL_LVLS = SKILL_LVLS;
  window.Game.ENEMY_TYPES = ENEMY_TYPES;
  window.Game.LEVELS = LEVELS;
  window.Game.xpNeed = xpNeed;
  window.Game.ALL_LEVELS_OPEN = ALL_LEVELS_OPEN;
})();
