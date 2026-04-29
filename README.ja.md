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
🎯 単一スキルをグローバルインストール：
```bash
npx skills add webup/skills-cc -s webup-statusline -g
```

## 🎮 スキル一覧

### 📊 webup-statusline

カスタム Claude Code ステータスラインを生成・インストール。**カラム**・**テーマ**・**努力アイコン** の 3 軸を組み合わせて、自分好みのバーを作れます。

**Claude Code での呼び出し方：**

```
# 対話式 — カラム・テーマ・アイコンを順に選択
/webup-statusline

# テーマ指定
/webup-statusline dracula

# 自然言語
/webup-statusline ミニマルテーマ ブランチとコンテキストバー付き
```

#### 表示できるカラム（複数選択可）

| カラム | 表示内容 | 表示条件 |
|--------|----------|----------|
| `model` | アクティブモデル名 | 常時 |
| `context` | コンテキスト進捗バー + % | 常時 |
| `effort` | 推論努力レベル。**強度で色分け** — 赤=高・黄=中・緑=低 | `~/.claude/settings.json` で `effortLevel` が設定されている時 |
| `dir` | リポジトリディレクトリ名（ワークツリー内では元リポジトリ名） | 常時 |
| `worktree` | 太字の **`worktree:<id>`** ラベル | git ワークツリー内のみ（入力 JSON または `git` CLI で検出） |
| `git` | Git ブランチ名（作業ツリーが汚れていると黄色） | git リポジトリ内のみ |
| `vim` | Vim モード | Vim キーバインド有効時のみ |

#### テーマ

| テーマ | パレット | バーに実際に描画される前置アイコン |
|--------|----------|------------------------------------|
| `gruvbox` | ティール・アクア進捗・イエロー／グリーン・グレーセパレーター | `✦` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | パープル・グリーン進捗・シアン dir・ピンク worktree | `◈` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | シアン・グリーン進捗・ブルー dir・マゼンタ worktree・ディム `·` | 前置アイコンなし — 色とラベルのみ |
| `minimal` | 端末デフォルト色；high 努力と dirty git のみ赤黄でアクセント | 前置アイコンなし — プレーンテキスト |

#### 努力アイコン

`effort` カラムの前にのみ付きます — お好みで選択：

| アイコン | 名前 |
|----------|------|
| `⚡` | 雷 — 強度（**デフォルト**） |
| `∴` | ゆえに符号 — 推論 |
| `❯` | Pure/Starship プロンプト |
| `➜` | Robbyrussell 矢印 |
| `◉` | 塗り潰し丸 |

#### 例

Dracula、全カラム、effort=high、ワークツリー内：
```
◈ Opus 4.7 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡ high | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

Minimal、モデル + 努力 + ディレクトリ + git、effort=low：
```
Claude Opus 4.7 · ⚡ low · skills-cc · main
```

> ⚠️ **注意：** 生成されたスクリプトは JSON 解析に `jq` が必要です。スキルは `~/.claude/scripts/statusline.sh` を自動生成し `~/.claude/settings.json` を更新します。Claude Code を再起動すると反映されます。

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

## 📄 ライセンス

MIT
