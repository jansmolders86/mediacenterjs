#!/bin/sh

if [ "$(basename "$0")" = "test-cov.sh" ]; then
	if ! command -v istanbul >/dev/null 2>&1; then
		echo "Error: Istanbul coverage tool not found."
		echo "Please install it with npm install -g istanbul"
		exit 1
	fi
	istanbul cover test/run.js -- $* && xdg-open coverage/lcov-report/index.html
else
	test/run.js $*
fi
