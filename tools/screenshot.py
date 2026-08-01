"""极地风暴 - 无头渲染截图（用于目视检查）"""
import base64
import json
import os
import subprocess
import time
import urllib.parse
import urllib.request
import sys

import websocket

PORT = 9335
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "file:///D:/Charles/Game/index.html"
PROFILE = os.path.join(os.environ["TEMP"], "csgame-shot")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shots")


def main():
    os.makedirs(OUT, exist_ok=True)
    proc = subprocess.Popen(
        [CHROME, "--headless", "--disable-gpu", "--enable-unsafe-swiftshader",
         "--no-first-run", "--remote-allow-origins=*", "--window-size=1280,800",
         f"--remote-debugging-port={PORT}", f"--user-data-dir={PROFILE}", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    try:
        for _ in range(30):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=3)
                break
            except Exception:
                time.sleep(0.5)
        target = json.loads(urllib.request.urlopen(
            urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{urllib.parse.quote(URL, safe='')}", method="PUT"),
            timeout=10
        ).read())
        ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=120)
        mid = [0]

        def send(method, params=None):
            mid[0] += 1
            ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
            return mid[0]

        def call(method, params=None, timeout=60):
            i = send(method, params)
            deadline = time.time() + timeout
            while time.time() < deadline:
                raw = ws.recv()
                if not raw:
                    continue
                msg = json.loads(raw)
                if msg.get("id") == i:
                    return msg.get("result", {})
            return {}

        def evaluate(expr, timeout=60):
            r = call("Runtime.evaluate", {"expression": expr, "returnByValue": True}, timeout)
            return r.get("result", {}).get("value")

        def shot(name):
            r = call("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(r["data"])
            path = os.path.join(OUT, name)
            with open(path, "wb") as f:
                f.write(data)
            print("saved:", path)

        send("Page.enable")
        send("Runtime.enable")
        time.sleep(8)
        shot("01_menu.png")

        evaluate("window.Game.startLevel(0)")
        evaluate("""
          (function(){
            const G = window.Game;
            for (let i = 0; i < 460; i++) G.updateBattle(0.033);
            return G.state;
          })()
        """)
        time.sleep(1)
        shot("02_battle.png")

        evaluate("""
          (function(){
            const G = window.Game;
            G.save.unlocked = 15;
            G.startLevel(14);
            for (let i = 0; i < 400; i++) G.updateBattle(0.033);
            return G.state;
          })()
        """)
        time.sleep(1)
        shot("03_boss.png")

        evaluate("window.Game.goMap()")
        time.sleep(1)
        shot("04_map.png")
        ws.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    sys.exit(main())
