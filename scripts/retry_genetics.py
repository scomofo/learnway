#!/usr/bin/env python3
"""Retry wrapper for the HS genetics course generation.
Idempotent: no-ops when courses/hs-genetics.json already exists and validates.
On success: writes courses/index.json manifest and a DONE marker.
Exit 0 with 'DONE' printed on success, 'SKIP' when already done, 'FAIL' otherwise.
"""
import json, os, subprocess, sys

BASE = "/home/hatch/workspace/learnway"
OUT = f"{BASE}/courses/hs-genetics.json"
DONE = f"{BASE}/courses/.genetics-done"
ATTEMPTS = f"{BASE}/courses/.genetics-attempts"
MAX_ATTEMPTS = 48  # ~24h at 30-min cadence

sys.path.insert(0, BASE)
# reuse the validator shape from the app's pipeline via node
def valid(path):
    r = subprocess.run(
        ["node", "--input-type=module", "-e",
         "import {validateCourse} from '/home/hatch/workspace/learnway/pipeline.mjs';"
         "import {readFileSync} from 'node:fs';"
         "const c=JSON.parse(readFileSync(process.argv[1],'utf8'));"
         "const p=validateCourse(c);"
         "if(p.length){console.log('INVALID:'+p.join(';'));process.exit(1)}",
         path],
        capture_output=True, text=True)
    return r.returncode == 0

if os.path.exists(DONE) or (os.path.exists(OUT) and valid(OUT)):
    print("SKIP: course already generated")
    sys.exit(0)

n = int(open(ATTEMPTS).read()) + 1 if os.path.exists(ATTEMPTS) else 1
open(ATTEMPTS, "w").write(str(n))
if n > MAX_ATTEMPTS:
    print(f"FAIL: exceeded {MAX_ATTEMPTS} attempts")
    sys.exit(2)

ok = False
for model in ("gemini-3.8-flash", "gemini-3.5-flash"):
    print(f"attempt {n}: trying {model}", flush=True)
    env = dict(os.environ, GEMINI_MODEL=model)
    r = subprocess.run([sys.executable, f"{BASE}/scripts/gen_course.py"],
                       capture_output=True, text=True, env=env, timeout=1500)
    print(r.stdout[-500:] if r.stdout else "", r.stderr[-500:] if r.stderr else "")
    if r.returncode == 0 and os.path.exists(OUT) and valid(OUT):
        ok = True
        break
    print(f"{model} failed, rc={r.returncode}", flush=True)

if not ok:
    print("FAIL: all models failed this run")
    sys.exit(1)

with open(f"{BASE}/courses/index.json", "w") as f:
    json.dump([{"title": json.load(open(OUT))["meta"]["title"],
                "topic": "Genetics",
                "file": "courses/hs-genetics.json"}], f, indent=2)
open(DONE, "w").write("ok")
print("DONE: course generated and bundled")
