#!/usr/bin/env bash
# Setzt Version + Shop-URL in die Seite ein und legt das Ergebnis nach dist/site.
set -euo pipefail
cd "$(dirname "$0")/.."
SHOP_URL="${SHOP_URL:-https://shop.eensmusic.com/?utm_source=eensmusic.com&utm_medium=website}"
V="$(cat src/index.html src/site.css src/site.js | sha256sum | cut -c1-10)"
mkdir -p dist/site
rm -f dist/site/site.*
sed -e "s|/assets/site.css?v=__V__|/assets/site.$V.css|g" -e "s|/assets/site.js?v=__V__|/assets/site.$V.js|g" -e "s|__SHOP__|${SHOP_URL//&/\\&amp;}|g" src/index.html > dist/site/index.html
cp src/site.css "dist/site/site.$V.css"; cp src/site.js "dist/site/site.$V.js"
echo "version $V"
