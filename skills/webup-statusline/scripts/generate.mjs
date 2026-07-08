#!/usr/bin/env bun
// Generate a custom Claude Code status line shell script
//
// Usage: bun generate.mjs --elements model,context,style,git,dir,vim --theme gruvbox --icon ✦ --install

import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const args = process.argv.slice(2)
function getArg(name, def) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def
}
const hasFlag = (name) => args.includes(`--${name}`)

const elements = getArg('elements', 'model,context,cost,effort,style,git,dir').split(',').map(s => s.trim())
const theme = getArg('theme', 'gruvbox')
const effortIconFlag = getArg('effort-icon', '')  // optional override; see themes.effort icons
const install = hasFlag('install')

// ── Theme definitions ──────────────────────────────────────────────
const themes = {
  gruvbox: {
    name: 'Gruvbox Dark',
    model:     '\\033[38;2;86;182;194m',   // bright teal
    ctx_ok:    '\\033[38;2;142;192;124m',  // aqua/green (>50% remaining)
    ctx_warn:  '\\033[38;2;250;189;47m',   // yellow (20-50% remaining)
    ctx_low:   '\\033[38;2;251;73;52m',    // red (<20% remaining)
    bar_empty: '\\033[38;2;80;73;69m',     // dark bg
    pct:       '\\033[38;2;251;241;199m',  // bright fg
    dir:       '\\033[38;2;152;195;121m',  // soft green
    git:       '\\033[38;2;143;175;209m',  // soft blue
    git_dirty: '\\033[38;2;224;175;104m',  // warm yellow
    vim:       '\\033[38;2;214;93;14m',    // orange
    worktree:  '\\033[38;2;211;134;155m',  // soft pink
    style:     '\\033[38;2;177;98;134m',   // soft violet — output style
    cost:      '\\033[38;2;215;153;33m',   // gruvbox gold — session spend
    effort_high: '\\033[1;38;2;251;73;52m',   // bold red
    effort_med:  '\\033[38;2;250;189;47m',    // yellow
    effort_low:  '\\033[38;2;142;192;124m',   // green
    effort_off:  '\\033[2;38;2;168;153;132m', // dim gray
    sep:       '\\033[38;2;102;92;84m',    // gray
    separator: ' | ',
    bar_chars: ['■', '□'],
  },
  robbyrussell: {
    name: 'Robbyrussell',
    model:     '\\033[38;5;45m',   // cyan
    ctx_ok:    '\\033[38;5;32m',   // green
    ctx_warn:  '\\033[38;5;220m',  // yellow
    ctx_low:   '\\033[38;5;196m',  // red
    bar_empty: '\\033[2m',         // dim
    pct:       '\\033[38;5;220m',  // yellow
    dir:       '\\033[38;5;39m',   // blue — softer than red for folder
    git:       '\\033[38;5;32m',   // green
    git_dirty: '\\033[38;5;220m',  // yellow
    vim:       '\\033[38;5;45m',   // cyan
    worktree:  '\\033[38;5;170m',  // magenta
    style:     '\\033[38;5;135m',  // violet
    cost:      '\\033[38;5;172m',  // orange3 — session spend
    effort_high: '\\033[1;38;5;196m',  // bold red
    effort_med:  '\\033[38;5;220m',    // yellow
    effort_low:  '\\033[38;5;32m',     // green
    effort_off:  '\\033[2m',           // dim
    sep:       '\\033[2m',         // dim
    separator: ' · ',
    bar_chars: ['━', '─'],
  },
  minimal: {
    name: 'Minimal',
    model:     '\\033[0m',
    ctx_ok:    '\\033[32m',       // green
    ctx_warn:  '\\033[33m',       // yellow
    ctx_low:   '\\033[31m',       // red
    bar_empty: '\\033[2m',
    pct:       '\\033[0m',
    dir:       '\\033[2m',
    git:       '\\033[0m',
    git_dirty: '\\033[33m',
    vim:       '\\033[0m',
    worktree:  '\\033[2m',
    style:     '\\033[0m',        // default — name speaks for itself
    cost:      '\\033[33m',       // yellow
    effort_high: '\\033[1;31m',   // bold red
    effort_med:  '\\033[33m',     // yellow
    effort_low:  '\\033[32m',     // green
    effort_off:  '\\033[2m',      // dim
    sep:       '\\033[2m',
    separator: ' · ',
    bar_chars: ['▰', '▱'],
  },
  dracula: {
    name: 'Dracula',
    model:     '\\033[38;2;189;147;249m',  // purple
    ctx_ok:    '\\033[38;2;80;250;123m',   // green
    ctx_warn:  '\\033[38;2;241;250;140m',  // yellow
    ctx_low:   '\\033[38;2;255;85;85m',    // red
    bar_empty: '\\033[38;2;68;71;90m',     // comment
    pct:       '\\033[38;2;248;248;242m',  // fg
    dir:       '\\033[38;2;139;233;253m',  // cyan
    git:       '\\033[38;2;255;184;108m',  // orange
    git_dirty: '\\033[38;2;241;250;140m',  // yellow (softer than red)
    vim:       '\\033[38;2;241;250;140m',  // yellow
    worktree:  '\\033[38;2;255;121;198m',  // pink
    style:     '\\033[38;2;189;147;249m',  // purple (matches Claude brand hue)
    cost:      '\\033[38;2;255;215;0m',    // gold — session spend
    effort_high: '\\033[1;38;2;255;85;85m',    // bold red
    effort_med:  '\\033[38;2;241;250;140m',    // yellow
    effort_low:  '\\033[38;2;80;250;123m',     // green
    effort_off:  '\\033[2;38;2;98;114;164m',   // dim
    sep:       '\\033[38;2;98;114;164m',    // comment bright
    separator: ' | ',
    bar_chars: ['■', '□'],
  },
}

