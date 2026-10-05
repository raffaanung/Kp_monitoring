# EDM Task Monitoring
# Svelte di-build jadi file statis, lalu dilayani CodeIgniter 4 + Apache.
# OpenShift: port 8080, user non-root, OpenSSL 4.0.0.
#
# node:22-alpine hanya stage build. Vite 8 butuh Node 22.
# Image ini tidak ikut ke container yang jalan; yang jalan tetap PHP + Apache.

FROM node:22-alpine AS frontend

WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Satu thread + tanpa minify: pod build OpenShift mematikan proses (SIGKILL) saat render bundle.
ENV VITE_BASE=/spa/ \
    VITE_DEPLOY=openshift \
    RAYON_NUM_THREADS=1 \
    NODE_OPTIONS=--max-old-space-size=768
RUN npm run build

FROM php:8.4-apache-trixie

ARG OPENSSL_VERSION=4.0.0
ARG OPENSSL_SHA256=c32cf49a959c4f345f9606982dd36e7d28f7c58b19c2e25d75624d2b3d2f79ac
ARG OPENSSL_PREFIX=/usr/local/openssl
ARG OPENSSL_BUILD_JOBS=2
# auto = prebuilt jika ada, kalau tidak download source lalu compile
ARG OPENSSL_MODE=auto

COPY docker/ /tmp/docker-install/

RUN set -eux; \
    apt-get update; \
    NEED_COMPILE=0; \
    if [ "${OPENSSL_MODE}" = "compile" ]; then NEED_COMPILE=1; \
    elif [ "${OPENSSL_MODE}" = "auto" ] && [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}-prebuilt-linux-amd64.tar.gz" ]; then \
        NEED_COMPILE=1; \
    fi; \
    if [ "${NEED_COMPILE}" = "1" ]; then \
        apt-get install -y --no-install-recommends ca-certificates build-essential perl zlib1g-dev; \
    else \
        apt-get install -y --no-install-recommends ca-certificates; \
    fi; \
    apt-get install -y --no-install-recommends libpq-dev libicu-dev libzip-dev unzip; \
    if [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}-prebuilt-linux-amd64.tar.gz" ] \
        && [ ! -f "/tmp/docker-install/openssl-${OPENSSL_VERSION}.tar.gz" ]; then \
        curl -fsSL -o "/tmp/docker-install/openssl-${OPENSSL_VERSION}.tar.gz" \
            "https://github.com/openssl/openssl/releases/download/openssl-${OPENSSL_VERSION}/openssl-${OPENSSL_VERSION}.tar.gz"; \
    fi; \
    chmod +x /tmp/docker-install/install-openssl-4.sh /tmp/docker-install/apply-openssl-hardening.sh; \
    DOCKER_DIR=/tmp/docker-install \
    OPENSSL_VERSION="${OPENSSL_VERSION}" \
    OPENSSL_PREFIX="${OPENSSL_PREFIX}" \
    OPENSSL_MODE="${OPENSSL_MODE}" \
    OPENSSL_BUILD_JOBS="${OPENSSL_BUILD_JOBS}" \
    OPENSSL_SHA256="${OPENSSL_SHA256}" \
    bash /tmp/docker-install/install-openssl-4.sh; \
    bash /tmp/docker-install/apply-openssl-hardening.sh /tmp/docker-install/openssl-gbo.cnf; \
    rm -rf /tmp/docker-install; \
    if [ "${NEED_COMPILE}" = "1" ]; then \
        apt-get purge -y --auto-remove build-essential perl; \
    fi; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

ENV PATH="${OPENSSL_PREFIX}/bin:/usr/local/bin:${PATH}" \
    LD_LIBRARY_PATH="${OPENSSL_PREFIX}/lib64:${OPENSSL_PREFIX}/lib" \
    OPENSSL_CONF="${OPENSSL_PREFIX}/gbo-openssl.cnf" \
    PKG_CONFIG_PATH="${OPENSSL_PREFIX}/lib64/pkgconfig:${OPENSSL_PREFIX}/lib/pkgconfig"

RUN docker-php-ext-install -j1 pgsql pdo_pgsql intl zip \
    && a2enmod rewrite headers \
    && sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
    && sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:8080/g' /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' 'ServerName localhost' > /etc/apache2/conf-available/servername.conf \
    && a2enconf servername \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY docker/openshift-entrypoint.sh /usr/local/bin/openshift-entrypoint
RUN chmod +x /usr/local/bin/openshift-entrypoint \
    && mkdir -p /var/run/apache2 /var/lock/apache2 /var/log/apache2 \
    && chown -R 1001:0 /var/run/apache2 /var/lock/apache2 /var/log/apache2 /etc/apache2/envvars \
    && chmod -R g+rwX /var/run/apache2 /var/lock/apache2 /var/log/apache2 \
    && chmod g+rw /etc/apache2/envvars

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY --chown=1001:0 backend/ /var/www/html/
COPY --from=frontend --chown=1001:0 /src/backend/spa/ /var/www/html/spa/

RUN sed -i 's|RewriteBase /edm-task-monitoring/backend/|RewriteBase /|' /var/www/html/.htaccess \
    && sed -i -E 's#https://api\.github\.com/repos/([^/]+)/([^/]+)/zipball/#https://codeload.github.com/\1/\2/legacy.zip/#g' /var/www/html/composer.lock \
    && composer install --no-dev --optimize-autoloader --no-interaction --working-dir=/var/www/html \
    && chown -R 1001:0 /var/www/html \
    && chmod -R g+rwX /var/www/html

ENV CI_ENVIRONMENT=production \
    CI_PUBLIC_ROOT=1

EXPOSE 8080

USER 1001

CMD ["openshift-entrypoint"]
