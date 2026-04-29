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

Generate and install a custom Claude Code status line. Three axes — **columns**, **theme**, **effort icon** — combine to produce the bar you want.

**Invoke in Claude Code:**

```
# Interactive — skill prompts for columns, theme, and icon
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
| `context` | Context window progress bar + percentage | Always |
| `effort` | Reasoning effort level, **colored by intensity** — red=high, yellow=medium, green=low | When `effortLevel` is set in `~/.claude/settings.json` |
| `dir` | Repo directory basename (original repo when inside a worktree) | Always |
| `worktree` | Bold **`worktree:<id>`** label | Only inside a git worktree (detected via input JSON or `git` CLI) |
| `git` | Git branch name (yellow when dirty) | Only in a git repo |
| `vim` | Vim mode indicator | Only when vim keybindings are active |

#### Themes

| Theme | Palette | Prefix icons actually rendered in the bar |
|-------|---------|-------------------------------------------|
| `gruvbox` | Teal model · aqua progress · yellow/green accents · gray separators | `✦` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | Purple model · green progress · cyan dir · pink worktree | `◈` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | Cyan model · green progress · blue dir · magenta worktree · dim `·` separator | no prefix icons — color + labels only |
| `minimal` | Terminal defaults; red/yellow only for high-effort and dirty-git | no prefix icons — plain text |

#### Effort icon

Prepended to the `effort` column only — pick the one you like:

| Icon | Name |
|------|------|
| `⚡` | Lightning — intensity (**default**) |
| `∴` | Therefore — reasoning |
| `❯` | Pure/Starship prompt |
| `➜` | Robbyrussell arrow |
| `◉` | Filled circle |

#### Examples

Dracula, all columns, effort=high, inside a worktree:
```
◈ Opus 4.7 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡ high | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

Minimal, model + effort + dir + git, effort=low:
```
Claude Opus 4.7 · ⚡ low · skills-cc · main
```

> ⚠️ **Note:** The generated script requires `jq` for JSON parsing. The skill writes to `~/.claude/scripts/statusline.sh` and updates `~/.claude/settings.json` — restart Claude Code to see it.

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
