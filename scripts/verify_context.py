#!/usr/bin/env python3
"""Verify that every statusline theme+element combo generates valid bash."""

import subprocess
import sys

THEMES = ["gruvbox", "dracula", "robbyrussell", "minimal"]
ELEMENT_SETS = [
    "model",
    "model,context,effort,git,dir",
    "model,context,cost,effort,style,git,dir,worktree,vim",
]
GENERATOR = "skills/webup-statusline/scripts/generate.mjs"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    errors = []
    for theme in THEMES:
        for elements in ELEMENT_SETS:
            label = f"{theme} / {elements}"
            # Generate the script
            r = run(["npx", "-y", "bun", GENERATOR, "--elements", elements, "--theme", theme])
            if r.returncode != 0:
                errors.append(f"FAIL generate {label}: {r.stderr.strip()}")
                continue

            script = r.stdout

            # 1. bash syntax check
            br = run(["bash", "-n"])
            br = subprocess.run(["bash", "-n"], input=script, capture_output=True, text=True)
            if br.returncode != 0:
                errors.append(f"FAIL bash -n {label}: {br.stderr.strip()}")

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
