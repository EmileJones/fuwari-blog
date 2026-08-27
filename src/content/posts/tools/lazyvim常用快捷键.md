---
title: "LazyVim 常用快捷键与界面操作笔记"
published: 2026-08-26
description: "整理 LazyVim 的界面概念、快捷键前缀、文件操作、搜索替换、Buffer 管理及 LSP 常用操作。"
image: ""
tags: [LazyVim, Neovim, Vim, 快捷键, 编辑器]
category: Tools
draft: false
lang: zh_CN
---

# LazyVim 界面与快捷键笔记

本笔记记录 LazyVim 中常用界面、快捷键组织方式及常用功能。

# 界面与核心概念

仅列出日常使用中需要直接操作或区分的界面概念。

| 概念           | 说明                                                                                | 常见操作                              |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| **Buffer**     | Neovim 已打开并在内存中维护的文件内容；文件即使当前不显示，也可能仍作为 Buffer 存在 | 切换、关闭、搜索已打开文件            |
| **Bufferline** | 顶部显示已打开 Buffer 的列表                                                        | 查看当前已打开文件                    |
| **Window**     | 用于显示 Buffer 或插件界面的区域                                                    | 在 Explorer、代码窗口、分屏之间切换   |
| **Tab**        | 一组 Window 布局，不等同于浏览器中“一页一个文件”的 Tab                              | 管理多套窗口布局                      |
| **Explorer**   | 文件树 / 文件浏览器，LazyVim 主要使用 Snacks Explorer                               | 浏览、新建、删除、重命名、打开文件    |
| **Picker**     | 搜索和选择界面                                                                      | 查文件、全文搜索、查 Buffer、查快捷键 |
| **Preview**    | Explorer / Picker 中的预览区域                                                      | 预览当前选中的文件或搜索结果          |

核心关系：

| 关系                       | 含义                                          |
| -------------------------- | --------------------------------------------- |
| `Buffer → Window`          | Window 用于显示 Buffer                        |
| `多个 Buffer → Bufferline` | Bufferline 展示已经打开的 Buffer              |
| `多个 Window → Tab`        | 一个 Tab 保存一组 Window 布局                 |
| `Explorer → 文件 → Buffer` | 从 Explorer 打开的文件进入 Buffer             |
| `Picker → 搜索结果`        | Picker 用于搜索并选择文件、Buffer、文本等对象 |

---

# 快捷键前缀

LazyVim 使用 which-key。**在 Normal 模式下按下一个快捷键前缀并稍等，会自动弹出提示框，显示下一步可以输入的按键及对应功能。**

因此多数情况下只需要记住前缀含义，不需要一次记住全部完整快捷键。

| 前缀      | 含义 / 功能组                  | 示例                                         |
| --------- | ------------------------------ | -------------------------------------------- |
| `[`       | Previous / 上一个              | `[b`：上一个 Buffer                          |
| `]`       | Next / 下一个                  | `]b`：下一个 Buffer                          |
| `g`       | Goto / 跳转及 `g` 系列操作     | `gd`：跳转 Definition                        |
| `z`       | Fold / Vim `z` 系列操作        | `z=`：拼写建议                               |
| `Space`   | `<leader>`，LazyVim 主功能入口 | `Space s g`：Search → Grep                   |
| `Space b` | Buffer                         | Buffer 切换、关闭等                          |
| `Space c` | Code                           | Format、Rename、Code Action                  |
| `Space d` | Debug                          | Debug 相关功能                               |
| `Space f` | File / Find                    | 文件查找                                     |
| `Space g` | Git                            | Git 相关功能                                 |
| `Space q` | Quit / Session                 | 退出、Session                                |
| `Space s` | Search                         | 搜索、Grep、Keymaps、Help                    |
| `Space u` | UI / Toggle                    | 拼写、格式化、行号等开关                     |
| `Space w` | Window                         | Window 操作                                  |
| `Space x` | Diagnostics / Quickfix         | Diagnostics、Quickfix                        |
| `Ctrl+w`  | Vim 原生 Window 前缀           | Window 相关操作                              |
| "         | Register / 寄存器选择          | "+y：复制到系统剪贴板；"+p：从系统剪贴板粘贴 |