const t = themes[theme]
if (!t) {
  console.error(`Unknown theme: ${theme}. Available: ${Object.keys(themes).join(', ')}`)
  process.exit(1)
}

// ── Element icons per theme ────────────────────────────────────────
const elementIcons = {
  gruvbox:      { model: '✦', context: '', cost: '', dir: '⌂', git: '⎇', vim: '⌨', worktree: '⊕', effort: '↯', style: '❋' },
  robbyrussell: { model: '',  context: '', cost: '', dir: '',  git: '',  vim: '',  worktree: '',  effort: '',  style: ''  },
  minimal:      { model: '',  context: '', cost: '', dir: '',  git: '',  vim: '',  worktree: '',  effort: '',  style: ''  },
  dracula:      { model: '◈', context: '', cost: '', dir: '⌂', git: '⎇', vim: '⌨', worktree: '⊕', effort: '↯', style: '❋' },
}

// Effort icon presets — user can pick one via --effort-icon
// All are narrow/text-mode glyphs; ϟ (Greek koppa) is default because it
// reads as "lightning" while being consistently narrow in monospace fonts
const EFFORT_ICON_PRESETS = {
  arrow:  '↯',   // electric arrow — default (narrow, reads as intensity)
  bolt:   'ϟ',   // Greek koppa — narrow lightning
  flash:  '⚡',   // classic lightning — wide in emoji-presentation fonts
  reason: '∴',   // therefore
  dot:    '◉',   // filled circle
  none:   '',    // hide the icon entirely
}

// Resolve effort icon: explicit flag > theme default
function resolveEffortIcon(themeIcon) {
  if (!effortIconFlag) return themeIcon
  if (effortIconFlag === 'none') return ''
  if (EFFORT_ICON_PRESETS[effortIconFlag] !== undefined) return EFFORT_ICON_PRESETS[effortIconFlag]
  return effortIconFlag  // allow a raw character
}
const icons = elementIcons[theme]

