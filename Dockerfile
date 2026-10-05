# =============================================================================
# EDM Task Monitoring — Svelte SPA + CodeIgniter 4, PHP 8.4 + Apache
#
# OpenShift: listen 8080, UID acak grup 0, document root = isi folder backend.
# Asset UI di /spa/, API di /api/*.
#
# OpenSSL 4.0.0:
#   Cepat, jika ada docker/openssl-4.0.0-prebuilt-linux-amd64.tar.gz
#   Jika tidak ada, source di-download lalu di-compile.
# =============================================================================

FROM node:22-alpine AS frontend

WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Asset di /spa/, API di /api/... pada root route OpenShift.
ENV VITE_BASE=/spa/ \
    VITE_DEPLOY=openshift
RUN npm run build

FROM php:8.4-apache-trixie

ARG OPENSSL_VERSION=4.0.0
ARG OPENSSL_SHA256=c32cf49a959c4f345f9606982dd36e7d28f7c58b19c2e25d75624d2b3d2f79ac
ARG OPENSSL_PREFIX=/usr/local/openssl
ARG OPENSSL_BUILD_JOBS=2
# auto = prebuilt jika ada (cepat), else compile | prebuilt | compile
ARG OPENSSL_MODE=auto

COPY docker/ /tmp/docker-install/

# -----------------------------------------------------------------------------
# 1) OpenSSL 4.0.0 — prebuilt (cepat) atau compile (lambat)
# -----------------------------------------------------------------------------
RUN set -eux; \
    apt-get update; \
    apt-get -y full-upgrade; \
    NEED_COMPILE=0; \
    if [ "${OPENSSL_MODE}" = "compile" ]; then NEED_COMPILE=1; \
    elif [ "${OPENSSL_MODE}" = "auto" ] && [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}-prebuilt-linux-amd64.tar.gz" ]; then \
        NEED_COMPILE=1; \
    fi; \
    if [ "${NEED_COMPILE}" = "1" ]; then \
        apt-get install -y --no-install-recommends \
            ca-certificates build-essential perl zlib1g-dev; \
    else \
        apt-get install -y --no-install-recommends ca-certificates; \
    fi; \
    apt-get install -y --no-install-recommends libpq-dev libldap2-dev libicu-dev unzip; \
    if [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}-prebuilt-linux-amd64.tar.gz" ] \
        && [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}.tar.gz" ]; then \
        echo "==> Tarball OpenSSL tidak ada di repo, download source ${OPENSSL_VERSION}"; \
        curl -fsSL -o "/tmp/docker-install/openssl-${OPENSSL_VERSION}.tar.gz" \
            "https://github.com/openssl/openssl/releases/download/openssl-${OPENSSL_VERSION}/openssl-${OPENSSL_VERSION}.tar.gz"; \
    fi; \
    chmod +x /tmp/docker-install/install-openssl-4.sh; \
    DOCKER_DIR=/tmp/docker-install \
    OPENSSL_VERSION="${OPENSSL_VERSION}" \
    OPENSSL_PREFIX="${OPENSSL_PREFIX}" \
    OPENSSL_MODE="${OPENSSL_MODE}" \
    OPENSSL_BUILD_JOBS="${OPENSSL_BUILD_JOBS}" \
    OPENSSL_SHA256="${OPENSSL_SHA256}" \
    bash /tmp/docker-install/install-openssl-4.sh; \
    chmod +x /tmp/docker-install/apply-openssl-hardening.sh; \
    bash /tmp/docker-install/apply-openssl-hardening.sh /tmp/docker-install/openssl-gbo.cnf; \
    rm -rf /tmp/docker-install; \
    if [ "${NEED_COMPILE}" = "1" ]; then \
        apt-get purge -y --auto-remove build-essential perl; \
    fi; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

ENV PATH="${OPENSSL_PREFIX}/bin:/usr/local/bin:${PATH}" \
    LD_LIBRARY_PATH="${OPENSSL_PREFIX}/lib64:${OPENSSL_PREFIX}/lib:${LD_LIBRARY_PATH}" \
    OPENSSL_CONF="${OPENSSL_PREFIX}/gbo-openssl.cnf" \
    PKG_CONFIG_PATH="${OPENSSL_PREFIX}/lib64/pkgconfig:${OPENSSL_PREFIX}/lib/pkgconfig"

# -----------------------------------------------------------------------------
# 2) PHP extensions
# Retry + install satu-satu: di OpenShift sering gagal "tar: Unexpected EOF"
# saat extract source PHP (download/layer putus), bukan karena kode app.
# -----------------------------------------------------------------------------
RUN set -eux; \
    install_one() { \
      ext="$1"; shift || true; \
      n=0; \
      until [ "$n" -ge 3 ]; do \
        if [ "$#" -gt 0 ]; then \
          docker-php-ext-configure "$ext" "$@" || true; \
        fi; \
        if docker-php-ext-install -j1 "$ext"; then \
          return 0; \
        fi; \
        n=$((n + 1)); \
        echo "WARN: install ${ext} gagal (percobaan ${n}/3); bersihkan source lalu retry..."; \
        docker-php-source delete || true; \
        rm -rf /usr/src/php /tmp/pear /tmp/pear-* || true; \
        sleep $((n * 3)); \
      done; \
      echo "ERROR: gagal install ${ext} setelah 3 percobaan"; \
      return 1; \
    }; \
    install_one pgsql; \
    install_one pdo_pgsql; \
    install_one intl; \
    ARCH="$(dpkg-architecture -qDEB_HOST_MULTIARCH 2>/dev/null || echo x86_64-linux-gnu)"; \
    install_one ldap --with-libdir="lib/${ARCH}"

