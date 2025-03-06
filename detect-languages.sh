#!/bin/bash

declare -A extensions=(
  ["go"]="go"
  ["js"]="javascript"
  ["ts"]="javascript" 
  ["py"]="python"
  ["java"]="java"
)

LANGUAGES=""
for file in $(find . -type f); do
  ext="${file##*.}"
  if [[ -n "${extensions[$ext]}" ]]; then
    LANGUAGES+="${extensions[$ext]} "
  fi
done

UNIQUE_LANGS=$(echo "$LANGUAGES" | tr ' ' '\n' | sort -u | tr '\n' ' ')
echo "languages=$UNIQUE_LANGS" >> $GITHUB_OUTPUT