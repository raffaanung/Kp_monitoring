#!/bin/sh
# Verifikasi hardening saat docker build — gagal build jika setting tidak aktif
set -e

echo "=== Security verification ==="

# OpenSSL 4.0.0
openssl version | grep -q 'OpenSSL 4.0.0' || {
  echo "FAIL: OpenSSL bukan 4.0.0"
  exit 1
}

# TraceEnable Off (wajib)
if grep -Riq 'TraceEnable[[:space:]]*On' /etc/apache2/ 2>/dev/null; then
  echo "FAIL: TraceEnable On ditemukan di konfigurasi Apache"
  grep -Ri 'TraceEnable' /etc/apache2/ || true
  exit 1
fi
grep -Riq 'TraceEnable[[:space:]]*Off' /etc/apache2/ || {
  echo "FAIL: TraceEnable Off tidak ditemukan"
  exit 1
}
echo "OK: TraceEnable Off"

# ServerTokens Prod
grep -q '^ServerTokens Prod' /etc/apache2/conf-available/security.conf || {
  echo "FAIL: ServerTokens bukan Prod"
  exit 1
}
echo "OK: ServerTokens Prod"

# ServerSignature Off
grep -q '^ServerSignature Off' /etc/apache2/conf-available/security.conf || {
  echo "FAIL: ServerSignature bukan Off"
  exit 1
}
echo "OK: ServerSignature Off"

# PHP expose_php Off
php -i 2>/dev/null | grep -q 'expose_php => Off' || {
  echo "FAIL: expose_php masih On"
  exit 1
}
echo "OK: expose_php Off"

# OpenSSL TLS hardening (SOP VAPT weak cipher)
if [ -z "${OPENSSL_CONF}" ] || [ ! -f "${OPENSSL_CONF}" ]; then
  echo "FAIL: OPENSSL_CONF tidak ada (${OPENSSL_CONF:-unset})"
  exit 1
fi
grep -q 'MinProtocol = TLSv1.2' "${OPENSSL_CONF}" || {
  echo "FAIL: MinProtocol TLSv1.2 tidak ditemukan di ${OPENSSL_CONF}"
  exit 1
}
grep -q 'ECDHE' "${OPENSSL_CONF}" || {
  echo "FAIL: CipherString ECDHE tidak ditemukan di ${OPENSSL_CONF}"
  exit 1
}
if ! openssl ciphers -v 'ECDHE+AESGCM:ECDHE+CHACHA20' 2>/dev/null | grep -q 'ECDHE'; then
  echo "FAIL: Tidak ada cipher ECDHE+GCM/CHACHA20 aktif"
  openssl ciphers -v 2>/dev/null | head -5 || true
  exit 1
fi
echo "OK: OpenSSL TLS hardening (MinProtocol TLSv1.2, ECDHE ciphers)"

# Modul berisiko dimatikan
for mod in autoindex status info; do
  if [ -f "/etc/apache2/mods-enabled/${mod}.load" ]; then
    echo "FAIL: mod_${mod} masih enabled"
    exit 1
  fi
done
echo "OK: mod_autoindex, mod_status, mod_info disabled"

# Config syntax
apache2ctl configtest
echo "=== All security checks passed ==="
