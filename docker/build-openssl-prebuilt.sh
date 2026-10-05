#!/bin/bash
# =============================================================================
# Generate openssl-4.0.0-prebuilt-linux-amd64.tar.gz (sekali saja)
#
# TIDAK pakai docker run -v (Mac /Applications/XAMPP sering tidak di File Sharing).
# Pakai docker buildx --output → file langsung ke folder docker/
#
# Prasyarat:
#   - docker/openssl-4.0.0.tar.gz sudah ada
#   - Docker Desktop jalan
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=4.0.0
SRC="docker/openssl-${VERSION}.tar.gz"
OUT="docker/openssl-${VERSION}-prebuilt-linux-amd64.tar.gz"
JOBS="${OPENSSL_BUILD_JOBS:-4}"

if [ ! -f "${SRC}" ]; then
  echo "ERROR: ${SRC} tidak ada."
  exit 1
fi

echo "==> Build prebuilt OpenSSL ${VERSION} (jobs=${JOBS}, platform=linux/amd64)..."
echo "    Output: ${OUT}"
echo "    WAJIB linux/amd64 — OpenShift cluster pakai amd64, bukan ARM Mac."

# buildx biasanya sudah ada di Docker Desktop; fallback ke docker build
if docker buildx version >/dev/null 2>&1; then
  docker buildx build \
    --platform linux/amd64 \
    --progress=plain \
    -f docker/Dockerfile.prebuilt-generator \
    --build-arg "OPENSSL_VERSION=${VERSION}" \
    --build-arg "OPENSSL_BUILD_JOBS=${JOBS}" \
    --output "type=local,dest=docker" \
    docker/
else
  echo "WARN: buildx tidak ada, pakai docker build + container cp..."
  TAG="gbo-openssl-prebuilt-builder:tmp"
  docker build \
    --platform linux/amd64 \
    -f docker/Dockerfile.prebuilt-generator \
    --build-arg "OPENSSL_VERSION=${VERSION}" \
    --build-arg "OPENSSL_BUILD_JOBS=${JOBS}" \
    --target builder \
    -t "${TAG}" \
    docker/
  CID=$(docker create "${TAG}")
  docker cp "${CID}:/export/openssl-${VERSION}-prebuilt-linux-amd64.tar.gz" "${OUT}"
  docker rm -f "${CID}" >/dev/null
fi

if [ ! -f "${OUT}" ]; then
  echo "ERROR: ${OUT} tidak terbentuk."
  exit 1
fi

# Verifikasi arsitektur (hindari push ARM ke OpenShift)
VERIFY_DIR=$(mktemp -d)
tar -xzf "${OUT}" -C "${VERIFY_DIR}"
OPENSSL_BIN="${VERIFY_DIR}/openssl/bin/openssl"
if [ ! -f "${OPENSSL_BIN}" ]; then
  echo "ERROR: tarball tidak berisi openssl/bin/openssl"
  rm -rf "${VERIFY_DIR}"
  exit 1
fi
ARCH_INFO=$(file -b "${OPENSSL_BIN}")
echo "==> Arsitektur binary: ${ARCH_INFO}"
if echo "${ARCH_INFO}" | grep -qiE 'aarch64|ARM'; then
  echo "ERROR: prebuilt masih ARM — build ulang dengan buildx dan --platform linux/amd64"
  rm -rf "${VERIFY_DIR}"
  exit 1
fi
if ! echo "${ARCH_INFO}" | grep -qiE 'x86-64|Intel 80386|AMD64'; then
  echo "ERROR: prebuilt bukan x86-64/amd64: ${ARCH_INFO}"
  rm -rf "${VERIFY_DIR}"
  exit 1
fi
rm -rf "${VERIFY_DIR}"

ls -lh "${OUT}"
echo ""
echo "SHA256 (untuk cek):"
shasum -a 256 "${OUT}" 2>/dev/null || sha256sum "${OUT}"
echo ""
echo "Langkah berikutnya:"
echo "  git add ${OUT}"
echo "  git commit -m 'Add OpenSSL 4.0.0 prebuilt for fast Docker build'"
echo "  git push"
