# 🛠️ webup-skills-cc

Claude Code ユーティリティスキル —— カスタマイズとハック集。

[English](README.md) | [中文](README.zh.md)

## 📦 インストール

🔍 対話的にスキルを閲覧・選択：
```bash
npx skills find webup/skills-cc
```
🌐 全スキルをグローバルインストール：
```bash
npx skills add webup/skills-cc -g
```
🎯 buddy-reroll のみグローバルインストール：
```bash
npx skills add webup/skills-cc -s webup-buddy-reroll -g
```

## 🎮 スキル一覧

### 🎰 webup-buddy-reroll

`/buddy` コンパニオンを好きな種族・レアリティに引き直す —— ✨ レジェンダリーも可能。名前やパーソナリティのカスタマイズにも対応。

Claude Code のバディシステムは決定的：`hash(userID + SALT)` は常に同じペットを生成します。このスキルは目的の組み合わせにマッピングされる userID をブルートフォースで探します。

> **API ユーザー**：そのまま利用可能。**Pro/Max サブスクライバー**：スキルが `accountUuid` を自動検出し、ロックを回避する OAuth セットアップを案内します。手動操作は不要です。

**Claude Code での呼び出し方：**

```
# 対話式 — 種族・レアリティ・名前・パーソナリティを選択
/webup-buddy-reroll

# リロールのみ
/webup-buddy-reroll dragon legendary

# リロール＋リネームを一括実行
/webup-buddy-reroll dragon legendary 沧海九粟 爱打盹的小龙

# リネームのみ（自然言語）
/webup-buddy-reroll rename to Nimbus, personality: sarcastic robot
```

**🐾 18 種族：**

| | | | | | |
|---|---|---|---|---|---|
| 🦆 duck アヒル | 🪿 goose ガチョウ | 🫧 blob ブロブ | 🐱 cat ネコ | 🐉 dragon ドラゴン | 🐙 octopus タコ |
| 🦉 owl フクロウ | 🐧 penguin ペンギン | 🐢 turtle カメ | 🐌 snail カタツムリ | 👻 ghost ゴースト | 🦎 axolotl ウーパールーパー |
| 🦫 capybara カピバラ | 🌵 cactus サボテン | 🤖 robot ロボット | 🐰 rabbit ウサギ | 🍄 mushroom キノコ | 🐷 chonk ぽっちゃり |

**💎 5 段階レアリティ：** ★ common (60%) · ★★ uncommon (25%) · ★★★ rare (10%) · ★★★★ epic (4%) · ★★★★★ legendary (1%)

リロール後、Claude Code を再起動して `/buddy` で新しいコンパニオンを迎えましょう！🎉

> ⚠️ **注意：** Bun ランタイムが必要です（`Bun.hash()` が Claude Code 内部のハッシュと一致）。Node.js では正しい結果が得られません。

### 📊 webup-statusline

カスタム Claude Code ステータスラインを生成・インストール。**要素**・**テーマ**・**アイコン** の 3 軸を組み合わせて、自分好みのバーを作れます。

**Claude Code での呼び出し方：**

```
# 対話式 — 要素・テーマ・アイコンを順に選択
/webup-statusline

# テーマ指定
/webup-statusline dracula

# 自然言語
/webup-statusline ミニマルテーマ ブランチとコンテキストバー付き
```

#### オプション 1 — 要素（表示内容、複数選択可）

| 要素 | 表示 | 備考 |
|------|------|------|
| 🤖 `model` | アクティブモデル名 | `model.display_name` から |
| 📶 `context` | コンテキストバー + % | パーセント付き進捗バー |
| ⚡ `effort` | 努力レベル | **強度で色分け** — 赤=高・黄=中・緑=低。未設定時は自動非表示 |
| ⌂ `dir` | リポジトリディレクトリ名 | ワークツリー内では元リポジトリ名を表示 |
| ⊕ `worktree` | ワークツリー表示 | **ワークツリー内でのみ表示**（Claude Code JSON または `git` CLI フォールバックで検出）。太字 `worktree:<id>` ラベル |
| ⎇ `git` | Git ブランチ名 | 作業ツリーが汚れていると黄色 |
| ⌨ `vim` | Vim モード | Vim キーバインド有効時のみ表示 |

#### オプション 2 — テーマ（4 種プリセット）

| テーマ | パレット | 雰囲気 |
|--------|----------|--------|
| 🌾 `gruvbox` | ティール・アクア・イエロー／グリーン・グレーセパレーター | レトロ暖色、落ち着いた目に優しい配色 |
| 🧛 `dracula` | パープル・グリーン・シアン dir・ピンク worktree | モダンダーク、彩度高め |
| 💎 `robbyrussell` | シアン・グリーン・ブルー dir・マゼンタ worktree・ディム `·` | クラシック oh-my-zsh 風 |
| 🪶 `minimal` | 端末デフォルト色；high 努力と dirty git のみ赤黄でアクセント | 静かな 1 行 — アイコン・装飾なし |

#### オプション 3 — 努力アイコン（effort 要素のプレフィックス）

| アイコン | 意味 |
|----------|------|
| ⚡ | 雷 — 強度／努力（**デフォルト**） |
| ∴ | ゆえに符号 — 推論の示唆 |
| ❯ | Pure/Starship 風プロンプト |
| ➜ | Robbyrussell 矢印 |
| ◉ | 塗り潰し丸 |

#### 出力例

Gruvbox Dark、全要素、effort=high：
```
✦ Opus 4.6 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡high | ⌂ skills-cc | ⊕ worktree:46a6 | ⎇ feat/xyz
```

Minimal、モデル + 努力 + ディレクトリ + git、effort=low：
```
Claude Opus 4.6 · ⚡low · skills-cc · main
```

> ⚠️ **注意：** 生成されたステータスラインスクリプトは JSON 解析に `jq` が必要です。スキルは `~/.claude/scripts/statusline.sh` を自動生成し `~/.claude/settings.json` を更新します。Claude Code を再起動すると反映されます。

## 📄 ライセンス

MIT