# -----------------------------------------------------------------------------
# 3) PHP + Apache hardening
# -----------------------------------------------------------------------------
COPY docker/php-security.ini /usr/local/etc/php/conf.d/99-security.ini
COPY docker/apache-hardening.conf /etc/apache2/conf-available/gbo-hardening.conf

RUN set -eux; \
    a2enmod rewrite headers \
    && a2dismod -f autoindex status info userdir 2>/dev/null || true \
    && sed -i 's/^ServerTokens OS/ServerTokens Prod/' /etc/apache2/conf-available/security.conf \
    && sed -i 's/^ServerSignature On/ServerSignature Off/' /etc/apache2/conf-available/security.conf \
    && sed -i 's/^#*TraceEnable.*/TraceEnable Off/' /etc/apache2/conf-available/security.conf \
    && grep -q '^TraceEnable Off' /etc/apache2/conf-available/security.conf \
    || echo 'TraceEnable Off' >> /etc/apache2/conf-available/security.conf \
    && printf '%s\n' 'TraceEnable Off' > /etc/apache2/conf-available/disabletrace.conf \
    && a2enconf disabletrace \
    && a2enconf gbo-hardening \
    && sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
    && printf '%s\n' \
        '<Directory /var/www/html>' \
        '    Options -Indexes +FollowSymLinks' \
        '    AllowOverride All' \
        '    Require all granted' \
        '</Directory>' \
        > /etc/apache2/conf-available/ci3.conf \
    && a2enconf ci3 \
    && sed -i '/DocumentRoot \/var\/www\/html/a <Directory \/var\/www\/html>\n\tOptions -Indexes +FollowSymLinks\n\tAllowOverride All\n\tRequire all granted\n<\/Directory>' \
        /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername \
    && sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:8080/g' /etc/apache2/sites-available/000-default.conf

EXPOSE 8080

# -----------------------------------------------------------------------------
# 4) OpenShift + S2I
# -----------------------------------------------------------------------------
RUN mkdir -p /var/uploads /usr/libexec/s2i \
    && chown -R 1001:0 /var/run/apache2 /var/log/apache2 /var/lock/apache2 /var/uploads /usr/libexec/s2i \
    && chmod -R g+rwX /var/run/apache2 /var/log/apache2 /var/lock/apache2 /var/uploads

COPY contrib/s2i/bin/ /usr/libexec/s2i/
RUN chmod +x /usr/libexec/s2i/* 2>/dev/null || true

COPY docker/verify-versions.sh /usr/local/bin/verify-versions
COPY docker/verify-security.sh /usr/local/bin/verify-security
COPY docker/openshift-entrypoint.sh /usr/local/bin/openshift-entrypoint
RUN chmod +x /usr/local/bin/verify-versions /usr/local/bin/verify-security /usr/local/bin/openshift-entrypoint \
    && chown 1001:0 /etc/apache2/envvars \
    && chmod g+rw /etc/apache2/envvars

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Document root = aplikasi CodeIgniter, bukan root repo.
COPY --chown=1001:0 backend/ /var/www/html/
COPY --from=frontend --chown=1001:0 /src/backend/spa/ /var/www/html/spa/

RUN sed -i 's|RewriteBase /edm-task-monitoring/backend/|RewriteBase /|' /var/www/html/.htaccess \
    && composer install --no-dev --optimize-autoloader --no-interaction --working-dir=/var/www/html \
    && chown -R 1001:0 /var/www/html \
    && chmod -R g+rwX /var/www/html \
    && rm -rf /var/www/html/.DS_Store

RUN verify-versions && verify-security

LABEL io.openshift.s2i.scripts-url="image:///usr/libexec/s2i" \
      io.k8s.description="EDM Task Monitoring, PHP 8.4 + OpenSSL 4.0.0" \
      io.k8s.display-name="EDM Task Monitoring (OpenShift)" \
      org.opencontainers.image.openssl.version="4.0.0"

# CI_PUBLIC_ROOT=1: baseURL mengikuti Host request (route OpenShift).
# Override dengan app_baseURL jika route punya path khusus.
ENV APACHE_RUN_USER=www-data \
    APACHE_RUN_GROUP=www-data \
    APACHE_LOG_DIR=/var/log/apache2 \
    APACHE_PID_FILE=/var/run/apache2/apache2.pid \
    APACHE_LOCK_DIR=/var/lock/apache2 \
    CI_ENVIRONMENT=production \
    CI_PUBLIC_ROOT=1 \
    SESS_MATCH_IP=false \
    COOKIE_SAMESITE=None

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD php -r "exit(@file_get_contents('http://127.0.0.1:8080/')===false?1:0);"

USER 1001

CMD ["openshift-entrypoint"]