// ── Build shell script ─────────────────────────────────────────────
function buildScript() {
  const lines = []
  const p = (s) => lines.push(s)

  p('#!/bin/bash')
  p(`# Claude Code status line — ${t.name} theme`)
  p(`# Generated by webup-statusline skill`)
  p('')

  // Auto-detect jq on Windows (WinGet/scoop paths may not be on PATH)
  const jqPathBlock = [
    '# Ensure jq is available (Windows: WinGet/scoop installs may not be on PATH)',
    'if ! command -v jq >/dev/null 2>&1; then',
    '  for _jq_dir in \\',
    '    "/c/Users/$USERNAME/AppData/Local/Microsoft/WinGet/Links" \\',
    '    "/c/Users/$USERNAME/AppData/Local/Microsoft/WinGet/Packages/jqlang.jq_Microsoft.Winget.Source_8wekyb3d8bbwe" \\',
    '    "$HOME/scoop/shims" \\',
    '  ; do',
    '    if [ -d "$_jq_dir" ] && { [ -x "$_jq_dir/jq" ] || [ -x "$_jq_dir/jq.exe" ]; }; then',
    '      export PATH="$PATH:$_jq_dir"',
    '      break',
    '    fi',
    '  done',
    '  if ! command -v jq >/dev/null 2>&1; then',
    '    echo "claude-status: jq is required but not installed." >&2',
    '    echo "  Install via: winget install jqlang.jq  OR  scoop install jq" >&2',
    '    exit 1',
    '  fi',
    'fi',
  ]
  for (const line of jqPathBlock) p(line)

  p('# Colors')
  p("readonly RST='\\033[0m'")
  p(`readonly C_MODEL='${t.model}'`)
  p(`readonly C_CTX_OK='${t.ctx_ok}'`)
  p(`readonly C_CTX_WARN='${t.ctx_warn}'`)
  p(`readonly C_CTX_LOW='${t.ctx_low}'`)
  p(`readonly C_BAR_EMPTY='${t.bar_empty}'`)
  p(`readonly C_PCT='${t.pct}'`)
  p(`readonly C_DIR='${t.dir}'`)
  p(`readonly C_GIT='${t.git}'`)
  p(`readonly C_GIT_DIRTY='${t.git_dirty}'`)
  p(`readonly C_VIM='${t.vim}'`)
  p(`readonly C_WORKTREE='${t.worktree}'`)
  p(`readonly C_STYLE='${t.style}'`)
  p(`readonly C_COST='${t.cost}'`)
  p(`readonly C_EFFORT_HIGH='${t.effort_high}'`)
  p(`readonly C_EFFORT_MED='${t.effort_med}'`)
  p(`readonly C_EFFORT_LOW='${t.effort_low}'`)
  p(`readonly C_EFFORT_OFF='${t.effort_off}'`)
  p(`readonly C_SEP='${t.sep}'`)
  p('')
  p(`readonly SEP="${t.separator}"`)
  p('')
  p('# Read JSON from stdin')
  p('input=$(cat)')
  p('')
  p('# Optional debug capture for replaying real Claude Code statusline payloads')
  p('if [ -n "${WEBUP_STATUSLINE_DEBUG_DUMP:-}" ]; then')
  p('  _debug_dir=$(dirname "$WEBUP_STATUSLINE_DEBUG_DUMP")')
  p('  mkdir -p "$_debug_dir" 2>/dev/null || true')
  p('  printf "%s\\n" "$input" | jq -c . >> "$WEBUP_STATUSLINE_DEBUG_DUMP" 2>/dev/null || true')
  p('fi')
  p('')

  // Extract fields based on selected elements
  if (elements.includes('model') || elements.includes('cost')) {
    p("model_id=$(echo \"$input\" | jq -r '.model.id // \"\"')")
  }
  if (elements.includes('model')) {
    p("model=$(echo \"$input\" | jq -r '.model.display_name // \"\"')")
  }
  if (elements.includes('context')) {
    p("remaining=$(echo \"$input\" | jq -r '.context_window.remaining_percentage // \"\"')")
    p("ctx_used_tokens=$(echo \"$input\" | jq -r '.context_window.total_input_tokens // empty')")
    p("ctx_window_size=$(echo \"$input\" | jq -r '.context_window.context_window_size // empty')")
  }
  if (elements.includes('effort')) {
    p('# Read effort level from settings (local overrides global)')
    p('effort=""')
    p('for f in "$HOME/.claude/settings.local.json" "$HOME/.claude/.claude/settings.local.json" "$HOME/.claude/settings.json"; do')
    p('  if [ -z "$effort" ] && [ -f "$f" ]; then')
    p('    effort=$(jq -r \'.effortLevel // empty\' "$f" 2>/dev/null)')
    p('  fi')
    p('done')
  }
  if (elements.includes('dir') || elements.includes('git')) {
    p("current_dir=$(echo \"$input\" | jq -r '.workspace.current_dir // \"\"')")
  }
  if (elements.includes('dir')) {
    p("original_repo_dir=$(echo \"$input\" | jq -r '.worktree.original_repo_dir // empty')")
  }
  if (elements.includes('vim')) {
    p("vim_mode=$(echo \"$input\" | jq -r '.vim.mode // empty')")
  }
  if (elements.includes('style')) {
    p("output_style=$(echo \"$input\" | jq -r '.output_style.name // empty')")
  }
  if (elements.includes('cost')) {
    // total_cost_usd is a float; jq returns empty string when missing
    p("cost_usd=$(echo \"$input\" | jq -r '.cost.total_cost_usd // empty')")
    p("session_id=$(echo \"$input\" | jq -r '.session_id // empty')")
    p("prompt_id=$(echo \"$input\" | jq -r '.prompt_id // empty')")
    p("usage_input_tokens=$(echo \"$input\" | jq -r '.context_window.current_usage.input_tokens // 0')")
    p("usage_output_tokens=$(echo \"$input\" | jq -r '.context_window.current_usage.output_tokens // 0')")
    p("usage_cache_write_tokens=$(echo \"$input\" | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')")
    p("usage_cache_read_tokens=$(echo \"$input\" | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')")
  }
  if (elements.includes('worktree') || elements.includes('git')) {
    p("worktree_name=$(echo \"$input\" | jq -r '.worktree.name // empty')")
    p("worktree_branch=$(echo \"$input\" | jq -r '.worktree.branch // empty')")
  }
  p('')

  // Worktree detection — prefer JSON, fall back to git CLI so external worktrees
  // (e.g. created via `git worktree add` or Codex) are still detected
  if (elements.includes('worktree')) {
    p('# Worktree detection (git fallback for external worktrees)')
    p('is_worktree=0')
    p('if [ -n "$worktree_name" ]; then')
    p('  is_worktree=1')
    p('elif [ -n "$current_dir" ] && git -C "$current_dir" --no-optional-locks rev-parse --git-dir > /dev/null 2>&1; then')
    p('  _gd=$(git -C "$current_dir" --no-optional-locks rev-parse --git-dir 2>/dev/null)')
    p('  _gcd=$(git -C "$current_dir" --no-optional-locks rev-parse --git-common-dir 2>/dev/null)')
    p('  if [ -n "$_gd" ] && [ -n "$_gcd" ] && [ "$_gd" != "$_gcd" ]; then')
    p('    is_worktree=1')
    p('    if [ -z "$worktree_name" ]; then')
    p('      # Use parent dir basename as worktree id (e.g. ~/.codex/worktrees/46a6/clawmaster -> 46a6)')
    p('      _parent=$(dirname "$current_dir")')
    p('      worktree_name=$(basename "$_parent")')
    p('      # Fall back to current dir basename if parent is a generic bucket')
    p('      case "$worktree_name" in')
    p('        worktrees|wt|.codex|.claude) worktree_name=$(basename "$current_dir") ;;')
    p('      esac')
    p('    fi')
    p('  fi')
    p('fi')
    p('')
  }

  // Git branch detection — prefer worktree.branch from input JSON when present
  if (elements.includes('git')) {
    p('# Git branch (prefer worktree.branch from input, fall back to git CLI)')
    p('git_branch="$worktree_branch"')
    p('git_dirty=0')
    p('if [ -n "$current_dir" ] && git -C "$current_dir" --no-optional-locks rev-parse --git-dir > /dev/null 2>&1; then')
    p('  if [ -z "$git_branch" ]; then')
    p('    git_branch=$(git -C "$current_dir" --no-optional-locks branch --show-current 2>/dev/null)')
    p('  fi')
    p('  if [ -n "$git_branch" ]; then')
    p('    if ! git -C "$current_dir" --no-optional-locks diff --quiet 2>/dev/null || \\')
    p('       ! git -C "$current_dir" --no-optional-locks diff --cached --quiet 2>/dev/null; then')
    p('      git_dirty=1')
    p('    fi')
    p('  fi')
    p('fi')
    p('')
  }

  // Shortened directory — when in a worktree, show the original repo basename
  // so the worktree element can display the worktree name separately
  if (elements.includes('dir')) {
    p('# Shorten directory (prefer original repo when in a worktree)')
    p('short_dir=""')
    p('if [ -n "$original_repo_dir" ]; then')
    p("  short_dir=$(basename \"$original_repo_dir\")")
    p('elif [ -n "$current_dir" ]; then')
    p("  short_dir=$(basename \"$current_dir\")")
    p('fi')
    p('')
  }

  // Context bar builder — color scales with remaining capacity
  // green (>50% left) → yellow (20-50%) → red (<20%)
  if (elements.includes('context')) {
    p('# Progress bar (color scales with remaining context)')
    p('bar=""')
    p('if [ -n "$remaining" ]; then')
    p('  used=$((100 - remaining))')
    p('  filled=$((used / 5))')
    p('  empty=$((20 - filled))')
    p('  if [ "$remaining" -lt 20 ]; then')
    p('    ctx_color="$C_CTX_LOW"')
    p('  elif [ "$remaining" -lt 50 ]; then')
    p('    ctx_color="$C_CTX_WARN"')
    p('  else')
    p('    ctx_color="$C_CTX_OK"')
    p('  fi')
    p(`  bar="\${C_SEP}[\${RST}"`)
    p(`  for ((i=0; i<filled; i++)); do bar+="\${ctx_color}${t.bar_chars[0]}\${RST}"; done`)
    p(`  for ((i=0; i<empty; i++)); do bar+="\${C_BAR_EMPTY}${t.bar_chars[1]}\${RST}"; done`)
    p(`  bar+="\${C_SEP}]\${RST} \${ctx_color}\${used}%\${RST}"`)
    p('  # Append token counts when available: used_tokens/window_size')
    p('  if [ -n "$ctx_used_tokens" ] && [ -n "$ctx_window_size" ]; then')
    p('    ctx_used_k=$(awk -v v="$ctx_used_tokens" \'BEGIN { printf "%.0fk", v/1000 }\')')
    p('    ctx_total_k=$(awk -v v="$ctx_window_size" \'BEGIN { printf "%.0fk", v/1000 }\')')
    p(`    bar+="\${C_SEP} (\${RST}\${ctx_color}\${ctx_used_k}\${RST}\${C_SEP}/\${RST}\${ctx_color}\${ctx_total_k}\${RST}\${C_SEP})\${RST}"`)
    p('  fi')
    p('fi')
    p('')
  }

  if (elements.includes('cost')) {
    p('# Recalculate prompt cost from current model pricing when usage data is available')
    p('display_cost_usd="$cost_usd"')
    p('price_provider="${WEBUP_MODEL_PRICE_PROVIDER:-anthropic}"')
    p('price_catalog_file="${WEBUP_MODEL_PRICE_CATALOG:-}"')
    p('usage_total=$((usage_input_tokens + usage_output_tokens + usage_cache_write_tokens + usage_cache_read_tokens))')
    p('')
    p('if [ -z "$price_catalog_file" ]; then')
    p('  price_cache_dir="${WEBUP_MODEL_PRICE_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/webup-model-price}"')
    p('  price_catalog_file="$price_cache_dir/catalog.json"')
    p('  price_ttl="${WEBUP_MODEL_PRICE_TTL_SECONDS:-86400}"')
    p('  mkdir -p "$price_cache_dir" 2>/dev/null || true')
    p('  price_now=$(date +%s)')
    p('  price_mtime=0')
    p('  if [ -f "$price_catalog_file" ]; then')
    p('    price_mtime=$(stat -f %m "$price_catalog_file" 2>/dev/null || stat -c %Y "$price_catalog_file" 2>/dev/null || echo 0)')
    p('  fi')
    p('  if [ ! -f "$price_catalog_file" ] || [ $((price_now - price_mtime)) -gt "$price_ttl" ]; then')
    p('    if command -v curl >/dev/null 2>&1; then')
    p('      price_tmp="${price_catalog_file}.$$"')
    p('      if curl -fsSL --max-time 2 https://models.dev/catalog.json > "$price_tmp" 2>/dev/null; then')
    p('        mv "$price_tmp" "$price_catalog_file" 2>/dev/null || true')
    p('      else')
    p('        rm -f "$price_tmp" 2>/dev/null || true')
    p('      fi')
    p('    fi')
    p('  fi')
    p('fi')
    p('')
    p('price_json=""')
    p('if [ -n "$model_id" ] && [ -f "$price_catalog_file" ]; then')
    p('  price_json=$(jq -c --arg provider "$price_provider" --arg model "$model_id" \'')
    p('    def keys_for($provider; $model):')
    p('      ([$model]')
    p('       + (if ($model | startswith($provider + "/")) then [($model | ltrimstr($provider + "/"))] else [] end)')
    p('       + (if ($provider == "anthropic" and ($model | startswith("anthropic/"))) then [($model | ltrimstr("anthropic/"))] else [] end))')
    p('      | unique;')
    p('    (.providers[$provider] // empty) as $p')
    p('    | if ($p == null) then empty else')
    p('        first(keys_for($provider; $model)[] as $key')
    p('          | $p.models[$key]?')
    p('          | select(.cost)')
    p('          | {input:(.cost.input // 0), output:(.cost.output // 0), cache_read:(.cost.cache_read // .cost.input // 0), cache_write:(.cost.cache_write // .cost.input // 0)})')
    p('      end')
    p('  \' "$price_catalog_file" 2>/dev/null)')
    p('fi')
    p('')
    p('if [ -n "$price_json" ] && [ -n "$session_id" ] && [ -n "$prompt_id" ] && [ "$usage_total" -gt 0 ]; then')
    p('  price_input=$(echo "$price_json" | jq -r \'.input // 0\')')
    p('  price_output=$(echo "$price_json" | jq -r \'.output // 0\')')
    p('  price_cache_read=$(echo "$price_json" | jq -r \'.cache_read // 0\')')
    p('  price_cache_write=$(echo "$price_json" | jq -r \'.cache_write // 0\')')
    p('  event_cost_usd=$(awk \\')
    p('    -v input_tokens="$usage_input_tokens" \\')
    p('    -v output_tokens="$usage_output_tokens" \\')
    p('    -v cache_read_tokens="$usage_cache_read_tokens" \\')
    p('    -v cache_write_tokens="$usage_cache_write_tokens" \\')
    p('    -v input_price="$price_input" \\')
    p('    -v output_price="$price_output" \\')
    p('    -v cache_read_price="$price_cache_read" \\')
    p('    -v cache_write_price="$price_cache_write" \\')
    p('    \'BEGIN { printf "%.8f", ((input_tokens*input_price) + (output_tokens*output_price) + (cache_read_tokens*cache_read_price) + (cache_write_tokens*cache_write_price)) / 1000000 }\')')
    p('  state_dir="${WEBUP_STATUSLINE_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/webup-statusline}"')
    p('  mkdir -p "$state_dir" 2>/dev/null || true')
    p('  safe_session_id=$(printf "%s" "$session_id" | tr -c "A-Za-z0-9_.-" "_")')
    p('  ledger_file="$state_dir/cost-${safe_session_id}.jsonl"')
    p('  if [ ! -f "$ledger_file" ] || ! jq -e --arg prompt "$prompt_id" \'select(.prompt_id == $prompt)\' "$ledger_file" >/dev/null 2>&1; then')
    p('    jq -cn \\')
    p('      --arg prompt_id "$prompt_id" \\')
    p('      --arg model_id "$model_id" \\')
    p('      --arg provider "$price_provider" \\')
    p('      --argjson cost_usd "$event_cost_usd" \\')
    p('      --argjson input_tokens "$usage_input_tokens" \\')
    p('      --argjson output_tokens "$usage_output_tokens" \\')
    p('      --argjson cache_read_tokens "$usage_cache_read_tokens" \\')
    p('      --argjson cache_write_tokens "$usage_cache_write_tokens" \\')
    p('      \'{prompt_id:$prompt_id, model_id:$model_id, provider:$provider, cost_usd:$cost_usd, input_tokens:$input_tokens, output_tokens:$output_tokens, cache_read_tokens:$cache_read_tokens, cache_write_tokens:$cache_write_tokens}\' \\')
    p('      >> "$ledger_file" 2>/dev/null || true')
    p('  fi')
    p('  if [ -f "$ledger_file" ]; then')
    p('    ledger_total_usd=$(jq -s \'map(.cost_usd // 0) | add // 0\' "$ledger_file" 2>/dev/null)')
    p('    if [ -n "$ledger_total_usd" ] && [ "$ledger_total_usd" != "null" ]; then')
    p('      display_cost_usd="$ledger_total_usd"')
    p('    fi')
    p('  fi')
    p('fi')
    p('')
  }

  // Build output
  p('# Assemble')
  p('parts=()')
  p('')

  if (elements.includes('model')) {
    const mi = icons.model ? `${icons.model} ` : ''
    p(`if [ -n "$model" ]; then`)
    p(`  parts+=("\${C_MODEL}${mi}\${model}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('context')) {
    p('if [ -n "$bar" ]; then')
    const ci = icons.context ? `${icons.context} ` : ''
    if (ci) {
      p(`  parts+=("${ci}\${bar}")`)
    } else {
      p('  parts+=("${bar}")')
    }
    p('fi')
    p('')
  }

  if (elements.includes('cost')) {
    const costi = icons.cost ? `${icons.cost} ` : ''
    // Format with 2 decimals; hide when missing or when the rounded value
    // would display as $0.00 (threshold 0.005 rounds up to $0.01)
    p('if [ -n "$display_cost_usd" ]; then')
    p('  cost_formatted=$(awk -v v="$display_cost_usd" \'BEGIN { if (v+0 >= 0.005) printf "$%.2f", v+0 }\')')
    p('  if [ -n "$cost_formatted" ]; then')
    p(`    parts+=("\${C_COST}${costi}\${cost_formatted}\${RST}")`)
    p('  fi')
    p('fi')
    p('')
  }

  if (elements.includes('effort')) {
    const rawEi = resolveEffortIcon(icons.effort)
    const ei = rawEi ? `${rawEi} ` : ''  // space only when icon is present
    p('# Color effort by level (max/xhigh/high share the bold-red pressure tier)')
    p('if [ -n "$effort" ]; then')
    p('  case "$effort" in')
    p('    max|MAX|Max|xhigh|XHIGH|XHigh|high|High|HIGH)  effort_color="$C_EFFORT_HIGH" ;;')
    p('    medium|Medium|MEDIUM)                          effort_color="$C_EFFORT_MED" ;;')
    p('    low|Low|LOW|xlow|XLow|XLOW|minimal|Minimal)    effort_color="$C_EFFORT_LOW" ;;')
    p('    *)                                             effort_color="$C_EFFORT_OFF" ;;')
    p('  esac')
    p(`  parts+=("\${effort_color}${ei}\${effort}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('style')) {
    const si = icons.style ? `${icons.style} ` : ''
    // Hide when the value is "default" — no point surfacing the noise
    p('if [ -n "$output_style" ] && [ "$output_style" != "default" ]; then')
    p(`  parts+=("\${C_STYLE}${si}\${output_style}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('vim')) {
    const vi = icons.vim ? `${icons.vim} ` : ''
    p('if [ -n "$vim_mode" ]; then')
    p(`  parts+=("\${C_VIM}${vi}\${vim_mode}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('dir')) {
    const di = icons.dir ? `${icons.dir} ` : ''
    p('if [ -n "$short_dir" ]; then')
    p(`  parts+=("\${C_DIR}${di}\${short_dir}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('worktree')) {
    const wi = icons.worktree ? `${icons.worktree} ` : ''
    p('if [ "$is_worktree" -eq 1 ] && [ -n "$worktree_name" ]; then')
    p(`  parts+=("\\033[1m\${C_WORKTREE}${wi}worktree:\${worktree_name}\${RST}")`)
    p('fi')
    p('')
  }

  if (elements.includes('git')) {
    const gi = icons.git ? `${icons.git} ` : ''
    p('if [ -n "$git_branch" ]; then')
    p('  if [ "$git_dirty" -eq 1 ]; then')
    p(`    parts+=("\${C_GIT_DIRTY}${gi}\${git_branch}\${RST}")`)
    p('  else')
    p(`    parts+=("\${C_GIT}${gi}\${git_branch}\${RST}")`)
    p('  fi')
    p('fi')
    p('')
  }

  // Join and print
  p('# Output')
  p('output=""')
  p('for i in "${!parts[@]}"; do')
  p('  if [ "$i" -gt 0 ]; then')
  p('    output+="\${C_SEP}\${SEP}\${RST}"')
  p('  fi')
  p('  output+="${parts[$i]}"')
  p('done')
  p('')
  p('printf "%b" "$output"')

  return lines.join('\n') + '\n'
}

const script = buildScript()

if (!install) {
  // Preview mode
  process.stdout.write(script)
  process.exit(0)
}

// ── Install mode ───────────────────────────────────────────────────
const scriptsDir = join(homedir(), '.claude', 'scripts')
const scriptPath = join(scriptsDir, 'statusline.sh')
const settingsPath = join(homedir(), '.claude', 'settings.json')

// Write script
mkdirSync(scriptsDir, { recursive: true })
writeFileSync(scriptPath, script)
chmodSync(scriptPath, 0o755)
console.log(`Wrote ${scriptPath}`)

// Update settings.json
let settings = {}
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
  } catch {}
}
settings.statusLine = {
  type: 'command',
  command: '~/.claude/scripts/statusline.sh',
}
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n')
console.log(`Updated ${settingsPath} → statusLine.command = ~/.claude/scripts/statusline.sh`)
console.log('\nRestart Claude Code to see your new status line!')