如果忘记了快捷键，则可以通过以下方式查找：

| 场景                         | 操作                                            |
| ---------------------------- | ----------------------------------------------- |
| 已经知道前缀                 | 在 Normal 模式按前缀后稍等，查看 which-key 弹框 |
| 知道功能但不知道快捷键       | `Space s k`，打开 Keymaps Picker 后搜索功能名称 |
| 查询 Vim / Neovim 帮助       | `Space s h`                                     |
| 查看当前 Buffer 的相关快捷键 | `Space ?`                                       |

---

# Explorer 与文件操作

| 快捷键        | 功能          | 说明                              |
| ------------- | ------------- | --------------------------------- |
| `Space e`     | 打开 Explorer | 项目 Root                         |
| `Space E`     | 打开 Explorer | 当前 cwd                          |
| `a`           | 新建          | Explorer 中新建文件或目录         |
| `d`           | 删除          | 删除文件或目录                    |
| `r`           | 重命名        | 重命名文件或目录                  |
| `l` / `Enter` | 打开 / 展开   | 打开文件或展开目录                |
| `h` / `Enter` | 收起          | 收起目录                          |
| `H`           | Hidden        | 显示 / 隐藏隐藏文件               |
| `I`           | Ignored       | 显示 / 隐藏 `.gitignore` 忽略文件 |
| `P`           | Preview       | 开启 / 关闭 Preview               |
| `?`           | 帮助          | 查看 Explorer 当前快捷键          |
| `q` / `Esc`   | 退出          | 关闭当前 Explorer 界面            |
| `u`           | 刷新          | 刷新 Explorer                     |

---

# Window

| 快捷键   | 功能        | 说明                            |
| -------- | ----------- | ------------------------------- |
| `Ctrl+h` | 左侧 Window | 常用于从代码区进入左侧 Explorer |
| `Ctrl+j` | 下方 Window | 切换到下方窗口                  |
| `Ctrl+k` | 上方 Window | 切换到上方窗口                  |
| `Ctrl+l` | 右侧 Window | 常用于从 Explorer 返回代码区    |

---

# 搜索与替换

## 文件查找

| 快捷键                      | 功能       | 说明                           |
| --------------------------- | ---------- | ------------------------------ |
| `Space f f` / `Space Space` | Find Files | 按文件名搜索项目 Root 下的文件 |

## 文本搜索

| 快捷键            | 功能         | 搜索范围    |
| ----------------- | ------------ | ----------- |
| `Space s b`       | Buffer Lines | 当前 Buffer |
| `g` / `Space s g` | Grep         | 项目 Root   |

## 当前文件替换

| 命令                               | 功能                             |
| ---------------------------------- | -------------------------------- |
| `:%s/旧文本/新文本/g`              | 当前 Buffer 全部替换             |
| `:%s/旧文本/新文本/gc`             | 当前 Buffer 全部替换，并逐个确认 |
| Visual 选中后 `:s/旧文本/新文本/g` | 仅替换当前选区                   |

## 项目级跨文件替换

| 快捷键      | 功能                                       |
| ----------- | ------------------------------------------ |
| `Space s r` | 打开 Grug Far，执行跨文件 Search & Replace |
| `\r`        | 在 Grug Far 中执行 Replace                 |

---

# Buffer

| 快捷键           | 功能                   | 说明                       |
| ---------------- | ---------------------- | -------------------------- |
| `[b` / `Shift+h` | 上一个 Buffer          | 快速切换                   |
| `]b` / `Shift+l` | 下一个 Buffer          | 快速切换                   |
| `Space ,`        | Buffers Picker         | 搜索并选择已打开 Buffer    |
| `Space b b`      | Switch to Other Buffer | 在最近使用的 Buffer 间切换 |
| `Space b d`      | Delete Buffer          | 关闭当前 Buffer            |
| `Space b o`      | Delete Other Buffers   | 关闭其他 Buffer            |
| `Space f n`      | New File               | 创建新的空 Buffer          |

