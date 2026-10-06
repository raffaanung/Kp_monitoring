#!/bin/sh
# Pasang openssl-gbo.cnf sebagai OPENSSL_CONF aktif di image.
set -e

OPENSSL_PREFIX="${OPENSSL_PREFIX:-/usr/local/openssl}"
SRC="${1:-/tmp/docker-install/openssl-gbo.cnf}"
DEST="${OPENSSL_PREFIX}/gbo-openssl.cnf"

if [ ! -f "${SRC}" ]; then
  echo "ERROR: ${SRC} tidak ditemukan"
  exit 1
fi

cp "${SRC}" "${DEST}"
chmod 644 "${DEST}"

# Verifikasi config bisa dibaca OpenSSL
OPENSSL_CONF="${DEST}" "${OPENSSL_PREFIX}/bin/openssl" version >/dev/null

# Pastikan TLS 1.0/1.1 tidak aktif
if OPENSSL_CONF="${DEST}" "${OPENSSL_PREFIX}/bin/openssl" ciphers -v 'TLSv1' 2>/dev/null | grep -q .; then
  echo "WARN: TLSv1 cipher masih terdaftar (cek provider)"
fi

echo "OK: OpenSSL hardening → ${DEST}"
