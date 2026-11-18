#!/usr/bin/env bash
# Setzt Version + Shop-URL in die Seite ein und legt das Ergebnis nach dist/site.
set -euo pipefail
cd "$(dirname "$0")/.."
SHOP_URL="${SHOP_URL:-https://shop.eensmusic.com/?utm_source=eensmusic.com&utm_medium=website}"
V="$(cat src/index.html src/site.css src/site.js | sha256sum | cut -c1-10)"
mkdir -p dist/site
sed -e "s|__V__|$V|g" -e "s|__SHOP__|${SHOP_URL//&/\\&amp;}|g" src/index.html > dist/site/index.html
cp src/site.css src/site.js dist/site/
echo "version $V"
