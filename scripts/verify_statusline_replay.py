#!/usr/bin/env python3
"""Replay Claude Code-shaped statusline payloads through the generated script."""

import json
import os
import subprocess
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "skills/webup-statusline/scripts/generate.mjs"
PRICE_FIXTURE = Path("tests/fixtures/models-dev-catalog.json")
EVENT_FIXTURE = ROOT / "tests/fixtures/statusline-events.jsonl"


def bash_command(*args):
    if os.name == "nt":
        git_bash = Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Git/bin/bash.exe"
        if git_bash.exists():
            return [str(git_bash), *args]
    return ["bash", *args]


def run(cmd, **kwargs):
    return subprocess.run(
        cmd,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        cwd=ROOT,
        **kwargs,
    )


def main():
    generated = run([
        "bun",
        str(GENERATOR),
        "--elements",
        "model,context,cost",
        "--theme",
        "minimal",
    ])
    if generated.returncode != 0:
        print(generated.stderr, file=sys.stderr)
        return generated.returncode

    tmp = ROOT / ".tmp-statusline-replay"
    if tmp.exists():
        shutil.rmtree(tmp)
    try:
        tmp.mkdir()
        script_path = tmp / "statusline.sh"
        state_dir = Path(".tmp-statusline-replay/state")
        debug_dump = Path(".tmp-statusline-replay/statusline-debug.jsonl")
        script_path.write_text(generated.stdout, encoding="utf-8", newline="\n")

        env = {
            **os.environ,
            "WEBUP_MODEL_PRICE_CATALOG": PRICE_FIXTURE.as_posix(),
            "WEBUP_STATUSLINE_STATE_DIR": state_dir.as_posix(),
            "WEBUP_STATUSLINE_DEBUG_DUMP": debug_dump.as_posix(),
        }

        expected_costs = ["$0.45", "$1.20", "$1.20"]
        events = EVENT_FIXTURE.read_text(encoding="utf-8").splitlines()
        for index, (event, expected) in enumerate(zip(events, expected_costs), start=1):
            result = run(bash_command(script_path.relative_to(ROOT).as_posix()), input=event, env=env)
            if result.returncode != 0:
                traced = run(bash_command("-x", script_path.relative_to(ROOT).as_posix()), input=event, env=env)
                print(
                    f"event {index} failed with exit {result.returncode}\n"
                    f"STDOUT={result.stdout!r}\n"
                    f"STDERR={result.stderr!r}\n"
                    f"TRACE STDOUT={traced.stdout!r}\n"
                    f"TRACE STDERR={traced.stderr!r}",
                    file=sys.stderr,
                )
                return result.returncode
            if expected not in result.stdout:
                print(f"event {index} expected {expected}, got {result.stdout!r}", file=sys.stderr)
                return 1

        debug_dump_abs = ROOT / debug_dump
        if not debug_dump_abs.exists():
            print("debug dump was not created", file=sys.stderr)
            return 1

        dumped = debug_dump_abs.read_text(encoding="utf-8").splitlines()
        if len(dumped) != len(events):
            print(f"expected {len(events)} debug dump lines, got {len(dumped)}", file=sys.stderr)
            return 1

        for index, line in enumerate(dumped, start=1):
            payload = json.loads(line)
            if "prompt_id" not in payload or "model" not in payload:
                print(f"debug dump line {index} is not replayable: {payload}", file=sys.stderr)
                return 1

        print("Statusline replay checks passed")
        return 0
    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


if __name__ == "__main__":
    sys.exit(main())
