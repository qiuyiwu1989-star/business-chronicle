#!/usr/bin/env bash
# 商业通鉴 · 增量部署到 shangye.qiuyiwu.com
# 用法: ./scripts/deploy.sh
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_HOST="${DEPLOY_HOST:-146.56.239.22}"          # 南京生产机（不是硅谷旧机）
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/shangye.qiuyiwu.com}"
DEPLOY_URL="${DEPLOY_URL:-https://shangye.qiuyiwu.com}"
# publickey 必须在最前，否则非交互 shell 会卡在 keyboard-interactive
SSH_OPTS=(-o StrictHostKeyChecking=accept-new -o PreferredAuthentications=publickey,keyboard-interactive,password)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="/tmp/shangye-deploy.tar.gz"

# 全部运行时文件。漏一个线上就 404。
# 自检: grep -oE '(src|href)="\./[^"]+"' index.html
FILES=(
  index.html
  style.v22.css
  data.v22.js
  app.v22.js
  manifest.webmanifest
  sw.js
  robots.txt
  sitemap.xml
  llms.txt
  llms-full.txt
  assets
)

# 部署前先跑数据校验 + 重新生成 SEO 产物，防止内容与导出文件不同步
echo "▸ 校验数据"
node "${ROOT_DIR}/tools/validate.js" > /dev/null || { echo "  ✕ 数据校验未通过，中止部署" >&2; exit 1; }
echo "▸ 重新生成 SEO 产物"
node "${ROOT_DIR}/tools/build-seo.js"

echo "▸ 打包 ${DEPLOY_URL}"
for f in "${FILES[@]}"; do
  if [[ ! -e "${ROOT_DIR}/${f}" ]]; then
    echo "  ✕ 缺文件: ${f}" >&2
    exit 1
  fi
  echo "  • ${f}"
done

tar --no-xattrs --disable-copyfile -czf "${ARCHIVE}" -C "${ROOT_DIR}" "${FILES[@]}"

echo "▸ 上传到 ${DEPLOY_USER}@${DEPLOY_HOST}"
scp "${SSH_OPTS[@]}" "${ARCHIVE}" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/$(basename ${ARCHIVE})"

echo "▸ 服务器解包"
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "
  sudo mkdir -p '${DEPLOY_PATH}' &&
  sudo tar -xzf /tmp/$(basename ${ARCHIVE}) -C '${DEPLOY_PATH}' &&
  sudo chown -R www-data:www-data '${DEPLOY_PATH}' &&
  sudo find '${DEPLOY_PATH}' -name '._*' -delete &&
  rm /tmp/$(basename ${ARCHIVE})
"

rm "${ARCHIVE}"

echo "▸ 冒烟测试"
for path in / /llms-full.txt /robots.txt /sitemap.xml /manifest.webmanifest /sw.js /data.v22.js; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}${path}")
  printf "  %-24s %s\n" "${path}" "${code}"
done

echo ""
echo "✓ 完成: ${DEPLOY_URL}"
