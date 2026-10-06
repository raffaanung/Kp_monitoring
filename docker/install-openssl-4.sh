#!/bin/bash
# Install OpenSSL 4.0.0 ke OPENSSL_PREFIX
# Mode:
#   OPENSSL_MODE=prebuilt  → extract docker/openssl-*-prebuilt-*.tar.gz (cepat, ~1 menit)
#   OPENSSL_MODE=compile   → build dari source tarball (lambat, ~15–30 menit)
set -e
set -u

OPENSSL_VERSION="${OPENSSL_VERSION:-4.0.0}"
OPENSSL_PREFIX="${OPENSSL_PREFIX:-/usr/local/openssl}"
OPENSSL_MODE="${OPENSSL_MODE:-auto}"
OPENSSL_BUILD_JOBS="${OPENSSL_BUILD_JOBS:-2}"
OPENSSL_SHA256="${OPENSSL_SHA256:-c32cf49a959c4f345f9606982dd36e7d28f7c58b19c2e25d75624d2b3d2f79ac}"
DOCKER_DIR="${DOCKER_DIR:-/tmp/docker-install}"

SRC_TAR="${DOCKER_DIR}/openssl-${OPENSSL_VERSION}.tar.gz"
PREBUILT_TAR="${DOCKER_DIR}/openssl-${OPENSSL_VERSION}-prebuilt-linux-amd64.tar.gz"

# auto = pakai prebuilt jika ada, kalau tidak compile dari source
if [ "${OPENSSL_MODE}" = "auto" ]; then
    if [ -f "${PREBUILT_TAR}" ]; then
        OPENSSL_MODE=prebuilt
    elif [ -f "${SRC_TAR}" ]; then
        OPENSSL_MODE=compile
        echo "==> Prebuilt tidak ada, fallback ke COMPILE (lambat)"
    else
        echo "ERROR: Tidak ada ${PREBUILT_TAR} maupun ${SRC_TAR}"
        exit 1
    fi
fi

verify_binary_arch() {
    local bin="${OPENSSL_PREFIX}/bin/openssl"
    if [ ! -f "${bin}" ]; then
        echo "ERROR: ${bin} tidak ada setelah extract/install"
        return 1
    fi
    if command -v file >/dev/null 2>&1; then
        local info
        info=$(file -b "${bin}" 2>/dev/null || true)
        if echo "${info}" | grep -qiE 'aarch64|ARM'; then
            echo "ERROR: prebuilt OpenSSL adalah ARM (${info})"
            echo "       OpenShift butuh linux/amd64. Generate ulang:"
            echo "         bash docker/build-openssl-prebuilt.sh"
            echo "       Lalu commit+push ${PREBUILT_TAR##*/}"
            echo "       Atau build image: --build-arg OPENSSL_MODE=compile"
            return 1
        fi
    fi
    return 0
}

setup_links() {
    ln -sf "${OPENSSL_PREFIX}/bin/openssl" /usr/local/bin/openssl
    : > /etc/ld.so.conf.d/openssl4.conf
    for libdir in lib lib64; do
        if [ -d "${OPENSSL_PREFIX}/${libdir}" ]; then
            echo "${OPENSSL_PREFIX}/${libdir}" >> /etc/ld.so.conf.d/openssl4.conf
        fi
    done
    ldconfig
    export LD_LIBRARY_PATH="${OPENSSL_PREFIX}/lib:${OPENSSL_PREFIX}/lib64:${LD_LIBRARY_PATH:-}"
    "${OPENSSL_PREFIX}/bin/openssl" version | grep -q "OpenSSL ${OPENSSL_VERSION}" || {
        echo "ERROR: verifikasi OpenSSL gagal (ldconfig/PATH)"
        ls -la "${OPENSSL_PREFIX}/bin" "${OPENSSL_PREFIX}/lib" 2>/dev/null || true
        file "${OPENSSL_PREFIX}/bin/openssl" 2>/dev/null || true
        return 1
    }
}

install_prebuilt() {
    echo "==> OpenSSL: mode PREBUILT (extract only)"
    if [ ! -f "${PREBUILT_TAR}" ]; then
        echo "ERROR: ${PREBUILT_TAR} tidak ada. Jalankan docker/build-openssl-prebuilt.sh sekali di mesin dev."
        exit 1
    fi
    tar -xzf "${PREBUILT_TAR}" -C /usr/local
    verify_binary_arch || exit 1
    setup_links || exit 1
    echo "==> OpenSSL ${OPENSSL_VERSION} prebuilt OK"
}

install_compile() {
    echo "==> OpenSSL: mode COMPILE (jobs=${OPENSSL_BUILD_JOBS})"
    if [ ! -f "${SRC_TAR}" ]; then
        echo "ERROR: ${SRC_TAR} tidak ada."
        exit 1
    fi
    echo "${OPENSSL_SHA256}  ${SRC_TAR}" | sha256sum -c -
    tar -xzf "${SRC_TAR}" -C /tmp
    cd "/tmp/openssl-${OPENSSL_VERSION}"
    ./config \
        --prefix="${OPENSSL_PREFIX}" \
        --openssldir="${OPENSSL_PREFIX}" \
        shared \
        zlib-dynamic
    make -j"${OPENSSL_BUILD_JOBS}"
    make install_sw
    cd /
    rm -rf "/tmp/openssl-${OPENSSL_VERSION}" "${SRC_TAR}"
    # ldconfig wajib sebelum openssl version (libssl.so.4)
    setup_links
    echo "==> OpenSSL ${OPENSSL_VERSION} compile OK"
}

case "${OPENSSL_MODE}" in
    prebuilt|fast) install_prebuilt ;;
    compile|source|slow) install_compile ;;
    *)
        echo "ERROR: OPENSSL_MODE=${OPENSSL_MODE} tidak valid (prebuilt|compile)"
        exit 1
        ;;
esac
