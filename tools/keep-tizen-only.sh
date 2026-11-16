#!/usr/bin/env bash
# Keeps this fork Tizen-only, from the lists in tools/tizen-only.txt.
#
#   tools/keep-tizen-only.sh            # delete what the [remove] list names, if it is there (a merge brings it back)
#   tools/keep-tizen-only.sh --settle   # while a merge has conflicts: take [remove] paths away and [keep-ours] files
#                                       # from this fork; exit 1 on any other conflict, so you settle it by hand
#
# The "Sync from upstream" workflow runs both after it merges simbasjungles/free-my-tv.
set -euo pipefail
cd "$(dirname "$0")/.."
list="tools/tizen-only.txt"

# Prints the entries of one [section] of the list, without comments or blank lines.
entries() {
  sed -e 's/#.*//' -e 's/[[:space:]]*$//' -e 's/^[[:space:]]*//' "$list" | awk -v s="[$1]" '
    /^\[/ { on = ($0 == s); next }
    on && NF'
}

# True when $1 is one of the entries given on stdin, or inside one of them (a folder).
covered() {
  local path="$1" entry
  while IFS= read -r entry; do
    if [ "$path" = "$entry" ] || [[ "$path" == "$entry"/* ]]; then return 0; fi
  done
  return 1
}

if [ "${1:-}" = "--settle" ]; then
  while IFS= read -r path; do
    if entries remove | covered "$path"; then
      git rm -r -q --ignore-unmatch -- "$path"
    elif entries keep-ours | covered "$path"; then
      git checkout --ours -- "$path"
      git add -- "$path"
    else
      echo "Unresolved conflict, settle it by hand: $path" >&2
      exit 1
    fi
  done < <(git diff --name-only --diff-filter=U)
fi

entries remove | while IFS= read -r path; do
  if [ -e "$path" ]; then
    rm -rf -- "$path"
    git add -A -- "$path"
    echo "removed $path"
  fi
done
