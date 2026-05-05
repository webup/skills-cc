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

生成并安装自定义 Claude Code 状态栏。选择 **字段** 和 **主题**，仅此而已。其中两个字段（`context` 和 `effort`）会 **随级别动态换色**，一眼看清当前状态。

#### 效果预览

完整字段，剩余 49%，累计消费 $0.42，`effortLevel: high`，输出样式 `Explanatory`，工作树内：

<img src="./docs/examples/dracula-full.svg" alt="Dracula 主题全字段示例" />

*Dracula 主题 —— 黄色进度条（留意）、金色 `$0.42`（会话消费）、加粗红色 `↯ high`（压力）、紫色 `❋ Explanatory`（输出样式）、粉色 worktree 标签。*

<details><summary>纯文本</summary>

```
◈ Opus 4.7 | [■■■■■■■■■■□□□□□□□□□□] 49% | $0.42 | ↯ high | ❋ Explanatory | ⌂ clawmaster | ⊕ worktree:46a6 | ⎇ feat/xyz
```

</details>

轻松状态 —— 剩余 88%、`effortLevel: medium`，输出样式 default（隐藏）：

<img src="./docs/examples/gruvbox-healthy.svg" alt="Gruvbox 主题轻松状态" />

*Gruvbox Dark —— 绿色进度条（轻松）、黄色 effort；输出样式字段隐藏，因为值是 `default`。*

<details><summary>纯文本</summary>

```
✦ Opus 4.7 | [■■□□□□□□□□□□□□□□□□□□] 12% | ↯ medium | ⌂ skills-cc | ⎇ main
```

</details>

#### 在 Claude Code 中调用

```
# 交互式 — 依次选择字段和主题
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
| `context` | 上下文进度条 + 百分比 —— **颜色随剩余容量变化** | 始终显示 |
| `cost` | 会话累计消费 `$X.XX`（金色，例如 `$0.42`） | 当 `cost.total_cost_usd` 四舍五入后 ≥ $0.01 |
| `effort` | 推理努力度 —— **按强度着色**（支持 `low`/`medium`/`high`/`xhigh`/`max`） | 当 `~/.claude/settings.json` 中设置了 `effortLevel` |
| `style` | 输出样式名（例如 `Explanatory`、`Learning`）—— 紫色呼应 Claude 品牌色 | 当 `output_style.name` 不是 `default` 时 |
| `dir` | 仓库目录名（在工作树中显示原仓库名） | 始终显示 |
| `worktree` | 加粗的 **`worktree:<id>`** 标签 | 仅在 git 工作树中（通过输入 JSON 或 `git` CLI 检测） |
| `git` | Git 分支名（工作目录脏时变黄） | 仅在 git 仓库中 |
| `vim` | Vim 模式 | 仅在启用 vim 键位时 |

#### 会动态变色的字段（统一配色策略）

`context` 和 `effort` 共用同一套红绿灯配色 —— 绿=轻松、黄=留意、红=压力。扫一眼就知道状态。

| 强度 | 颜色 | `context`（剩余） | `effort`（级别） |
|------|------|-------------------|------------------|
| 🟢 轻松 | 绿色 | **> 50%** —— 容量充足 | `low`（含 `xlow`、`minimal`） |
| 🟡 留意 | 黄色 | **20–50%** —— 需注意 | `medium` |
| 🔴 压力 | 红色（effort 加粗） | **< 20%** —— 即将用满，准备压缩 | `high`（含 `xhigh`、`max`） |

每个主题从自己的调色板里取绿/黄/红的具体色值，策略统一、视觉贴合主题。

#### 主题

| 主题 | 风格 | 实际渲染的前缀图标 |
|------|------|--------------------|
| `gruvbox` | 暖色复古，柔和 | `✦` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `dracula` | 现代暗色，饱和度高 | `◈` model · `↯` effort · `❋` style · `⌂` dir · `⊕` worktree · `⎇` git · `⌨` vim |
| `robbyrussell` | 经典 oh-my-zsh | 无前缀图标 —— 仅靠颜色和文本 |
| `minimal` | 终端默认色 | 无前缀图标 —— 纯文本 |

`context` 字段刻意不带前缀图标 —— 彩色进度条本身已经足够醒目。

**替换 effort 图标** 用 `--effort-icon`。预设值：`arrow`（`↯`，默认）、`bolt`（`ϟ`）、`flash`（`⚡`）、`reason`（`∴`）、`dot`（`◉`）、`none`（隐藏）。也可直接传入任意字符。

> ⚠️ **注意：** 生成的脚本需要 `jq` 解析 JSON。在 Windows 下，脚本会自动检测 WinGet 和 scoop 安装的 jq 路径；若仍无法找到 jq，请手动将其目录添加到 PATH。本技能会自动写入 `~/.claude/scripts/statusline.sh` 并更新 `~/.claude/settings.json` —— 重启 Claude Code 即可生效。

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
