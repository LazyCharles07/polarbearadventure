/* 极地风暴 - 界面模块 */
(function () {
  'use strict';

  let LEVELS, ENEMY_TYPES, SKILL_DEFS, SKILL_LVLS, xpNeed;

  const UI = {
    sens: 1.875,
    _briefIndex: 0,
    _pendingResult: null,
    _toasts: 0,

    init(game) {
      this.game = game;
      LEVELS = window.Game.LEVELS;
      ENEMY_TYPES = window.Game.ENEMY_TYPES;
      SKILL_DEFS = window.Game.SKILL_DEFS;
      SKILL_LVLS = window.Game.SKILL_LVLS;
      xpNeed = window.Game.xpNeed;
      const $ = id => document.getElementById(id);
      const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

      on('btn-start', () => { AudioFX.init(); AudioFX.resume(); AudioFX.uiClick(); game.goMap(); });
      on('btn-help', () => { AudioFX.uiClick(); this.showScreen('help'); });
      on('btn-credit', () => { AudioFX.uiClick(); this.showScreen('credit'); });
      on('btn-reset-save', () => {
        if (!window.confirm('确定清空所有进度并恢复初始状态吗？此操作不可撤销。')) return;
        game.resetSave();
        game.clearBattleEntities();
        game.state = 'menu';
        if (game.showcase) game.showcase.visible = true;
        this.hideBoss();
        this.showScreen('menu');
        AudioFX.uiClick();
      });
      on('btn-sound', () => {
        AudioFX.init();
        AudioFX.enabled = !AudioFX.enabled;
        AudioFX.setEnabled(AudioFX.enabled);
        $('btn-sound').textContent = '音效：' + (AudioFX.enabled ? '开' : '关');
        AudioFX.uiClick();
      });
      on('btn-map-back', () => { AudioFX.uiClick(); game.state = 'menu'; this.showScreen('menu'); });
      on('btn-fight', () => { AudioFX.uiClick(); game.startLevel(this._briefIndex); });
      on('btn-upgrade-done', () => { AudioFX.uiClick(); this.showResult(game, 'win', this._pendingResult); });
      on('btn-result-retry', () => { AudioFX.uiClick(); game.startLevel(game.levelIndex); });
      on('btn-result-map', () => { AudioFX.uiClick(); game.goMap(); });
      on('btn-result-next', () => { AudioFX.uiClick(); game.startLevel(game.levelIndex + 1); });
      on('btn-resume', () => { AudioFX.uiClick(); game.togglePause(); });
      on('btn-restart', () => { AudioFX.uiClick(); game.startLevel(game.levelIndex); });
      on('btn-exit', () => { AudioFX.uiClick(); game.goMap(); });
      on('btn-quit-menu', () => { AudioFX.uiClick(); game.clearBattleEntities(); game.state = 'menu'; this.showScreen('menu'); });
      on('btn-map-back', () => { if (game.showcase) game.showcase.visible = true; });
      on('btn-quit-menu', () => { if (game.showcase) game.showcase.visible = true; });
      on('btn-help-back', () => { AudioFX.uiClick(); this.showScreen('menu'); });
      on('btn-credit-back', () => { AudioFX.uiClick(); this.showScreen('menu'); });

      const sensEl = $('sens-slider');
      this.sens = sensEl.value / 80;
      sensEl.addEventListener('input', () => { this.sens = sensEl.value / 80; });
      const volEl = $('vol-slider');
      volEl.addEventListener('input', () => { AudioFX.setVolume(volEl.value / 100); });

      this.setupTouch(game);
      this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    },

    /* ---------- 屏幕切换 ---------- */
    showScreen(name) {
      const screens = ['menu', 'level-select', 'briefing', 'upgrade', 'result', 'pause', 'help', 'credit'];
      for (const s of screens) {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
      }
      const el = document.getElementById(name);
      if (el) el.classList.remove('hidden');
      document.getElementById('hud').classList.toggle('hidden', name !== 'hud');
      const tui = document.getElementById('touch-ui');
      tui.classList.toggle('hidden', !(this.isTouch && name === 'hud'));
      // 战斗中隐藏系统鼠标光标，只保留中心准星；其他界面恢复光标
      if (this.game && this.game.renderer) {
        this.game.renderer.domElement.style.cursor = name === 'hud' ? 'none' : '';
      }
      if (name === 'level-select') this.renderMap(this.game);
    },

    /* ---------- 提示 ---------- */
    toast(text, cls) {
      const box = document.getElementById('msg-center');
      if (box.childElementCount > 3) box.firstChild.remove();
      const d = document.createElement('div');
      d.className = 'toast ' + (cls || '');
      d.textContent = text;
      box.appendChild(d);
      setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2700);
    },

    floatText(worldPos, text, color, crit) {
      const g = this.game;
      if (!g || !g.camera) return;
      const v = worldPos.clone().add(new THREE.Vector3(0, 1.6, 0));
      v.project(g.camera);
      if (v.z > 1) return;
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      const d = document.createElement('div');
      d.className = 'float-text ' + (crit ? 'crit' : text.startsWith('-') ? 'dmg' : text.startsWith('+治疗') || text.includes('生命') ? 'heal' : 'dmg');
      d.textContent = text;
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      d.style.color = color || '#fff';
      document.getElementById('fx-layer').appendChild(d);
      setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 1000);
    },

    /* ---------- HUD ---------- */
    setWave(game, cur, total, cfg) {
      document.getElementById('wave-title').textContent = '第 ' + (game.levelIndex + 1) + ' 关 · ' + cfg.name;
      document.getElementById('wave-info').textContent = cfg.line;
    },

    setCombo(n) {
      const w = document.getElementById('combo-wrap');
      if (n >= 2) {
        w.classList.remove('hidden');
        document.getElementById('combo-num').textContent = 'x' + n;
      } else {
        w.classList.add('hidden');
      }
    },

    setBoss(hp, max, name) {
      const panel = document.getElementById('boss-panel');
      panel.classList.remove('hidden');
      document.getElementById('wave-panel').classList.add('hidden');
      document.getElementById('boss-name').textContent = '👑 ' + name;
      document.getElementById('boss-bar').querySelector('span').style.width = Math.max(0, hp / max * 100) + '%';
    },
    hideBoss() {
      document.getElementById('boss-panel').classList.add('hidden');
      document.getElementById('wave-panel').classList.remove('hidden');
    },

    buildSkillBar(game) {
      const bar = document.getElementById('skill-bar');
      bar.innerHTML = '';
      for (let idx = 1; idx <= 5; idx++) {
        const def = SKILL_DEFS ? SKILL_DEFS[idx] : null;
        if (!def) continue;
        const lvl = game.skillLevel(idx);
        const locked = (def.unlockLv > 0 && game.unlockedCount() <= def.unlockLv) || lvl <= 0;
        const d = document.createElement('div');
        d.className = 'skill' + (locked ? ' locked' : '');
        d.dataset.idx = idx;
        const cost = lvl > 0 && SKILL_LVLS && SKILL_LVLS[def.id] ? (SKILL_LVLS[def.id].energy[lvl] || 0) : 0;
        d.innerHTML =
          '<span class="sk-key">' + def.key + '</span>' +
          '<span class="sk-icon">' + def.icon + '</span>' +
          '<span class="sk-name">' + (locked ? '未解锁' : def.name) + '</span>' +
          (cost ? '<span class="sk-cost">' + cost + '⚡</span>' : '') +
          '<div class="cd-mask hidden"></div>';
        bar.appendChild(d);
      }
    },

    update(game, dt) {
      const p = game.player;
      if (!p) return;
      const hud = document.getElementById('hud');
      if (game.state === 'battle' || game.state === 'victory' || game.state === 'defeat' || game.state === 'pause') {
        hud.classList.remove('hidden');
        document.getElementById('lv-badge').textContent = 'Lv.' + game.save.level;
        document.getElementById('hp-bar').querySelector('span').style.width = Math.max(0, p.hp / p.maxHp * 100) + '%';
        document.getElementById('hp-text').textContent = Math.ceil(p.hp) + '/' + p.maxHp;
        document.getElementById('ep-bar').querySelector('span').style.width = Math.max(0, p.energy / p.maxEnergy * 100) + '%';
        document.getElementById('ep-text').textContent = Math.floor(p.energy);
        const need = xpNeed(game.save.level);
        document.getElementById('xp-bar').querySelector('span').style.width = Math.min(100, game.save.xp / need * 100) + '%';
        document.getElementById('xp-text').textContent = game.save.xp + '/' + need;
        const alive = game.enemies.filter(e => !e.dead).length;
        document.getElementById('enemy-count').textContent = '敌方 ' + alive;
        this.updateSkillBar(game);
      }
    },

    updateSkillBar(game) {
      const bar = document.getElementById('skill-bar');
      for (const el of bar.children) {
        const idx = parseInt(el.dataset.idx, 10);
        const cd = game.player.skillCd[idx];
        const def = SKILL_DEFS[idx];
        const lvl = game.skillLevel(idx);
        const locked = (def.unlockLv > 0 && game.unlockedCount() <= def.unlockLv) || lvl <= 0;
        const mask = el.querySelector('.cd-mask');
        if (cd > 0) {
          mask.classList.remove('hidden');
          const total = SKILL_LVLS[def.id].cd[lvl] || 1;
          mask.style.height = (cd / total * 100) + '%';
          mask.textContent = cd > 0.5 ? Math.ceil(cd) : '';
          el.classList.remove('ready');
        } else {
          mask.classList.add('hidden');
          el.classList.toggle('ready', !locked && game.player.energy >= (SKILL_LVLS[def.id].energy[lvl] || 0));
        }
      }
    },

    /* ---------- 关卡地图 ---------- */
    renderMap(game) {
      const path = document.getElementById('map-path');
      path.innerHTML = '';
      const stats = document.getElementById('map-stats');
      stats.textContent = '已解锁 ' + game.unlockedCount() + '/' + LEVELS.length + ' 关' +
        (game.ALL_LEVELS_OPEN ? ' · 全关卡测试开放' : '') +
        ' · 攻击 +' + (game.save.bonusAtk || 0);
      for (let i = 0; i < LEVELS.length; i++) {
        const unlocked = i + 1 <= game.unlockedCount();
        const node = document.createElement('div');
        node.className = 'level-node' + (unlocked ? '' : ' locked');
        if (i === game.levelIndex && game.state === 'map') node.classList.add('current');
        const waveKeys = Object.keys(LEVELS[i].waves[LEVELS[i].waves.length - 1]);
        const rep = waveKeys[waveKeys.length - 1];
        const meta = ENEMY_TYPES[rep];
        const stars = (game.save.stars && game.save.stars[i + 1]) || 0;
        node.innerHTML =
          '<div class="ln-num">' + (i + 1) + '</div>' +
          '<div class="ln-icon">' + (unlocked ? meta.icon : '🔒') + '</div>' +
          '<div class="ln-inf"><div class="ln-name">' + (i + 1) + '. ' + LEVELS[i].name + '</div>' +
          '<div class="ln-sub">' + (unlocked ? '最终强敌：' + meta.name : '???' ) + '</div></div>' +
          '<div class="ln-stars">' + (unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '') + '</div>';
        if (unlocked) {
          node.addEventListener('click', () => {
            AudioFX.uiClick();
            this.openBriefing(game, i);
          });
        }
        path.appendChild(node);
        if (i < LEVELS.length - 1) {
          const line = document.createElement('div');
          line.className = 'ln-line';
          path.appendChild(line);
        }
      }
    },

    openBriefing(game, i) {
      this._briefIndex = i;
      const cfg = LEVELS[i];
      document.getElementById('brief-title').textContent = '第 ' + (i + 1) + ' 关 · ' + cfg.name;
      document.getElementById('brief-desc').textContent = cfg.line;
      const box = document.getElementById('brief-enemies');
      box.innerHTML = '';
      const seen = {};
      for (const wave of cfg.waves) {
        for (const t of Object.keys(wave)) {
          if (seen[t]) continue;
          seen[t] = true;
          const meta = ENEMY_TYPES[t];
          const row = document.createElement('div');
          row.className = 'brief-enemy-row';
          row.innerHTML = '<span class="ic">' + meta.icon + '</span><div><div class="nm">' + meta.name + '</div><div class="ds">' + meta.desc + '</div></div>';
          box.appendChild(row);
        }
      }
      const tips = document.getElementById('brief-tips');
      if (cfg.boss) tips.textContent = '⚠️ Boss 战：企鹅王拥有滑铲、冰息、召唤与暴风雪阶段，保持移动并用冲刺躲开红圈。';
      else if (i >= 3) tips.textContent = '💡 提示：优先集火治疗与自爆企鹅；红圈出现时请闪避。';
      else tips.textContent = '💡 提示：用左键连击，1/2/3 键释放技能，Shift 冲刺躲避攻击。';
      game.state = 'briefing';
      this.showScreen('briefing');
    },

    /* ---------- 技能升级 ---------- */
    showUpgrade(game) {
      this.showScreen('upgrade');
      document.getElementById('upgrade-points').textContent = '可用技能点：' + game.save.skillPoints;
      const list = document.getElementById('upgrade-list');
      list.innerHTML = '';
      for (let idx = 0; idx < SKILL_DEFS.length; idx++) {
        const def = SKILL_DEFS[idx];
        const lvl = game.skillLevel(idx);
        const maxed = lvl >= def.maxLv;
        const card = document.createElement('div');
        card.className = 'up-card' + (maxed ? ' maxed' : '');
        const pips = [];
        for (let i = 0; i < def.maxLv; i++) pips.push('<span class="pip' + (i < lvl ? ' on' : '') + '"></span>');
        card.innerHTML =
          '<span class="ic">' + def.icon + '</span>' +
          '<div class="inf"><div class="nm">' + def.name + '</div>' +
          '<div class="ds">' + def.desc(Math.max(1, lvl)) + '</div>' +
          '<div class="pips">' + pips.join('') + '</div></div>';
        const btn = document.createElement('button');
        btn.className = 'add';
        if (maxed) {
          btn.textContent = '转化 +2攻击';
          btn.disabled = game.save.skillPoints <= 0;
          btn.addEventListener('click', () => {
            if (game.save.skillPoints <= 0) return;
            game.save.skillPoints--;
            game.save.bonusAtk += 2;
            game.persist();
            AudioFX.levelUp();
            UI.showUpgrade(game);
          });
        } else {
          btn.textContent = '升级';
          btn.disabled = game.save.skillPoints <= 0;
          btn.addEventListener('click', () => {
            if (game.save.skillPoints <= 0) return;
            game.save.skillPoints--;
            game.save.skillLevels[idx]++;
            game.persist();
            AudioFX.levelUp();
            UI.showUpgrade(game);
          });
        }
        card.appendChild(btn);
        list.appendChild(card);
      }
    },

    /* ---------- 结算 ---------- */
    showResult(game, result, info) {
      if (result === 'win') {
        this._pendingResult = info || null;
        document.getElementById('result-title').textContent = '🎉 胜利！';
        const stars = info ? info.stars : 1;
        const starEl = document.getElementById('result-stars');
        starEl.innerHTML = '<span class="on">★</span>'.repeat(stars) + '<span>☆</span>'.repeat(3 - stars);
        document.getElementById('result-body').innerHTML =
          '评价：' + (stars === 3 ? '完美清剿' : stars === 2 ? '沉着应战' : '惊险取胜') +
          '<br>奖励经验：+' + (info ? info.bonus : 0) +
          '<br>当前等级：Lv.' + game.save.level + ' · 技能点：' + game.save.skillPoints;
        document.getElementById('btn-result-next').classList.toggle('hidden', game.levelIndex + 1 >= LEVELS.length || game.unlockedCount() <= game.levelIndex + 1);
        if (game.save.skillPoints > 0) {
          this.showUpgrade(game);
          return;
        }
      } else {
        document.getElementById('result-title').textContent = '💔 战败…';
        document.getElementById('result-stars').innerHTML = '';
        document.getElementById('result-body').innerHTML = '企鹅大军还在逼近。调整战术，再试一次！<br>提示：多利用冲刺的无敌帧躲避红圈。';
        document.getElementById('btn-result-next').classList.add('hidden');
      }
      this.showScreen('result');
    },

    /* ---------- 触屏 ---------- */
    setupTouch(game) {
      const joy = document.getElementById('joy-base');
      const knob = document.getElementById('joy-knob');
      let joyId = null;
      const joyZone = document.getElementById('joy-zone');
      joyZone.addEventListener('pointerdown', e => {
        joyId = e.pointerId;
        joyZone.setPointerCapture(joyId);
      });
      joyZone.addEventListener('pointermove', e => {
        if (e.pointerId !== joyId) return;
        const rect = joy.getBoundingClientRect();
        let dx = e.clientX - (rect.left + rect.width / 2);
        let dy = e.clientY - (rect.top + rect.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > 50) { dx = dx / len * 50; dy = dy / len * 50; }
        knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        game.touch.mx = dx / 50;
        game.touch.my = -dy / 50;
      });
      const joyEnd = e => {
        if (e.pointerId !== joyId) return;
        joyId = null;
        knob.style.transform = 'translate(-50%, -50%)';
        game.touch.mx = 0; game.touch.my = 0;
      };
      joyZone.addEventListener('pointerup', joyEnd);
      joyZone.addEventListener('pointercancel', joyEnd);

      // 视角拖动
      let camId = null, lastX = 0;
      document.addEventListener('pointerdown', e => {
        if (camId === null && !e.target.closest('#joy-zone') && !e.target.closest('.tbtn')) {
          camId = e.pointerId;
          lastX = e.clientX;
        }
      });
      document.addEventListener('pointermove', e => {
        if (e.pointerId !== camId) return;
        game.cameraYaw -= (e.clientX - lastX) * 0.006;
        lastX = e.clientX;
      });
      document.addEventListener('pointerup', e => {
        if (e.pointerId === camId) camId = null;
      });

      const btns = {
        't-attack': () => game.playerAttack(),
        't-dash': () => { game.touch.dash = true; },
        't-jump': () => { game.touch.jump = true; },
        't-s1': () => game.castSkill(1),
        't-s2': () => game.castSkill(2),
        't-s3': () => game.castSkill(3),
        't-s4': () => game.castSkill(4),
        't-s5': () => game.castSkill(5)
      };
      for (const id of Object.keys(btns)) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); btns[id](); });
      }
    }
  };

  window.UI = UI;

  // 等所有脚本加载完成后启动
  window.addEventListener('load', () => {
    window.Game.init();
  });
})();
