"""极地风暴 - 无头浏览器冒烟测试（Chrome DevTools 协议）"""
import json
import subprocess
import time
import urllib.parse
import urllib.request
import os
import sys

import websocket

PORT = 9334
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "file:///D:/Charles/Polar Bear's Adventure/index.html"
PROFILE = os.path.join(os.environ["TEMP"], "csgame-smoke")


def cdp_json(method, url):
    req = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode())


def main():
    proc = subprocess.Popen(
        [CHROME, "--headless", "--disable-gpu", "--enable-unsafe-swiftshader",
         "--no-first-run", "--remote-allow-origins=*", f"--remote-debugging-port={PORT}",
         f"--user-data-dir={PROFILE}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    try:
        for _ in range(30):
            try:
                cdp_json("GET", f"http://127.0.0.1:{PORT}/json/version")
                break
            except Exception:
                time.sleep(0.5)
        target = cdp_json("PUT", f"http://127.0.0.1:{PORT}/json/new?{urllib.parse.quote(URL, safe='')}")
        ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=60)
        msg_id = 0
        errors = []

        def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            return msg_id

        def evaluate(expr, timeout=60):
            nonlocal msg_id
            msg_id += 1
            ws.send(json.dumps({"id": msg_id, "method": "Runtime.evaluate",
                                "params": {"expression": expr, "returnByValue": True}}))
            ws.settimeout(60)
            deadline = time.time() + timeout
            while time.time() < deadline:
                try:
                    raw = ws.recv()
                except Exception:
                    continue
                if not raw:
                    continue
                msg = json.loads(raw)
                if msg.get("id") == msg_id:
                    return msg.get("result", {}).get("result", {}).get("value")
            return "<timeout>"

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")
        # 预加载目标页面
        # 收集错误
        deadline = time.time() + 12
        ws.settimeout(3)
        while time.time() < deadline:
            try:
                raw = ws.recv()
            except Exception:
                break
            if not raw:
                continue
            msg = json.loads(raw)
            m = msg.get("method")
            if m == "Runtime.exceptionThrown":
                d = msg.get("params", {}).get("exceptionDetails", {})
                errors.append("EXC: " + d.get("text", "") + " | " + d.get("exception", {}).get("description", "")[:300])
            elif m == "Log.entryAdded":
                e = msg.get("params", {}).get("entry", {})
                if e.get("level") in ("error", "warning"):
                    errors.append(e.get("level", "").upper() + ": " + e.get("text", "")[:300])
            elif m == "Runtime.consoleAPICalled":
                if msg.get("params", {}).get("type") == "error":
                    args = msg.get("params", {}).get("args", [])
                    errors.append("CONSOLE: " + " ".join(a.get("value", a.get("description", "")) for a in args)[:300])

        print("== 初始加载 ==")
        print("loading class :", evaluate("document.getElementById('loading').className"))
        print("Game 类型      :", evaluate("typeof window.Game"))
        print("state          :", evaluate("window.Game ? window.Game.state : 'NO_GAME'"))
        print("全部关卡开放   :", evaluate("window.Game ? window.Game.unlockedCount() : -1"))
        print("canvas 尺寸    :", evaluate("window.Game && window.Game.renderer ? (window.Game.renderer.domElement.width+'x'+window.Game.renderer.domElement.height) : 'NO_RENDERER'"))
        print("场景对象数     :", evaluate("window.Game ? window.Game.scene.children.length : -1"))

        print("== 开始第 1 关 ==")
        evaluate("window.Game.startLevel(0)")
        time.sleep(6)
        print("state          :", evaluate("window.Game.state"))
        print("敌人数量       :", evaluate("window.Game.enemies.filter(e=>!e.dead).length"))
        print("玩家血量       :", evaluate("window.Game.player ? window.Game.player.hp : -1"))
        print("波次           :", evaluate("window.Game.waveIndex + 1"))
        print("玩家位置       :", evaluate("JSON.stringify(window.Game.player ? window.Game.player.pos.toArray() : [])"))

        print("== 校验敌人模型 ==")
        print("敌人网格数     :", evaluate("window.Game.enemies.length ? window.Game.enemies[0].group.children.length : -1"))

        print("== 修复项验证 ==")
        print("战斗隐藏鼠标   :", evaluate("window.Game.renderer.domElement.style.cursor"))
        print("初始存档       :", evaluate("JSON.stringify({level: window.Game.save.level, points: window.Game.save.skillPoints, bonusAtk: window.Game.save.bonusAtk, stars: Object.keys(window.Game.save.stars || {}).length, unlocked: window.Game.save.unlocked})"))
        print("鼠标灵敏度初始 :", evaluate("window.UI ? window.UI.sens : -1"))
        print("普通关企鹅伤害 :", evaluate("""
          (function(){
            const G = window.Game;
            G.startLevel(0);
            const e = G.spawnEnemy('chick', new THREE.Vector3(10, G.groundY(10, 10), 10));
            return e.dmg;
          })()
        """))
        print("Boss关企鹅伤害 :", evaluate("""
          (function(){
            const G = window.Game;
            G.startLevel(14);
            const e = G.spawnEnemy('chick', new THREE.Vector3(10, G.groundY(10, 10), 10));
            const d = e.dmg;
            G.startLevel(0);
            return d;
          })()
        """))
        print("攻击吸血       :", evaluate("""
          (function(){
            const G = window.Game;
            const p = G.player;
            p.hp = p.maxHp - 30;
            G.rollLifesteal();
            const diff = Math.round(p.hp - (p.maxHp - 30));
            p.hp = p.maxHp - 1;
            G.rollLifesteal();
            return JSON.stringify({
              diff: diff,
              valid: [2, 4, 6, 8, 10].includes(diff),
              capped: p.hp === p.maxHp
            });
          })()
        """))
        print("攻击速度(初值) :", evaluate("""
          (function(){
            const G = window.Game;
            const e = G.spawnEnemy('chick', new THREE.Vector3(12, G.groundY(12, 12), 12));
            return JSON.stringify({atkTimer: +e.atkTimer.toFixed(2), maxInit: 0.56});
          })()
        """))
        print("玩家-企鹅碰撞 :", evaluate("""
          (function(){
            const G = window.Game;
            const e = G.spawnEnemy('chick', new THREE.Vector3(14, G.groundY(14, 14), 14));
            G.player.pos.copy(e.pos);
            G.collidePlayerEnemies();
            const d = Math.hypot(G.player.pos.x - e.pos.x, G.player.pos.z - e.pos.z);
            const minD = 0.62 + Math.max(0.3, 0.5 * e.baseScale);
            return JSON.stringify({d: +d.toFixed(2), min: +minD.toFixed(2), pass: d >= minD - 0.01});
          })()
        """))
        print("准星元素       :", evaluate("document.getElementById('crosshair').tagName"))
        print("暂停函数       :", evaluate("""
          (function(){
            const G = window.Game;
            G.state = 'battle';
            G.pauseGame();
            const r = G.state === 'pause' ? 'ok' : 'fail';
            G.state = 'battle';
            return r;
          })()
        """))
        print("非锁定鼠标视角 :", evaluate("""
          (function(){
            const G = window.Game;
            G.state = 'battle';
            G.locked = false;
            G.player.locked = false;
            G.player.dead = false;
            G.mouseDX = 0; G.mouseDY = 0; G._lastMX = null; G._lastMY = null;
            document.dispatchEvent(new MouseEvent('mousemove', {clientX: 400, clientY: 300}));
            document.dispatchEvent(new MouseEvent('mousemove', {clientX: 460, clientY: 300}));
            const dx = G.mouseDX;
            const yaw0 = G.cameraYaw;
            G.cameraYaw = 1.0;
            G.updateCamera(0.016);
            const changed = Math.abs(G.cameraYaw - 1.0) > 0.0001;
            G.cameraYaw = yaw0;
            return JSON.stringify({dx: dx, lookApplied: changed});
          })()
        """))
        print("第一人称不歪   :", evaluate("""
          (function(){
            const G = window.Game;
            G.cameraMode = 'fps';
            G.camera.rotation.z = 0.35;
            G.trauma = 0;
            G.updateCamera(0.016);
            const z1 = G.camera.rotation.z;
            G.cameraMode = 'tps';
            return z1;
          })()
        """))
        print("震动不残留    :", evaluate("""
          (function(){
            const G = window.Game;
            G.cameraMode = 'fps';
            G.camera.rotation.z = 0;
            G.trauma = 0.8;
            for (let i = 0; i < 150; i++) G.updateCamera(0.016);
            const z2 = G.camera.rotation.z;
            G.cameraMode = 'tps';
            return z2;
          })()
        """))
        print("前腿=前臂同组   :", evaluate("window.Game.bearModel.refs.armL === window.Game.bearModel.refs.legFL"))
        print("熊网格数量     :", evaluate("(function(){let n=0;window.Game.bearModel.group.traverse(o=>{if(o.isMesh)n++});return n;})()"))
        print("showcase 隐藏  :", evaluate("window.Game.showcase ? window.Game.showcase.visible : 'N/A'"))
        print("幼崽体色       :", evaluate("(function(){const m=window.Models.buildPenguin('chick');return m.refs.bodyGrp.children[0].material.color.getHexString();})()"))
        print("成年企鹅体色   :", evaluate("(function(){const m=window.Models.buildPenguin('adelie');return m.refs.bodyGrp.children[0].material.color.getHexString();})()"))
        print("W 键方向(应为负):", evaluate("""
          (function(){
            const G = window.Game;
            for (let i = 0; i < 160; i++) G.updateBattle(0.033);
            G.keys.KeyW = true;
            G.cameraYaw = 0;
            const z0 = G.player.pos.z;
            for (let i = 0; i < 60; i++) G.updateBattle(0.033);
            G.keys.KeyW = false;
            return +(G.player.pos.z - z0).toFixed(2);
          })()
        """))
        print("障碍物碰撞推出 :", evaluate("""
          (function(){
            const G = window.Game;
            const c = G.colliders.find(c => c.r > 0.6);
            if (!c) return 'NO_COLLIDER';
            G.player.pos.set(c.x, G.groundY(c.x, c.z), c.z);
            G.resolveColliders(G.player.pos, 0.62);
            const d = Math.hypot(G.player.pos.x - c.x, G.player.pos.z - c.z);
            return JSON.stringify({
              minDist: +(c.r + 0.62).toFixed(2),
              actual: +d.toFixed(2),
              pass: d >= c.r + 0.62 - 0.01
            });
          })()
        """))
        print("重置存档函数   :", evaluate("""
          (function(){
            const G = window.Game;
            G.save.level = 8; G.save.xp = 500; G.save.skillPoints = 9; G.save.bonusAtk = 5;
            G.save.stars = {3: 2}; G.save.unlocked = 6;
            G.resetSave();
            return JSON.stringify({
              level: G.save.level, points: G.save.skillPoints, bonusAtk: G.save.bonusAtk,
              stars: Object.keys(G.save.stars).length, unlocked: G.save.unlocked
            });
          })()
        """))

        print("== 时间快进验证战斗流程 ==")
        print("快进 30 秒战斗:", evaluate("""
          (function(){
            const G = window.Game;
            for (let i = 0; i < 900; i++) {
              G.updateBattle(0.033);
              if (i % 8 === 0) G.playerAttack();
            }
            return JSON.stringify({
              state: G.state,
              alive: G.enemies.filter(e => !e.dead).length,
              spawned: G.spawnQueue.length,
              hp: G.player ? Math.round(G.player.hp) : -1,
              xp: G.save.xp,
              wave: G.waveIndex + 1
            });
          })()
        """))
        print("== 快进 15 关 Boss 战 ==")
        print("Boss 战状态:", evaluate("""
          (function(){
            const G = window.Game;
            G.save.unlocked = 15;
            G.startLevel(14);
            for (let i = 0; i < 260; i++) {
              G.updateBattle(0.033);
              if (i % 6 === 0) G.playerAttack();
            }
            const king = G.enemies.find(e => e.type === 'king' && !e.dead);
            return JSON.stringify({
              state: G.state,
              kingHp: king ? Math.round(king.hp) : 'NO_KING',
              bossBarShown: !document.getElementById('boss-panel').classList.contains('hidden'),
              playerHp: Math.round(G.player.hp)
            });
          })()
        """))

        print("== 胜利结算与地图 ==")
        print("击杀 Boss:", evaluate("""
          (function(){
            const G = window.Game;
            const king = G.enemies.find(e => e.type === 'king' && !e.dead);
            if (!king) return 'NO_KING';
            king.hp = 1;
            king.pos.copy(G.player.pos);
            king.pos.y = G.groundY(king.pos.x, king.pos.z);
            king.group.position.copy(king.pos);
            G.damageEnemy(king, 99999, new THREE.Vector3(0, 0, 1), {});
            for (let i = 0; i < 30 && G.state === 'battle'; i++) G.updateBattle(0.033);
            return JSON.stringify({
              state: G.state,
              victoryDone: G.victoryDone,
              unlocked: G.save.unlocked,
              stars: G.save.stars[15] || 0
            });
          })()
        """))
        print("升级界面:", evaluate("""
          (function(){
            const G = window.Game;
            if (G.state === 'victory' && G.save.skillPoints > 0) {
              window.UI.showUpgrade(G);
            }
            return JSON.stringify({
              upgradeShown: !document.getElementById('upgrade').classList.contains('hidden'),
              cards: document.getElementById('upgrade-list').children.length,
              points: G.save.skillPoints
            });
          })()
        """))
        print("关卡地图:", evaluate("""
          (function(){
            const G = window.Game;
            G.goMap();
            return JSON.stringify({
              mapShown: !document.getElementById('level-select').classList.contains('hidden'),
              nodes: document.getElementById('map-path').children.length,
              unlocked: G.save.unlocked
            });
          })()
        """))

        print("== 错误收集 ==")
        if errors:
            for e in errors[:25]:
                print(e)
        else:
            print("(无运行时错误)")
        ws.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    sys.exit(main())
