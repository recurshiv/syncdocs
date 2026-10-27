#!/usr/bin/env bash
# Exercises the documents API with two users. Usage: crud-test.sh <base-url>
B=${1:-http://localhost:4000}
O="Origin: $B"
J='Content-Type: application/json'
D=$(mktemp -d)
A="$D/a.txt"; Z="$D/b.txt"

signup() { curl -s -c "$1" -o /dev/null -w "signup %{http_code}\n" -X POST "$B/api/auth/signup" -H "$J" -H "$O" \
  -d "{\"name\":\"$2\",\"email\":\"$2$RANDOM@example.com\",\"password\":\"password123\"}"; }
signup "$A" alice
signup "$Z" bob

echo "== alice creates a doc"
DOC=$(curl -s -b "$A" -X POST "$B/api/documents" -H "$J" -H "$O" -d '{}')
echo "$DOC"
ID=$(echo "$DOC" | sed -E 's/.*"id":"([a-f0-9]+)".*/\1/')

echo "== alice saves content at revision 0"
curl -s -b "$A" -X PATCH "$B/api/documents/$ID" -H "$J" -H "$O" \
  -d '{"baseRevision":0,"title":"Lesson plan","content":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Week one"}]},{"type":"paragraph","content":[{"type":"text","text":"Intro to fractions."}]}]}}' \
  | sed -E 's/"content":\{.*\},"revision"/"content":{...},"revision"/'; echo

echo "== stale save (still based on revision 0) -> expect 409"
curl -s -b "$A" -o /dev/null -w "%{http_code}\n" -X PATCH "$B/api/documents/$ID" -H "$J" -H "$O" -d '{"baseRevision":0,"title":"Old"}'

echo "== alice lists docs (summary with preview, no content)"
curl -s -b "$A" "$B/api/documents"; echo

echo "== bob: list is empty, and alice's doc is 404 for read/update/delete"
curl -s -b "$Z" "$B/api/documents"; echo
curl -s -b "$Z" -o /dev/null -w "GET %{http_code}\n" "$B/api/documents/$ID"
curl -s -b "$Z" -o /dev/null -w "PATCH %{http_code}\n" -X PATCH "$B/api/documents/$ID" -H "$J" -H "$O" -d '{"baseRevision":1,"title":"hacked"}'
curl -s -b "$Z" -o /dev/null -w "DELETE %{http_code}\n" -X DELETE "$B/api/documents/$ID" -H "$O"

echo "== bad id and bad content"
curl -s -b "$A" -o /dev/null -w "GET bad id %{http_code}\n" "$B/api/documents/not-an-id"
curl -s -b "$A" -X PATCH "$B/api/documents/$ID" -H "$J" -H "$O" -d '{"baseRevision":1,"content":{"type":"oops"}}'; echo

echo "== no session -> 401"
curl -s -o /dev/null -w "%{http_code}\n" "$B/api/documents"

echo "== alice deletes, then GET -> 404"
curl -s -b "$A" -o /dev/null -w "DELETE %{http_code}\n" -X DELETE "$B/api/documents/$ID" -H "$O"
curl -s -b "$A" -o /dev/null -w "GET %{http_code}\n" "$B/api/documents/$ID"

rm -rf "$D"
