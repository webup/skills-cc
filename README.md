# 🛠️ webup-skills-cc

Claude Code utility skills for customization and hacks.

[中文](README.zh.md) | [日本語](README.ja.md)

## 📦 Install

🔍 Browse & pick skills interactively:
```bash
npx skills find webup/skills-cc
```
🌐 Install all skills globally:
```bash
npx skills add webup/skills-cc -g
```
🎯 Install a single skill globally:
```bash
npx skills add webup/skills-cc -s webup-statusline -g
```

## 🎮 Skills

### 📊 webup-statusline

Generate and install a custom Claude Code status line. Pick your **columns**, pick a **theme** — that's it. Two columns (`context` and `effort`) also **change color based on level**, so the bar tells you at a glance where you stand.

#### What it looks like

Full setup (all columns), 49% context remaining, session cost $0.42, `effortLevel: high`, output style `Explanatory`, inside a worktree:

<img src="./docs/examples/dracula-full.svg" alt="Dracula theme with all columns: purple model, yellow context bar, gold cost, bold-red effort, purple output style, cyan dir, pink worktree, orange git branch" />

*Dracula theme — yellow bar (caution), gold `$0.42` (session spend), bold-red `↯ high` (pressure), purple `❋ Explanatory` (output style), pink worktree label.*

<details><summary>Plain text</summary>

```
◈ Opus 4.7 | [■■■■■■■■■■□□□□□□□□□□] 49% | $0.42 | ↯ high | ❋ Explanatory | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

</details>

Healthy session — 88% remaining, `effortLevel: medium`, default output style (hidden):

<img src="./docs/examples/gruvbox-healthy.svg" alt="Gruvbox theme healthy session: teal model, green context bar at 12% used, yellow effort medium, green dir, blue git main" />

*Gruvbox Dark — green bar (relaxed), yellow effort; output-style column hidden because it's `default`.*

<details><summary>Plain text</summary>

```
✦ Opus 4.7 | [■■□□□□□□□□□□□□□□□□□□] 12% | ↯ medium | ⌂ skills-cc | ⎇ main
```

</details>

#### Invoke in Claude Code

```
# Interactive — skill prompts for columns and theme
/webup-statusline

# Quick theme selection
/webup-statusline dracula

# Natural language
/webup-statusline minimal with git and context bar
```

#### Columns you can display (multi-select)

| Column | What it shows | When visible |
|--------|---------------|--------------|
| `model` | Active model name | Always |
| `context` | Context window progress bar + percentage — **color scales with remaining capacity** | Always |
| `cost` | Session API spend as `$X.XX` in gold (e.g. `$0.42`) | When `cost.total_cost_usd` rounds to ≥ $0.01 |
| `effort` | Reasoning effort level — **colored by intensity** (supports `low`/`medium`/`high`/`xhigh`/`max`) | When `effortLevel` is set in `~/.claude/settings.json` |
| `style` | Output style name (e.g. `Explanatory`, `Learning`) — shown in purple to match Claude's brand hue | When `output_style.name` is anything other than `default` |
| `dir` | Repo directory basename (original repo when inside a worktree) | Always |
| `worktree` | Bold **`worktree:<id>`** label | Only inside a git worktree (detected via input JSON or `git` CLI) |
| `git` | Git branch name (yellow when dirty) | Only in a git repo |
| `vim` | Vim mode indicator | Only when vim keybindings are active |

#### Color-changing columns (unified palette)

Both `context` and `effort` use the same traffic-light policy — green = relaxed, yellow = caution, red = pressure. One glance tells you if something is off.

| Intensity | Color | `context` (remaining) | `effort` (level) |
|-----------|-------|------------------------|-------------------|
| 🟢 relaxed | green | **> 50%** — plenty left | `low` (also `xlow`, `minimal`) |
| 🟡 caution | yellow | **20–50%** — watch out | `medium` |
| 🔴 pressure | red (bold for effort) | **< 20%** — nearly full, compact soon | `high` (also `xhigh`, `max`) |

Each theme maps its own green/yellow/red shades from its palette, so the policy is consistent but the look fits the theme.

#### Themes

| Theme | Vibe | Icons rendered in the bar |
|-------|------|----------------------------|
| `gruvbox` | Warm retro, muted | `✦` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | Modern dark, high saturation | `◈` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | Classic oh-my-zsh | no prefix icons — color + labels only |
| `minimal` | Terminal defaults | no prefix icons — plain text |

The `context` column intentionally has no prefix icon in any theme — the colored progress bar carries the visual weight.

**Override the effort icon** via `--effort-icon`. Presets: `arrow` (`↯`, default), `bolt` (`ϟ`), `flash` (`⚡`), `reason` (`∴`), `dot` (`◉`), `none` (hide). A raw character is also accepted.

> ⚠️ **Note:** The generated script requires `jq` for JSON parsing. On Windows, it auto-detects jq installed via WinGet or scoop; if jq is still not found, add its directory to your PATH manually. The skill writes to `~/.claude/scripts/statusline.sh` and updates `~/.claude/settings.json` — restart Claude Code to see it.

### 🎰 webup-buddy-reroll

Reroll your `/buddy` companion to any species and rarity — including ✨ legendary. Also rename your companion and give it a custom personality.

Claude Code's buddy system is deterministic: `hash(userID + SALT)` always produces the same pet. This skill brute-forces a userID that maps to your desired combination.

> **API users**: works directly. **Pro/Max subscribers**: the skill auto-detects `accountUuid` and walks you through an OAuth setup that bypasses the lock — no manual steps needed.

**Invoke in Claude Code:**

```
# Interactive — choose species, rarity, name, personality
/webup-buddy-reroll

# Reroll only
/webup-buddy-reroll dragon legendary

# Reroll + rename in one shot
/webup-buddy-reroll dragon legendary 沧海九粟 爱打盹的小龙

# Rename only (natural language)
/webup-buddy-reroll rename to Nimbus, personality: sarcastic robot
```

**🐾 18 Species:**

| | | | | | |
|---|---|---|---|---|---|
| 🦆 duck | 🪿 goose | 🫧 blob | 🐱 cat | 🐉 dragon | 🐙 octopus |
| 🦉 owl | 🐧 penguin | 🐢 turtle | 🐌 snail | 👻 ghost | 🦎 axolotl |
| 🦫 capybara | 🌵 cactus | 🤖 robot | 🐰 rabbit | 🍄 mushroom | 🐷 chonk |

**💎 5 Rarities:** ★ common (60%) · ★★ uncommon (25%) · ★★★ rare (10%) · ★★★★ epic (4%) · ★★★★★ legendary (1%)

After reroll, restart Claude Code and run `/buddy` to meet your new companion! 🎉

> ⚠️ **Note:** Requires Bun runtime (`Bun.hash()` matches Claude Code's internal hashing). Node.js will produce wrong results.

## 📄 License

MIT
