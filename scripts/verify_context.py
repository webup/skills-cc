#!/usr/bin/env python3
"""Verify that every statusline theme+element combo generates valid bash."""

import subprocess
import sys
import tempfile
import os
import json

THEMES = ["gruvbox", "dracula", "robbyrussell", "minimal"]
ELEMENT_SETS = [
    "model",
    "model,context,effort,git,dir",
    "model,context,cost,effort,style,git,dir,worktree,vim",
]
GENERATOR = "skills/webup-statusline/scripts/generate.mjs"
PRICE_FIXTURE = os.path.abspath("tests/fixtures/models-dev-catalog.json")

IS_WINDOWS = sys.platform == "win32"


def run(cmd, input=None):
    return subprocess.run(cmd, capture_output=True, encoding="utf-8", errors="replace", input=input)


def bash_syntax_ok(script):
    """Check bash syntax via ``bash -n``.

    Skipped on Windows: Git Bash's ``bash -n`` on GitHub Actions runners
    returns exit code 1 with empty stderr for all scripts, making it
    unreliable.  Linux and macOS CI already cover this check.

    Returns (ok: bool, detail: str).
    """
    if IS_WINDOWS:
        return True, "(skipped on Windows — Linux/macOS CI covers bash -n)"

    fd, path = tempfile.mkstemp(suffix=".sh")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(script)
        br = subprocess.run(["bash", "-n", path], capture_output=True, text=True)
        if br.returncode == 0:
            return True, ""
        return False, br.stderr.strip()
    finally:
        os.unlink(path)


def run_statusline_script(script, payload, env):
    fd, path = tempfile.mkstemp(suffix=".sh")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(script)
        return subprocess.run(
            ["bash", path],
            input=json.dumps(payload),
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            env={**os.environ, **env},
        )
    finally:
        os.unlink(path)


def statusline_payload(model_id, display_name, prompt_id):
    return {
        "session_id": "verify-model-switch",
        "prompt_id": prompt_id,
        "model": {
            "id": model_id,
            "display_name": display_name,
        },
        "workspace": {
            "current_dir": os.getcwd(),
        },
        "cost": {
            "total_cost_usd": 0.01,
        },
        "context_window": {
            "remaining_percentage": 90,
            "total_input_tokens": 100000,
            "total_output_tokens": 10000,
            "context_window_size": 200000,
            "current_usage": {
                "input_tokens": 100000,
                "output_tokens": 10000,
                "cache_creation_input_tokens": 0,
                "cache_read_input_tokens": 0,
            },
        },
    }


def model_switch_cost_ok(script):
    """Verify cost is recomputed from per-model prices and repeated refreshes do not double-count."""
    if IS_WINDOWS:
        return True, "(skipped on Windows — Linux/macOS CI covers execution)"

    with tempfile.TemporaryDirectory() as state_dir:
        env = {
            "WEBUP_MODEL_PRICE_CATALOG": PRICE_FIXTURE,
            "WEBUP_STATUSLINE_STATE_DIR": state_dir,
        }

        missing = run_statusline_script(
            script,
            statusline_payload("unknown-model", "Unknown Model", "prompt-missing"),
            env,
        )
        if missing.returncode != 0:
            return False, f"missing-price fallback render failed: {missing.stderr.strip()}"
        if "$0.01" not in missing.stdout:
            return False, f"missing-price fallback expected Claude Code $0.01, got: {missing.stdout!r}"

        first = run_statusline_script(
            script,
            statusline_payload("claude-sonnet-4-6", "Claude Sonnet 4.6", "prompt-1"),
            env,
        )
        if first.returncode != 0:
            return False, f"first render failed: {first.stderr.strip()}"
        if "$0.45" not in first.stdout:
            return False, f"first render expected $0.45, got: {first.stdout!r}"

        second = run_statusline_script(
            script,
            statusline_payload("claude-opus-4-7", "Claude Opus 4.7", "prompt-2"),
            env,
        )
        if second.returncode != 0:
            return False, f"second render failed: {second.stderr.strip()}"
        if "$1.20" not in second.stdout:
            return False, f"second render expected $1.20, got: {second.stdout!r}"

        repeat = run_statusline_script(
            script,
            statusline_payload("claude-opus-4-7", "Claude Opus 4.7", "prompt-2"),
            env,
        )
        if repeat.returncode != 0:
            return False, f"repeat render failed: {repeat.stderr.strip()}"
        if "$1.20" not in repeat.stdout:
            return False, f"repeat render expected $1.20 without double-counting, got: {repeat.stdout!r}"

    return True, ""


def main():
    errors = []
    for theme in THEMES:
        for elements in ELEMENT_SETS:
            label = f"{theme} / {elements}"
            r = run(["bun", GENERATOR, "--elements", elements, "--theme", theme])
            if r.returncode != 0:
                errors.append(f"FAIL generate {label}: {r.stderr.strip()}")
                continue

            script = r.stdout

            # 1. bash syntax check (non-Windows only; Windows runners skip this)
            ok, detail = bash_syntax_ok(script)
            if not ok:
                errors.append(f"FAIL bash -n {label}: {detail}")

            # 2. must contain jq auto-detect block
            if "command -v jq" not in script:
                errors.append(f"FAIL missing jq detect block in {label}")

            # 3. must contain shebang
            if not script.startswith("#!/bin/bash"):
                errors.append(f"FAIL missing shebang in {label}")

            # 4. must contain at least one jq invocation per requested element
            for el in elements.split(","):
                el = el.strip()
                if el == "model" and "model.display_name" not in script:
                    errors.append(f"FAIL missing model field in {label}")
                if el == "context" and "remaining_percentage" not in script:
                    errors.append(f"FAIL missing context field in {label}")
                if el == "effort" and "effortLevel" not in script:
                    errors.append(f"FAIL missing effort field in {label}")
                if el == "git" and "branch --show-current" not in script:
                    errors.append(f"FAIL missing git field in {label}")
                if el == "dir" and "short_dir" not in script:
                    errors.append(f"FAIL missing dir field in {label}")
                if el == "cost" and "total_cost_usd" not in script:
                    errors.append(f"FAIL missing cost field in {label}")
                if el == "style" and "output_style" not in script:
                    errors.append(f"FAIL missing style field in {label}")
                if el == "worktree" and "is_worktree" not in script:
                    errors.append(f"FAIL missing worktree field in {label}")
                if el == "vim" and "vim.mode" not in script:
                    errors.append(f"FAIL missing vim field in {label}")

            if theme == "minimal" and elements == "model,context,cost,effort,style,git,dir,worktree,vim":
                ok, detail = model_switch_cost_ok(script)
                if not ok:
                    errors.append(f"FAIL model switch cost ledger {label}: {detail}")

    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        print(f"\n{len(errors)} check(s) failed", file=sys.stderr)
        sys.exit(1)

    combos = len(THEMES) * len(ELEMENT_SETS)
    print(f"All {combos} theme×element combos passed")


if __name__ == "__main__":
    main()
