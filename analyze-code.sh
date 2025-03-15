#!/bin/bash

# Change to the workspace directory
cd $GITHUB_WORKSPACE/$WORKDIR

# Ensure analysis-reports directory exists
mkdir -p analysis-reports

# Function to find existing linter installations
find_linter() {
  local linter_name=$1
  local system_path=$(which $linter_name 2>/dev/null)
  echo $system_path
}

# Log message function
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_message "Starting code analysis"

for lang in $DETECTED_LANGUAGES; do
  case "$lang" in
    go)
      GO_LINTER=$(find_linter golangci-lint)
      if [ -z "$GO_LINTER" ]; then
        log_message "Installing golangci-lint..."
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
      else
        log_message "Using system golangci-lint: $GO_LINTER"
      fi
      ;;
    javascript)
      JS_LINTER=$(find_linter eslint)
      if [ -z "$JS_LINTER" ]; then
        log_message "Installing eslint..."
        npm install -g eslint
      else
        log_message "Using system eslint: $JS_LINTER"
      fi
      ;;
    python)
      PY_LINTER=$(find_linter flake8)
      PY_SECURITY=$(find_linter bandit)
      if [ -z "$PY_LINTER" ]; then
        log_message "Installing flake8..."
        pip install flake8
      else
        log_message "Using system flake8: $PY_LINTER"
      fi
      if [ -z "$PY_SECURITY" ]; then
        log_message "Installing bandit..."
        pip install bandit
      else
        log_message "Using system bandit: $PY_SECURITY"
      fi
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

log_message "Code analysis completed"