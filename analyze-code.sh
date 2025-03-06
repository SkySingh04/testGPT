#!/bin/bash

cd $GITHUB_WORKSPACE/$WORKDIR
mkdir -p analysis-reports

for lang in $DETECTED_LANGUAGES; do
  case "$lang" in
    go)
      command -v golangci-lint >/dev/null || go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
      ;;
    javascript)
      command -v eslint >/dev/null || npm install -g eslint
      ;;
    python)
      command -v flake8 >/dev/null || pip install flake8 bandit
      ;;
  esac
done

for lang in $DETECTED_LANGUAGES; do
  case "$lang" in
    go)
      golangci-lint run --out-format=github-actions ./... > analysis-reports/go-lint.txt 2>&1 || true
      ;;
    javascript)
      if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yml" ]; then
        eslint . --format junit -o analysis-reports/js-lint.xml 2>&1 || true
      else
        echo "No ESLint config found, skipping JavaScript linting" > analysis-reports/js-lint.txt
      fi
      ;;
    python)
      flake8 . --output-file=analysis-reports/py-lint.txt 2>&1 || true
      bandit -r . -f txt -o analysis-reports/py-security.txt 2>&1 || true
      ;;
  esac
done

# Combine reports into a single file
temp_file=$(mktemp)
for report in analysis-reports/*; do
  if [ -f "$report" ]; then
    echo "### $(basename "$report")" >> "$temp_file"
    cat "$report" >> "$temp_file"
    echo -e "\n---\n" >> "$temp_file"
  fi
done
mv "$temp_file" analysis-reports/final-report.txt