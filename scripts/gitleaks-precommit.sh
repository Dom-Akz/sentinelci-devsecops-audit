#!/bin/sh
docker run --rm -v "$(pwd):/repo" -w /repo zricethezav/gitleaks:latest git --pre-commit --redact --staged --verbose
