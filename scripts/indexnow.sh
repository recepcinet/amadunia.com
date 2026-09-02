#!/usr/bin/env bash
# Tell IndexNow-capable search engines (Bing, Yandex, Seznam, Naver…) which
# URLs changed. Run after a deploy. Reads the URL list from the live sitemap.
set -euo pipefail
HOST=amadunia.com
KEY=fe3c1751182a70c07c160c57c9dd5e42
URLS=$(curl -sS "https://$HOST/sitemap-0.xml" | grep -oE '<loc>[^<]+</loc>' | sed 's/<[^>]*>//g' | python3 -c 'import sys,json;print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')
curl -sS -o /dev/null -w "IndexNow: HTTP %{http_code}\n" -X POST "https://api.indexnow.org/indexnow" \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"https://$HOST/$KEY.txt\",\"urlList\":$URLS}"
