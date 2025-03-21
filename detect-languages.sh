#!/bin/bash

declare -A extensions=(
  ["go"]="go"
  ["js"]="javascript"
  ["ts"]="javascript"
  ["jsx"]="javascript"
  ["tsx"]="javascript"
  ["py"]="python"
  ["java"]="java"
)

LANGUAGES=""

# Exclude common non-source files
while IFS= read -r file; do
  ext="${file##*.}"
  if [[ -n "${extensions[$ext]}" ]]; then
    LANGUAGES+="${extensions[$ext]} "
  fi
done < <(find . -type f \
  -not -path "*/\.*/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/target/*" \
  -not -path "*/vendor/*" \
  -not -path "*/__pycache__/*" \
  -size -1M)

UNIQUE_LANGS=$(echo "$LANGUAGES" | tr ' ' '\n' | sort -u | tr '\n' ' ')
echo "languages=$UNIQUE_LANGS" >> $GITHUB_OUTPUT