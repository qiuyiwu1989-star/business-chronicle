#!/usr/bin/env bash
# 把项目全部管理文档打包成单文件 context-pack.md，
# 供没有文件系统的环境（claude.ai 网页 / 其他 AI 工具）一次性粘贴加载。
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="context-pack.md"

{
  echo "# 商业通鉴 · 全量上下文打包"
  echo
  echo "> 本文件由 tools/pack-context.sh 自动生成于 $(date '+%Y-%m-%d %H:%M')。"
  echo "> 用途：在没有文件系统的环境里一次性加载项目全部上下文。"
  echo "> 权威源是仓库里的各个文件，本文件是它们的快照，不要直接编辑。"
  echo
  echo "---"
  echo

  for f in CONTEXT.md CLAUDE.md TASKS.md DECISIONS.md; do
    [ -f "$f" ] || continue
    echo "# ===== $f ====="
    echo
    cat "$f"
    echo
    echo "---"
    echo
  done

  if compgen -G "specs/*.md" > /dev/null; then
    for f in specs/*.md; do
      echo "# ===== $f ====="
      echo
      cat "$f"
      echo
      echo "---"
      echo
    done
  fi

  if [ -f sources/shennao-harvest.md ]; then
    echo "# ===== sources/shennao-harvest.md ====="
    echo
    cat sources/shennao-harvest.md
    echo
    echo "---"
    echo
  fi

  echo "# ===== 数据规模快照 ====="
  echo
  node tools/validate.js --summary 2>/dev/null || echo "（validate.js 未能运行，跳过）"
} > "$OUT"

echo "已生成 $OUT（$(wc -l < "$OUT") 行，$(wc -c < "$OUT") 字节）"
