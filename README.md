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
🎯 Install only buddy-reroll globally:
```bash
npx skills add webup/skills-cc -s webup-buddy-reroll -g
```

## 🎮 Skills

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

### 📊 webup-statusline

Generate and install a custom Claude Code status line. Mix and match three options — **elements**, **theme**, **icon** — to build the bar you want.

**Invoke in Claude Code:**

```
# Interactive — skill prompts you for elements, theme, icon
/webup-statusline

# Quick theme selection
/webup-statusline dracula

# Natural language
/webup-statusline minimal with git and context bar
```

#### Option 1 — Elements (what to display, multi-select)

| Element | Shows | Notes |
|---------|-------|-------|
| 🤖 `model` | Active model name | From `model.display_name` |
| 📶 `context` | Context window bar + % | Color-coded progress bar with percentage used |
| ⚡ `effort` | Reasoning effort level | **Colored by intensity** — red=high, yellow=medium, green=low; hidden when not set |
| ⌂ `dir` | Repo directory basename | In a worktree, shows the original repo name (not the worktree path) |
| ⊕ `worktree` | Worktree indicator | **Only appears when in a worktree** (detected via Claude Code JSON or `git` CLI fallback); bold `worktree:<id>` label |
| ⎇ `git` | Git branch name | Yellow when the tree is dirty |
| ⌨ `vim` | Vim mode | Only appears when vim keybindings are active |

#### Option 2 — Theme (4 presets)

| Theme | Palette | Vibe |
|-------|---------|------|
| 🌾 `gruvbox` | Teal model · aqua bar · yellow/green accents · gray separators | Warm retro, muted, easy on the eyes |
| 🧛 `dracula` | Purple model · green bar · cyan dir · pink worktree | Modern dark, high saturation |
| 💎 `robbyrussell` | Cyan model · green bar · blue dir · magenta worktree · dim `·` separator | Classic oh-my-zsh look |
| 🪶 `minimal` | Default terminal colors; only red/yellow accents for high-effort and dirty-git | Quiet, single-line — no icons, no decoration |

#### Option 3 — Effort icon (prefix before the colored effort level)

| Icon | Meaning |
|------|---------|
| ⚡ | Lightning bolt — intensity (**default**) |
| ∴ | Therefore — reasoning indicator |
| ❯ | Pure/Starship-style prompt |
| ➜ | Robbyrussell arrow |
| ◉ | Filled circle |

#### Output examples

Gruvbox Dark, all elements, effort=high:
```
✦ Opus 4.6 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡high | ⌂ skills-cc | ⊕ worktree:46a6 | ⎇ feat/xyz
```

Minimal, model + effort + dir + git, effort=low:
```
Claude Opus 4.6 · ⚡low · skills-cc · main
```

> ⚠️ **Note:** The generated status line script requires `jq` for JSON parsing. The skill auto-writes to `~/.claude/scripts/statusline.sh` and updates `~/.claude/settings.json` — restart Claude Code to see it.

## 📄 License

MIT
