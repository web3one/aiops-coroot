#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export FAILURE_LOG="${SCRIPT_DIR}/test_failures.log"
rm -f "$FAILURE_LOG"

echo "Running all OSS UI tests..."

for script in "${SCRIPT_DIR}"/[0-9]*.sh; do
  echo "--------------------------------------------------"
  echo "Running ${script}..."
  bash "${script}"
  echo "--------------------------------------------------"
done

if [[ -f "$FAILURE_LOG" && -s "$FAILURE_LOG" ]]; then
  echo -e "\n\033[0;31mTest Failures:\033[0m"
  cat "$FAILURE_LOG"
  echo -e "\nSome tests failed."
  exit 1
else
  echo -e "\n\033[0;32mAll tests passed successfully.\033[0m"
fi