"""Manage the macOS user-session Astro preview for this checkout."""

import fcntl
import hashlib
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps/web"
STATE = ROOT / "artifacts/shared-preview"
LOG = STATE / "astro.log"
URL = "http://127.0.0.1:4321"
LABEL = "io.void-drift.preview." + hashlib.sha256(os.fsencode(ROOT)).hexdigest()[:16]
DOMAIN = f"gui/{os.getuid()}"
JOB = f"{DOMAIN}/{LABEL}"


def job():
    result = subprocess.run(["launchctl", "print", JOB], capture_output=True, text=True)
    if result.returncode and "Could not find service" not in result.stderr:
        raise RuntimeError(result.stderr.strip() or "Cannot inspect launchd job")
    return result.stdout if result.returncode == 0 else ""


def pid(info):
    match = re.search(r"^\s*pid = (\d+)$", info, re.M)
    return match.group(1) if match else None


def listeners():
    result = subprocess.run(
        ["lsof", "-nP", "-t", "-iTCP:4321", "-sTCP:LISTEN"], capture_output=True, text=True
    )
    if result.stderr.strip():
        raise RuntimeError(result.stderr.strip())
    return set(result.stdout.split())


def bootstrap():
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node is missing from PATH")
    config = {
        "Label": LABEL,
        "ProgramArguments": [node, str(WEB / "node_modules/astro/astro.js"), "dev"],
        "WorkingDirectory": str(WEB),
        "EnvironmentVariables": {"PATH": os.environ["PATH"], "VOID_DRIFT_SHARED_PREVIEW": "1"},
        "RunAtLoad": True,
        "StandardOutPath": str(LOG),
        "StandardErrorPath": str(LOG),
    }
    plist = STATE / "preview.plist"
    plist.write_bytes(plistlib.dumps(config))
    subprocess.run(["launchctl", "bootstrap", DOMAIN, str(plist)], check=True)


def ready():
    owner = pid(job())
    if not owner or owner not in listeners():
        return False
    try:
        with urlopen(URL + "/lab", timeout=3) as response:
            return response.status == 200
    except (URLError, TimeoutError, ConnectionError):
        return False


def main(action):
    STATE.mkdir(parents=True, exist_ok=True)
    print(f"Checkout {ROOT}\nLog {LOG}", flush=True)
    requested = time.monotonic()
    with (STATE / "control.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        info = job()
        owner = pid(info)
        foreign = listeners() - {owner}
        if foreign:
            raise RuntimeError("Port 4321 is occupied by unmanaged PID " + ", ".join(foreign))
        if action == "status":
            print("PID", owner or "stopped")
            if owner:
                subprocess.run(["ps", "-p", owner, "-o", "lstart="], check=True)
            if not ready():
                raise RuntimeError("Preview is unavailable or /lab failed")
        else:
            marker = STATE / "last-start"
            # A caller queued during another startup shares its result.
            completed = float(marker.read_text()) if marker.exists() else 0
            shared_start = requested <= completed <= time.monotonic()
            starting = not owner or (action == "restart" and not shared_start)
            if not info:
                bootstrap()
            elif starting:
                subprocess.run(["launchctl", "kickstart", "-k", JOB], check=True)
            deadline = time.monotonic() + 45
            while not ready():
                if time.monotonic() >= deadline:
                    raise RuntimeError(f"/lab did not become ready. Inspect {LOG}")
                time.sleep(0.4)
            if starting:
                marker.write_text(str(time.monotonic()))
        print("Ready at http://localhost:4321")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"ensure", "status", "restart"}:
        sys.exit("Expected ensure, status or restart")
    try:
        main(sys.argv[1])
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
