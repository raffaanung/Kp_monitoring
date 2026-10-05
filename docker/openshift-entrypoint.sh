#!/bin/sh
# OpenShift restricted SCC menjalankan container sebagai UID acak (grup 0).
# Apache Debian menolak start jika tidak bisa setuid ke www-data.
set -eu

uid="$(id -u)"
gid="$(id -g)"

mkdir -p /var/run/apache2 /var/lock/apache2 /var/log/apache2

if [ -w /etc/apache2/envvars ]; then
    sed -i "s/^export APACHE_RUN_USER=.*/export APACHE_RUN_USER='#${uid}'/" /etc/apache2/envvars
    sed -i "s/^export APACHE_RUN_GROUP=.*/export APACHE_RUN_GROUP='#${gid}'/" /etc/apache2/envvars
fi

exec apache2-foreground
