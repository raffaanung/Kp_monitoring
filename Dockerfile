# Image OpenShift untuk EDM Task Monitoring.
# BuildConfig: strategi Docker, dockerfilePath Dockerfile.
#
# Composer dijalankan di mesin dev, bukan di image:
#   cd backend && composer install --no-dev --optimize-autoloader
# Folder backend/vendor harus ikut ke Git. Hapus baris "vendor/" di
# backend/.gitignore, lalu commit folder itu. Build OpenShift meng-clone Git,
# jadi vendor yang hanya ada di laptop tidak akan terbawa.
#
# Hasilnya Apache + PHP 8.4 di port 8080 (user non-root).
# URL aplikasi sama seperti XAMPP: /edm-task-monitoring/backend/

FROM node:22 AS frontend

WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/svelte.config.js frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm ci \
    && sed -i \
        -e 's/::placeholder::placeholder/::placeholder/' \
        -e 's/:focus:focus/:focus/' \
        src/pages/RequirementList.svelte
ENV RAYON_NUM_THREADS=1 \
    NODE_OPTIONS=--max-old-space-size=768
RUN npm run build -- --minify false

FROM php:8.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libicu-dev \
    && docker-php-ext-install -j1 pgsql pdo_pgsql intl \
    && a2enmod rewrite \
    && sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
    && printf '%s\n' \
        '<VirtualHost *:8080>' \
        '    ServerName localhost' \
        '    DocumentRoot /var/www/html' \
        '    Alias /edm-task-monitoring/backend /var/www/html' \
        '    <Directory /var/www/html>' \
        '        Options -Indexes +FollowSymLinks' \
        '        AllowOverride All' \
        '        Require all granted' \
        '    </Directory>' \
        '    RedirectMatch 302 ^/$ /edm-task-monitoring/backend/' \
        '</VirtualHost>' \
        > /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' \
        '#!/bin/sh' \
        'set -eu' \
        'uid=$(id -u)' \
        'gid=$(id -g)' \
        'mkdir -p /var/run/apache2 /var/lock/apache2 /var/log/apache2' \
        'if [ -w /etc/apache2/envvars ]; then' \
        "  sed -i \"s/^export APACHE_RUN_USER=.*/export APACHE_RUN_USER='#\${uid}'/\" /etc/apache2/envvars" \
        "  sed -i \"s/^export APACHE_RUN_GROUP=.*/export APACHE_RUN_GROUP='#\${gid}'/\" /etc/apache2/envvars" \
        'fi' \
        'exec apache2-foreground' \
        > /usr/local/bin/openshift-entrypoint \
    && chmod +x /usr/local/bin/openshift-entrypoint \
    && mkdir -p /var/run/apache2 /var/lock/apache2 /var/log/apache2 \
    && chown -R 1001:0 /var/run/apache2 /var/lock/apache2 /var/log/apache2 /etc/apache2/envvars \
    && chmod -R g+rwX /var/run/apache2 /var/lock/apache2 /var/log/apache2 \
    && chmod g+rw /etc/apache2/envvars \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY backend/ /var/www/html/
COPY --from=frontend /src/backend/spa/ /var/www/html/spa/

# vendor datang dari mesin dev. baseURL mengikuti host route.
RUN test -f vendor/autoload.php \
    || { echo 'backend/vendor belum ada. Jalankan: cd backend && composer install --no-dev --optimize-autoloader'; exit 1; } \
    && echo 'PD9waHAKJHAgPSAnYXBwL0NvbmZpZy9BcHAucGhwJzsKJGMgPSBmaWxlX2dldF9jb250ZW50cygkcCk7CmlmIChzdHJwb3MoJGMsICdmdW5jdGlvbiBfX2NvbnN0cnVjdCcpICE9PSBmYWxzZSkgewogICAgZXhpdCgwKTsKfQokZm4gPSA8PDwnSU5KRUNUJwogICAgcHVibGljIGZ1bmN0aW9uIF9fY29uc3RydWN0KCkKICAgIHsKICAgICAgICBwYXJlbnQ6Ol9fY29uc3RydWN0KCk7CiAgICAgICAgaWYgKGdldGVudignYXBwLmJhc2VVUkwnKSB8fCBnZXRlbnYoJ2FwcF9iYXNlVVJMJykpIHsKICAgICAgICAgICAgcmV0dXJuOwogICAgICAgIH0KICAgICAgICAkaG9zdCA9IChzdHJpbmcpICgkX1NFUlZFUlsnSFRUUF9IT1NUJ10gPz8gJycpOwogICAgICAgIGlmICgkaG9zdCA9PT0gJycpIHsKICAgICAgICAgICAgcmV0dXJuOwogICAgICAgIH0KICAgICAgICAkaHR0cHMgPSAoISBlbXB0eSgkX1NFUlZFUlsnSFRUUFMnXSkgJiYgJF9TRVJWRVJbJ0hUVFBTJ10gIT09ICdvZmYnKQogICAgICAgICAgICB8fCAoc3RydG9sb3dlcigoc3RyaW5nKSAoJF9TRVJWRVJbJ0hUVFBfWF9GT1JXQVJERURfUFJPVE8nXSA/PyAnJykpID09PSAnaHR0cHMnKTsKICAgICAgICAkdGhpcy0+YmFzZVVSTCA9ICgkaHR0cHMgPyAnaHR0cHMnIDogJ2h0dHAnKSAuICc6Ly8nIC4gJGhvc3QgLiAnL2VkbS10YXNrLW1vbml0b3JpbmcvYmFja2VuZC8nOwogICAgfQoKSU5KRUNUOwokYyA9IHByZWdfcmVwbGFjZSgnL1x9XHMqJC8nLCAkZm4gLiAifVxuIiwgJGMsIDEpOwpmaWxlX3B1dF9jb250ZW50cygkcCwgJGMpOw==' | base64 -d > /tmp/patch-app.php \
    && php /tmp/patch-app.php \
    && rm /tmp/patch-app.php \
    && chown -R 1001:0 /var/www/html \
    && chmod -R g+rwX /var/www/html

ENV CI_ENVIRONMENT=production

EXPOSE 8080
USER 1001
CMD ["openshift-entrypoint"]
