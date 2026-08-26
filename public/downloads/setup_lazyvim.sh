#!/usr/bin/env bash

set -euo pipefail

NVIM_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
NVIM_CONFIG_LUA_DIR="$NVIM_CONFIG_DIR/lua/config"
NVIM_PLUGINS_DIR="$NVIM_CONFIG_DIR/lua/plugins"
MARKDOWNLINT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/markdownlint"

OPTIONS_FILE="$NVIM_CONFIG_LUA_DIR/options.lua"
SNACKS_FILE="$NVIM_PLUGINS_DIR/snacks.lua"
MARKDOWNLINT_LUA_FILE="$NVIM_PLUGINS_DIR/markdownlint.lua"
MARKDOWNLINT_CONFIG_FILE="$MARKDOWNLINT_DIR/.markdownlint.yaml"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

backup_file() {
  local file="$1"

  if [[ -f "$file" ]]; then
    cp "$file" "${file}.bak-${TIMESTAMP}"
    echo "Backup: $file -> ${file}.bak-${TIMESTAMP}"
  fi
}

echo "Configuring LazyVim..."

# ---------------------------------------------------------------------------
# 1. Create required directories
# ---------------------------------------------------------------------------

mkdir -p "$NVIM_CONFIG_LUA_DIR"
mkdir -p "$NVIM_PLUGINS_DIR"
mkdir -p "$MARKDOWNLINT_DIR"

# ---------------------------------------------------------------------------
# 2. Enable mouse
# ---------------------------------------------------------------------------

touch "$OPTIONS_FILE"

if ! grep -Eq '^[[:space:]]*vim\.opt\.mouse[[:space:]]*=' "$OPTIONS_FILE"; then
  cat >> "$OPTIONS_FILE" <<'EOF'

-- 在 Neovim 的所有常用模式下启用鼠标。
-- "a" 表示 Normal、Visual、Insert、Command 等模式都允许使用鼠标。
vim.opt.mouse = "a"
EOF

  echo "Updated: $OPTIONS_FILE"
else
  echo "Skipped: mouse option already exists in $OPTIONS_FILE"
fi

# ---------------------------------------------------------------------------
# 3. Configure Snacks Explorer / Find Files / Grep
# ---------------------------------------------------------------------------

backup_file "$SNACKS_FILE"

cat > "$SNACKS_FILE" <<'EOF'
return {
  {
    "folke/snacks.nvim",
    opts = {
      picker = {
        sources = {
          explorer = {
            -- Explorer 默认显示隐藏文件和隐藏目录。
            -- 例如：.env、.github、.config 等。
            hidden = true,

            -- Explorer 默认显示被 .gitignore 忽略的文件和目录。
            -- 例如：node_modules、dist 等，具体取决于项目的 .gitignore。
            ignored = true,
          },

          files = {
            -- Find Files 搜索文件时包含隐藏文件和隐藏目录。
            hidden = true,

            -- Find Files 搜索文件时包含被 .gitignore 忽略的文件和目录。
            ignored = true,
          },

          grep = {
            -- Grep 全文搜索时包含隐藏文件和隐藏目录中的内容。
            hidden = true,
          },
        },
      },
    },
  },
}
EOF

echo "Updated: $SNACKS_FILE"

# ---------------------------------------------------------------------------
# 4. Configure global MarkdownLint rules
# ---------------------------------------------------------------------------

backup_file "$MARKDOWNLINT_CONFIG_FILE"

cat > "$MARKDOWNLINT_CONFIG_FILE" <<'EOF'
# MD013：行长度检查。
# false 表示不再因为 Markdown 单行过长而产生 lint 警告。
MD013: false

# MD025：一个 Markdown 文档只能存在一个一级标题。
# false 表示允许同一文档中存在多个 "# 一级标题"。
MD025: false
EOF

echo "Updated: $MARKDOWNLINT_CONFIG_FILE"

# ---------------------------------------------------------------------------
# 5. Make LazyVim use the global MarkdownLint configuration
# ---------------------------------------------------------------------------

backup_file "$MARKDOWNLINT_LUA_FILE"

cat > "$MARKDOWNLINT_LUA_FILE" <<'EOF'
-- 定义所有项目默认使用的全局 MarkdownLint 配置文件。
local markdownlint_config =
  vim.fn.expand("~/.config/markdownlint/.markdownlint.yaml")

return {
  {
    "mfussenegger/nvim-lint",
    opts = {
      linters = {
        ["markdownlint-cli2"] = {
          -- Markdown lint 时显式指定全局 MarkdownLint 配置。
          --
          -- prepend_args 会在 nvim-lint 原有参数前添加这些参数，
          -- 从而保留 nvim-lint 对 markdownlint-cli2 的默认调用方式。
          prepend_args = {
            "--config",
            markdownlint_config,
            "--",
          },
        },
      },
    },
  },

  {
    "stevearc/conform.nvim",
    opts = {
      formatters = {
        ["markdownlint-cli2"] = {
          -- Markdown 格式化时也显式使用同一份全局配置，
          -- 保证 lint 和 format 使用一致的 MarkdownLint 规则。
          prepend_args = {
            "--config",
            markdownlint_config,
          },
        },
      },
    },
  },
}
EOF

echo "Updated: $MARKDOWNLINT_LUA_FILE"

echo
echo "LazyVim global configuration completed."
echo
echo "Configured files:"
echo "  $OPTIONS_FILE"
echo "  $SNACKS_FILE"
echo "  $MARKDOWNLINT_CONFIG_FILE"
echo "  $MARKDOWNLINT_LUA_FILE"
echo
echo "Restart Neovim for the changes to take effect."
