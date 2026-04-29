---
name: webup-statusline
description: Generate and install a custom Claude Code status line with selectable elements (model, context, effort level, git, dir, worktree, vim), color themes, and prefix icons. Triggers on "status line", "statusline", "customize status", "status bar", "effort level display", "状态栏", "ステータスライン", or similar.
---

# Status Line Generator

Generate a custom Claude Code status line script with your choice of elements, color theme, and prefix icon. Installs directly to `~/.claude/settings.json`.

## How It Works

Claude Code supports custom status lines via a shell script configured in `~/.claude/settings.json`. The script receives session JSON on stdin (model, context window, output style, workspace, etc.) and prints formatted text to stdout.

This skill generates a bash script tailored to your preferences and installs it automatically.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.mjs`
3. Replace all `${SKILL_DIR}` in this document with the actual path

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/generate.mjs` | Generate and install status line script from chosen options |

## Prerequisites

- **jq** — required by the generated status line script to parse JSON input from Claude Code
- **Bun** — required to run the generator. Use `npx -y bun` if not installed globally.

## Usage

```bash
# Preview generated script
npx -y bun ${SKILL_DIR}/scripts/generate.mjs --elements model,context,style,git,dir --theme gruvbox --icon ✦

# Generate and install
npx -y bun ${SKILL_DIR}/scripts/generate.mjs --elements model,context,style,git,dir --theme gruvbox --icon ✦ --install
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--elements <list>` | `model,context,effort,git,dir` | Comma-separated elements to display |
| `--theme <name>` | `gruvbox` | Color theme |
| `--icon <char>` | `⚡` | Prefix icon shown before the effort level |
| `--install` | off | Write script to `~/.claude/scripts/statusline.sh` and update `settings.json` |

### Elements

| Element | Description | Data source |
|---------|-------------|-------------|
| `model` | Active model name (e.g. "Opus 4.6") | `model.display_name` |
| `context` | Context window usage — progress bar + percentage | `context_window.remaining_percentage` |
| `effort` | Effort level colored by intensity (red=high, yellow=medium, green=low) with prefix icon | `effortLevel` in `~/.claude/settings.local.json` → `~/.claude/settings.json` |
| `git` | Git branch name (yellow when dirty) | `worktree.branch` → git CLI |
| `dir` | Repo basename (original repo when in a worktree) | `worktree.original_repo_dir` → `workspace.current_dir` |
| `worktree` | Worktree name indicator (only shown when in a worktree) | `worktree.name` |
| `vim` | Vim mode indicator | `vim.mode` |

**Effort colors**: `high` renders bold red, `medium` is yellow, `low` is green, any other value renders dim. When `effortLevel` is not set in settings, the element is hidden entirely.

**Worktree behavior**: When Claude Code runs inside a git worktree (via `EnterWorktree` or `--worktree`), the input JSON contains a `worktree` object. The `git` element uses `worktree.branch` first; the `dir` element prefers `worktree.original_repo_dir` basename so your status line stays stable across worktrees; the `worktree` element adds a distinct indicator (`⊕ <name>`) so you can tell at a glance that you're off the main checkout.

### Themes

| Theme | Style | Colors |
|-------|-------|--------|
| `gruvbox` | Warm retro | Teal model, aqua bar, yellow tokens, green dir, blue git |
| `robbyrussell` | Classic oh-my-zsh | Cyan model, red dir, green git, magenta style |
| `minimal` | Clean, no decoration | Default terminal colors, dim separators |
| `dracula` | Dark modern | Purple model, green bar, pink style, cyan dir, orange git |

### Prefix Icons

Note: these are used for the `effort` element only. The `✦` sparkle is avoided here because themes already use it as the model icon.

| Icon | Name |
|------|------|
| `⚡` | Lightning bolt (default — matches "effort/intensity") |
| `∴` | Therefore — reasoning indicator |
| `❯` | Pure/Starship prompt |
| `➜` | Robbyrussell arrow |
| `◉` | Filled circle |

