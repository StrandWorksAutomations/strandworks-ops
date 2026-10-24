#!/usr/bin/env bash
set -euo pipefail
install -m 755 "$(dirname "$0")/swd" "$HOME/.local/bin/swd"
for f in owner-loop.token owner-loop.apikey; do [ -s "$HOME/.config/strandworks/$f" ] || echo "missing ~/.config/strandworks/$f" >&2; done
echo "installed $HOME/.local/bin/swd"
