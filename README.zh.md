# 🛠️ webup-skills-cc

Claude Code 实用技能插件 —— 定制与黑科技合集。

[English](README.md) | [日本語](README.ja.md)

## 📦 安装

🔍 交互式浏览和选择技能：
```bash
npx skills find webup/skills-cc
```
🌐 全局安装全部技能：
```bash
npx skills add webup/skills-cc -g
```
🎯 全局安装单个技能：
```bash
npx skills add webup/skills-cc -s webup-statusline -g
```

## 🎮 技能列表

### 📊 webup-statusline

生成并安装自定义 Claude Code 状态栏。三个维度 —— **字段**、**主题**、**努力度图标** —— 自由组合。

**在 Claude Code 中调用：**

```
# 交互式 — 依次选择字段、主题、图标
/webup-statusline

# 快速选择主题
/webup-statusline dracula

# 自然语言
/webup-statusline 极简主题 加上git分支和进度条
```

#### 可显示字段（多选）

| 字段 | 显示内容 | 何时可见 |
|------|----------|----------|
| `model` | 活跃模型名 | 始终显示 |
| `context` | 上下文进度条 + 百分比 | 始终显示 |
| `effort` | 推理努力度，**按强度着色** —— 红=高、黄=中、绿=低 | 当 `~/.claude/settings.json` 中设置了 `effortLevel` |
| `dir` | 仓库目录名（在工作树中显示原仓库名） | 始终显示 |
| `worktree` | 加粗的 **`worktree:<id>`** 标签 | 仅在 git 工作树中（通过输入 JSON 或 `git` CLI 检测） |
| `git` | Git 分支名（工作目录脏时变黄） | 仅在 git 仓库中 |
| `vim` | Vim 模式 | 仅在启用 vim 键位时 |

#### 主题

| 主题 | 配色 | 实际渲染的前缀图标 |
|------|------|--------------------|
| `gruvbox` | 青绿模型 · 水绿进度 · 黄/绿点缀 · 灰色分隔 | `✦` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | 紫色模型 · 绿色进度 · 青色目录 · 粉色工作树 | `◈` model · `↯` context · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | 青色模型 · 绿色进度 · 蓝色目录 · 品红工作树 · 暗 `·` 分隔 | 无前缀图标 —— 仅靠颜色与文本 |
| `minimal` | 使用终端默认色；仅高努力度与脏 git 用红黄点缀 | 无前缀图标 —— 纯文本 |

#### 努力度图标

仅放在 `effort` 字段之前 —— 选择你喜欢的：

| 图标 | 名称 |
|------|------|
| `⚡` | 闪电 —— 强度（**默认**） |
| `∴` | 因此符号 —— 推理 |
| `❯` | Pure/Starship 提示符 |
| `➜` | Robbyrussell 箭头 |
| `◉` | 实心圆 |

#### 示例

Dracula，全部字段，effort=high，工作树内：
```
◈ Opus 4.7 | ↯ [■■■■■■■■■■□□□□□□□□□□] 49% | ⚡ high | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

Minimal，模型 + 努力度 + 目录 + git，effort=low：
```
Claude Opus 4.7 · ⚡ low · skills-cc · main
```

> ⚠️ **注意：** 生成的脚本需要 `jq` 解析 JSON。本技能会自动写入 `~/.claude/scripts/statusline.sh` 并更新 `~/.claude/settings.json` —— 重启 Claude Code 即可生效。

### 🎰 webup-buddy-reroll

重新抽取 `/buddy` 宠物伙伴，指定物种和稀有度 —— 包括 ✨ 传说级。还能给宠物改名、自定义个性描述。

Claude Code 的宠物系统是确定性的：`hash(userID + SALT)` 始终生成同一只宠物。本技能通过暴力搜索，找到一个能映射到目标组合的 userID。

> **API 用户**：直接可用。**Pro/Max 订阅用户**：技能会自动检测 `accountUuid` 并引导你完成 OAuth 设置以绕过锁定 —— 无需手动操作。

**在 Claude Code 中调用：**

```
# 交互式 — 选择物种、稀有度、名字、个性
/webup-buddy-reroll

# 仅 reroll
/webup-buddy-reroll dragon legendary

# reroll + 改名一步到位
/webup-buddy-reroll dragon legendary 沧海九粟 爱打盹的小龙

# 仅改名/改个性（自然语言）
/webup-buddy-reroll 改名叫沧海九粟，个性是爱打盹的小龙
```

**🐾 18 个物种：**

| | | | | | |
|---|---|---|---|---|---|
| 🦆 duck 鸭子 | 🪿 goose 鹅 | 🫧 blob 果冻 | 🐱 cat 猫 | 🐉 dragon 龙 | 🐙 octopus 章鱼 |
| 🦉 owl 猫头鹰 | 🐧 penguin 企鹅 | 🐢 turtle 乌龟 | 🐌 snail 蜗牛 | 👻 ghost 幽灵 | 🦎 axolotl 六角恐龙 |
| 🦫 capybara 水豚 | 🌵 cactus 仙人掌 | 🤖 robot 机器人 | 🐰 rabbit 兔子 | 🍄 mushroom 蘑菇 | 🐷 chonk 胖墩 |

**💎 5 个稀有度：** ★ common 普通 (60%) · ★★ uncommon 稀有 (25%) · ★★★ rare 精良 (10%) · ★★★★ epic 史诗 (4%) · ★★★★★ legendary 传说 (1%)

重新抽取后，重启 Claude Code 并执行 `/buddy` 即可领取新宠物！🎉

> ⚠️ **注意：** 需要 Bun 运行时（`Bun.hash()` 与 Claude Code 内部哈希一致）。Node.js 会产生错误结果。

## 📄 许可证

MIT
