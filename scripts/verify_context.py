#!/usr/bin/env python3
"""Verify that every statusline theme+element combo generates valid bash."""

import subprocess
import sys
import tempfile
import os

THEMES = ["gruvbox", "dracula", "robbyrussell", "minimal"]
ELEMENT_SETS = [
    "model",
    "model,context,effort,git,dir",
    "model,context,cost,effort,style,git,dir,worktree,vim",
]
GENERATOR = "skills/webup-statusline/scripts/generate.mjs"

IS_WINDOWS = sys.platform == "win32"


def run(cmd, input=None):
    return subprocess.run(cmd, capture_output=True, encoding="utf-8", errors="replace", input=input)


def bash_syntax_ok(script):
    """Check bash syntax via ``bash -n``.

    On Windows (Git Bash / MSYS2), ``bash -n`` may reject UTF-8 files
    due to locale issues that are impossible to fix from Python's
    subprocess.  Since we only care about *structural* syntax
    (matching if/fi, for/done, quoting, etc.) — not the byte values of
    string literals — we strip non-ASCII before checking on Windows.

    Returns (ok: bool, detail: str).
    """
    check_script = script
    if IS_WINDOWS:
        check_script = script.encode("ascii", errors="replace").decode("ascii")

    fd, path = tempfile.mkstemp(suffix=".sh")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(check_script)
        env = dict(os.environ)
        if IS_WINDOWS:
            env["LC_ALL"] = "C"
            env.pop("BASH_ENV", None)
        br = subprocess.run(
            ["bash", "-n", path],
            capture_output=True, text=True, env=env,
        )
        if br.returncode == 0:
            return True, ""
        return False, br.stderr.strip() or f"bash -n exit code {br.returncode}"
    finally:
        os.unlink(path)


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

            # 1. bash syntax check
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

    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        print(f"\n{len(errors)} check(s) failed", file=sys.stderr)
        sys.exit(1)

    combos = len(THEMES) * len(ELEMENT_SETS)
    print(f"All {combos} theme×element combos passed")


if __name__ == "__main__":
    main()