## Invocation

This skill can be invoked with or without arguments:

- **No args** (`/webup-statusline`): Interactive prompt via `AskUserQuestion` to pick elements, theme, and icon.
- **With args** (`/webup-statusline dracula`): NLP parse for theme, elements, and icon preferences.

### Arg parsing (natural language)

The args string is free-form text. Use NLP to extract:

1. **theme** — match against: gruvbox, robbyrussell, minimal, dracula. Also recognize aliases (暗黑=dracula, 极简=minimal, 复古=gruvbox, レトロ=gruvbox).
2. **elements** — look for mentions of: model, context/进度/コンテキスト, effort/推理强度/努力度, git/分支/ブランチ, dir/目录/ディレクトリ, worktree/工作树/ワークツリー, vim.
3. **icon** — match against the 5 prefix icons or descriptions like "dragon icon", "龙图标", "闪电".

Unspecified fields use defaults: all elements except vim, gruvbox theme, ✦ icon.

## Workflow

1. **If no args provided**: Use `AskUserQuestion` to ask 3 questions in a single prompt:

   **Q1 — Elements** (multiSelect): Which info to show in the status line?
   - "Model name" — active Claude model
   - "Context usage" — progress bar + percentage (Recommended)
   - "Effort level" — colored by level with prefix icon (Recommended)
   - "Git branch" — current branch, yellow when dirty (Recommended)
   - "Working directory" — folder name (Recommended)
   - "Worktree" — worktree name indicator (only shown when in a worktree)
   - "Vim mode" — vim keybinding mode indicator

   **Q2 — Theme** (single): Color theme?
   - "Gruvbox Dark (Recommended)" — warm retro palette, 24-bit true color
   - "Dracula" — modern dark theme, purple/pink/cyan
   - "Robbyrussell" — classic oh-my-zsh style
   - "Minimal" — no decoration, dim separators only

   **Q3 — Effort level prefix icon** (single): Icon shown before the effort level?
   - "⚡ lightning (Recommended)" — intensity/effort
   - "∴ therefore" — reasoning indicator
   - "❯ prompt" — pure/starship style
   - "◉ circle" — filled circle

   **If args provided**: Parse theme, elements, and icon from args. Skip the prompt.

2. Map user selections to script flags:
   - Elements → comma-separated list for `--elements`
   - Theme → `--theme` value
   - Icon → `--icon` value

3. Run the generator with `--install`:
   ```bash
   npx -y bun ${SKILL_DIR}/scripts/generate.mjs --elements <list> --theme <theme> --icon "<icon>" --install
   ```

4. Tell user to restart Claude Code to see the new status line.

## Output Examples

**Gruvbox Dark** (model + context + effort + dir + git), effort=high:
```
✦ Opus 4.6 | [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡high | ◆ my-project | ⎇ main
```
(effort "high" renders bold red — the more thinking, the louder the color)

**Gruvbox Dark, in a worktree** (all elements), effort=medium:
```
✦ Opus 4.6 | [■■■■■□□□□□□□□□□□□□□□] 28% | ⚡medium | ◆ skills-cc | ⊕ my-feature | ⎇ feat/xyz
```

**Minimal** (model + effort + dir + git), effort=low:
```
Claude Opus 4.6 · ∴low · skills-cc · main
```

**Dracula** (all elements), effort=high:
```
◈ Opus 4.6 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡high | ⌨ normal | ◇ my-project | ⊕ my-feature | ⎇ feat/xyz
```

## Notes

- Generated script is saved to `~/.claude/scripts/statusline.sh`
- Running the skill again overwrites the existing script (no backup needed — just re-run to change)
- The script uses `jq` to parse JSON input — make sure it's installed
- Git dirty detection uses `--no-optional-locks` to avoid interfering with other git operations
