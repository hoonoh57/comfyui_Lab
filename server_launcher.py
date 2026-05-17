#!/usr/bin/env python3
"""ComfyUI Server Launcher & Health Check - RTX 4070 8GB Optimized"""
import subprocess, sys, time, urllib.request, json, threading, os

COMFYUI_PATH = r"E:\ComfyUI_New\ComfyUI"
PYTHON_PATH = r"E:\ComfyUI_New\python_embeded\python.exe"
HOST = "127.0.0.1"
PORT = 8188
FLAGS = ["--lowvram","--force-fp16","--listen","0.0.0.0","--port",str(PORT),
         "--enable-cors-header","*","--use-pytorch-cross-attention"]

def is_running():
    try:
        r = urllib.request.urlopen(f"http://{HOST}:{PORT}/system_stats", timeout=3)
        return r.status == 200
    except: return False

def start():
    cmd = [PYTHON_PATH, "main.py"] + FLAGS
    print(f"[Launcher] Starting: {' '.join(cmd)}")
    return subprocess.Popen(cmd, cwd=COMFYUI_PATH, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")

def wait_ready(timeout=120):
    t0 = time.time()
    while time.time()-t0 < timeout:
        if is_running(): return True
        time.sleep(2)
    return False

def main():
    if is_running():
        print(f"[Launcher] Already running at http://{HOST}:{PORT}")
        stats = json.loads(urllib.request.urlopen(f"http://{HOST}:{PORT}/system_stats").read())
        d = stats.get("devices",[{}])[0]
        if d: print(f"[Launcher] VRAM: {d.get('vram_free',0)/1073741824:.1f}/{d.get('vram_total',0)/1073741824:.1f} GB")
        return
    proc = start()
    def stream():
        for line in proc.stdout: print(f"  [ComfyUI] {line}", end="")
    threading.Thread(target=stream, daemon=True).start()
    print("[Launcher] Waiting for server...")
    if wait_ready(): print(f"\n[Launcher] Ready at http://{HOST}:{PORT}")
    else: print("\n[Launcher] FAILED to start"); proc.terminate(); sys.exit(1)
    proc.wait()

if __name__=="__main__": main()
