#!/usr/bin/env python3
"""Verify models.dev price lookup behavior."""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRICE = ROOT / "skills/webup-model-price/scripts/price.mjs"
FIXTURE = ROOT / "tests/fixtures/models-dev-catalog.json"


def run_price(*args):
    return subprocess.run(
        ["bun", str(PRICE), "--catalog", str(FIXTURE), *args],
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )


def assert_ok(result, label):
    if result.returncode != 0:
      raise AssertionError(f"{label} failed:\nSTDOUT={result.stdout}\nSTDERR={result.stderr}")


def main():
    errors = []

    try:
        r = run_price("--provider", "anthropic", "--model", "claude-opus-4-7")
        assert_ok(r, "anthropic exact lookup")
        data = json.loads(r.stdout)
        assert data["provider"] == "anthropic"
        assert data["model"] == "claude-opus-4-7"
        assert data["costPerMillion"] == {
            "input": 5,
            "output": 25,
            "cacheRead": 0.5,
            "cacheWrite": 6.25,
        }
    except Exception as exc:
        errors.append(f"FAIL exact provider lookup: {exc}")

    try:
        r = run_price("--model", "claude-opus-4-7", "--all")
        assert_ok(r, "all provider lookup")
        data = json.loads(r.stdout)
        providers = [item["provider"] for item in data["matches"]]
        assert providers == ["anthropic", "openrouter", "mirror"], providers
    except Exception as exc:
        errors.append(f"FAIL all provider lookup: {exc}")

    try:
        r = run_price("--model", "anthropic/claude-opus-4.7", "--all")
        assert_ok(r, "provider-prefixed lookup")
        data = json.loads(r.stdout)
        assert [item["provider"] for item in data["matches"]] == ["openrouter"]
    except Exception as exc:
        errors.append(f"FAIL provider-prefixed lookup: {exc}")

    try:
        r = run_price("--model", "claude-opus-4-7", "--no-default-provider")
        if r.returncode == 0:
            raise AssertionError("ambiguous lookup unexpectedly succeeded")
        if "ambiguous" not in r.stderr.lower() or "anthropic" not in r.stderr or "openrouter" not in r.stderr:
            raise AssertionError(f"unexpected ambiguity message: {r.stderr}")
    except Exception as exc:
        errors.append(f"FAIL ambiguous lookup: {exc}")

    try:
        r = run_price(
            "--provider", "anthropic",
            "--model", "claude-opus-4-7",
            "--input-tokens", "100000",
            "--output-tokens", "10000",
            "--cache-read-tokens", "20000",
            "--cache-write-tokens", "5000",
        )
        assert_ok(r, "cost estimate")
        data = json.loads(r.stdout)
        assert data["estimatedCostUsd"] == 0.79125, data["estimatedCostUsd"]
    except Exception as exc:
        errors.append(f"FAIL cost estimate: {exc}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(f"\n{len(errors)} check(s) failed", file=sys.stderr)
        sys.exit(1)

    print("Model price lookup checks passed")


if __name__ == "__main__":
    main()