---

# LSP、代码跳转与语言支持

LazyVim 的代码补全、跳转、Hover、Rename 等功能依赖对应语言的 **LSP Server**。

因此，使用某种语言前，需要先在 LazyVim 中启用对应的语言支持。LazyVim 推荐通过 **Lazy Extras** 完成这一步。

启用语言 Extra 后，LazyVim 会为该语言配置相关的 LSP、Treesitter、Formatter、Lint 等工具。

## 安装语言支持

如果当前处于 LazyVim 启动 Dashboard：

```text
x
```

即可打开：

```text
Lazy Extras
```

如果已经进入普通编辑界面，则执行：

```vim
:LazyExtras
```

进入 Lazy Extras 后，搜索并启用对应语言，例如：

```text
TypeScript / JavaScript → lang.typescript
Python                  → lang.python
Go                      → lang.go
Rust                    → lang.rust
Markdown                → lang.markdown
```

启用完成后，LazyVim 会按照该语言 Extra 的配置加载或安装对应工具。

> `x` 只是在 LazyVim 启动 Dashboard 中打开 Lazy Extras 的快捷键；普通编辑界面应使用 `:LazyExtras`。

## LSP 常用操作

| 快捷键      | 功能            | 说明                       |
| ----------- | --------------- | -------------------------- |
| `gd`        | Definition      | 跳转到定义                 |
| `gI`        | Implementation  | 跳转到实现                 |
| `gr`        | References      | 查找引用                   |
| `gy`        | Type Definition | 跳转到类型定义             |
| `gD`        | Declaration     | 跳转到声明                 |
| `Space c a` | Code Action     | LSP 修复、导入、重构等操作 |
| `Space c r` | Rename          | LSP 符号重命名             |

# 格式化与代码操作

| 快捷键      | 功能                        | 说明                         |
| ----------- | --------------------------- | ---------------------------- |
| `Space c f` | Format                      | 格式化当前文件或 Visual 选区 |
| `Space c a` | Code Action                 | LSP Code Action              |
| `Space c r` | Rename                      | LSP Rename                   |
| `Space u f` | Toggle Auto Format          | 全局自动格式化开关           |
| `Space u F` | Toggle Auto Format (Buffer) | 当前 Buffer 自动格式化开关   |

---

# 注释

| 快捷键           | 功能              | 说明                    |
| ---------------- | ----------------- | ----------------------- |
| `gcc`            | 当前行注释        | 注释 / 取消注释当前行   |
| Visual 模式 `gc` | 选区注释          | 注释 / 取消注释选中区域 |
| `gco`            | Add Comment Below | 当前行下方增加注释行    |
| `gcO`            | Add Comment Above | 当前行上方增加注释行    |

---

# 自动补全

| 快捷键         | 功能         | 说明                |
| -------------- | ------------ | ------------------- |
| `Ctrl+Space`   | 打开补全     | 主动触发 Completion |
| `Ctrl+n` / `↓` | 下一个补全项 | 在补全列表向下移动  |
| `Ctrl+p` / `↑` | 上一个补全项 | 在补全列表向上移动  |
| `Enter`        | 接受补全     | 接受当前选中项      |
| `Ctrl+e`       | 取消补全     | 关闭当前补全菜单    |

代码补全是否能够提供类型、方法、枚举成员等内容，通常取决于对应语言的 LSP 是否已经安装并正常运行。语言支持配置方式见 **9.2 语言 LSP 与代码补全依赖**。

---

# 系统剪贴板

| 快捷键 | 功能      | 说明                               |
| ------ | --------- | ---------------------------------- |
| `"+y`  | Copy      | 将 Visual 选中内容复制到系统剪贴板 |
| `"+yy` | Copy Line | 将当前行复制到系统剪贴板           |
| `"+p`  | Paste     | 从系统剪贴板粘贴                   |

---

# Lazyvim退出

| 快捷键      | 功能     | 说明                      |
| ----------- | -------- | ------------------------- |
| `Space q q` | Quit All | 退出整个 Neovim / LazyVim |
