#!/bin/sh
# Dipakai di CI / security audit — cetak versi komponen utama
set -e
echo "=== Component versions ==="
php -v | head -1
apache2 -v | head -1
openssl version
echo "OpenSSL binary: $(command -v openssl)"
if command -v dpkg >/dev/null 2>&1; then
  echo "Debian: $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"
  dpkg -l libssl3t64 openssl 2>/dev/null | awk '/^ii/ {print $2, $3}' || true
fi
php -m | grep -E '^(pdo_pgsql|pgsql|ldap)$' || true
