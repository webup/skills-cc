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

カスタム Claude Code ステータスラインを生成・インストール。**カラム** と **テーマ** を選ぶだけ。`context` と `effort` の 2 カラムは **レベルに応じて色が変わる** ので、一目で状況が分かります。

#### ルック＆フィール

フルセット（全カラム）、残量 49%、セッションコスト $0.42、`effortLevel: high`、出力スタイル `Explanatory`、ワークツリー内：

<img src="./docs/examples/dracula-full.svg" alt="Dracula テーマ全カラムの例" />

*Dracula テーマ — 黄色バー（注意）、ゴールド `$0.42`（セッション支出）、太字赤 `↯ high`（圧迫）、パープル `❋ Explanatory`（出力スタイル）、ピンク worktree ラベル。*

<details><summary>プレーンテキスト</summary>

```
◈ Opus 4.7 | [■■■■■■■■■■□□□□□□□□□□] 49% | $0.42 | ↯ high | ❋ Explanatory | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

</details>

余裕ありセッション — 残量 88%、`effortLevel: medium`、出力スタイル default（非表示）：

<img src="./docs/examples/gruvbox-healthy.svg" alt="Gruvbox テーマ余裕セッションの例" />

*Gruvbox Dark — 緑バー（余裕）、黄色 effort；出力スタイルは `default` のため非表示。*

<details><summary>プレーンテキスト</summary>

```
✦ Opus 4.7 | [■■□□□□□□□□□□□□□□□□□□] 12% | ↯ medium | ⌂ skills-cc | ⎇ main
```

</details>

#### Claude Code での呼び出し方

```
# 対話式 — カラムとテーマを順に選択
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
| `context` | コンテキスト進捗バー + % — **残量に応じて色が変化** | 常時 |
| `cost` | セッション API 支出 `$X.XX`（ゴールド、例：`$0.42`） | `cost.total_cost_usd` が四捨五入して ≥ $0.01 の時 |
| `effort` | 推論努力レベル — **強度で色分け**（`low`/`medium`/`high`/`xhigh`/`max` 対応） | `~/.claude/settings.json` で `effortLevel` が設定されている時 |
| `style` | 出力スタイル名（例：`Explanatory`、`Learning`）— Claude のブランドカラーに合わせたパープル | `output_style.name` が `default` 以外の時 |
| `dir` | リポジトリディレクトリ名（ワークツリー内では元リポジトリ名） | 常時 |
| `worktree` | 太字の **`worktree:<id>`** ラベル | git ワークツリー内のみ（入力 JSON または `git` CLI で検出） |
| `git` | Git ブランチ名（作業ツリーが汚れていると黄色） | git リポジトリ内のみ |
| `vim` | Vim モード | Vim キーバインド有効時のみ |

#### 色が変わるカラム（統一カラースキーマ）

`context` と `effort` は同じ信号機ポリシーを共有 — 緑=余裕、黄=注意、赤=圧迫。一目で状態が分かります。

| 強度 | 色 | `context`（残量） | `effort`（レベル） |
|------|----|-------------------|---------------------|
| 🟢 余裕 | 緑 | **> 50%** — 十分 | `low`（`xlow`・`minimal` 含む） |
| 🟡 注意 | 黄 | **20–50%** — 要警戒 | `medium` |
| 🔴 圧迫 | 赤（effort は太字） | **< 20%** — 残りわずか、そろそろ圧縮 | `high`（`xhigh`・`max` 含む） |

各テーマは自身のパレットから緑／黄／赤の具体色を取るため、ポリシーは統一されつつ見た目はテーマに馴染みます。

#### テーマ

| テーマ | 雰囲気 | バーに実際に描画される前置アイコン |
|--------|--------|------------------------------------|
| `gruvbox` | レトロ暖色、落ち着いた配色 | `✦` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | モダンダーク、彩度高め | `◈` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | クラシック oh-my-zsh | 前置アイコンなし — 色とラベルのみ |
| `minimal` | 端末デフォルト色 | 前置アイコンなし — プレーンテキスト |

`context` カラムは意図的に前置アイコンなし — 色付き進捗バーが視覚的に十分な情報量を持っています。

**effort アイコンの上書き**は `--effort-icon` で。プリセット：`arrow`（`↯`、デフォルト）、`bolt`（`ϟ`）、`flash`（`⚡`）、`reason`（`∴`）、`dot`（`◉`）、`none`（非表示）。任意の文字も受け付けます。

> ⚠️ **注意：** 生成されたスクリプトは JSON 解析に `jq` が必要です。Windows では WinGet や scoop でインストールされた jq のパスを自動検出します。それでも jq が見つからない場合は、手動でディレクトリを PATH に追加してください。スキルは `~/.claude/scripts/statusline.sh` を自動生成し `~/.claude/settings.json` を更新します。Claude Code を再起動すると反映されます。

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
