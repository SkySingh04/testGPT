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

if [ -n "$PR_FILES" ]; then
  IFS=',' read -ra FILES <<< "$PR_FILES"
  
  for lang in $DETECTED_LANGUAGES; do
    case "$lang" in
      go)
        GO_FILES=()
        for file in "${FILES[@]}"; do
          if [[ $file == *.go ]]; then
            GO_FILES+=("$file")
          fi
        done
        if [ ${#GO_FILES[@]} -gt 0 ]; then
          golangci-lint run --out-format=github-actions "${GO_FILES[@]}" > analysis-reports/go-lint.txt 2>&1 || true
        else
          echo "No Go files changed in PR" > analysis-reports/go-lint.txt
        fi
        ;;
      javascript)
        JS_FILES=()
        for file in "${FILES[@]}"; do
          if [[ $file == *.js || $file == *.ts || $file == *.jsx || $file == *.tsx ]]; then
            JS_FILES+=("$file")
          fi
        done
        if [ ${#JS_FILES[@]} -gt 0 ] && ([ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.yml" ]); then
          eslint "${JS_FILES[@]}" --format junit -o analysis-reports/js-lint.xml 2>&1 || true
        else
          echo "No JavaScript/TypeScript files changed in PR or no ESLint config found" > analysis-reports/js-lint.txt
        fi
        ;;
      python)
        PY_FILES=()
        for file in "${FILES[@]}"; do
          if [[ $file == *.py ]]; then
            PY_FILES+=("$file")
          fi
        done
        if [ ${#PY_FILES[@]} -gt 0 ]; then
          flake8 "${PY_FILES[@]}" --output-file=analysis-reports/py-lint.txt 2>&1 || true
          bandit -r "${PY_FILES[@]}" -f txt -o analysis-reports/py-security.txt 2>&1 || true
        else
          echo "No Python files changed in PR" > analysis-reports/py-lint.txt
        fi
        ;;
    esac
  done
else
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
fi

temp_file=$(mktemp)
for report in analysis-reports/*; do
  if [ -f "$report" ]; then
    echo "### $(basename "$report")" >> "$temp_file"
    cat "$report" >> "$temp_file"
    echo -e "\n---\n" >> "$temp_file"
  fi
done
mv "$temp_file" analysis-reports/final-report.txt