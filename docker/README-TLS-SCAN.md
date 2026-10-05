# Verifikasi TLS / Weak Cipher (SOP VAPT)

Dokumen ini melengkapi `SOP PENYESUAIN ALGORITMA SSH DI SISI APLIKASI.pptx`  
(judul SOP menyebut "SSH", isinya sebenarnya **TLS/HTTPS + OpenSSL di image aplikasi**).

## Yang sudah di image GBO

| Item | Implementasi |
|------|----------------|
| OpenSSL versi didukung | OpenSSL **4.0.0** (`docker/install-openssl-4.sh`) |
| Konfigurasi cipher kuat | `docker/openssl-gbo.cnf` → `OPENSSL_CONF` |
| Min TLS | **TLS 1.2** (TLS 1.0/1.1 & SSLv2/v3 disabled) |
| Cipher | ECDHE + AES-GCM / CHACHA20-POLY1305 only |
| Build verify | `docker/verify-security.sh` |

## Penting: di mana TLS terminate?

```
Browser ──HTTPS──► OpenShift Route / Ingress ──HTTP──► Container :8080 (Apache)
```

- **Scan `sslscan` ke URL publik** → menguji TLS di **Route OKD**, bukan di container.
- **OpenSSL di image** → dipakai PHP/outbound HTTPS dari aplikasi.
- Jika scan masih gagal setelah deploy image baru → koordinasi **tim Platform** untuk hardening Route TLS.

Temuan VAPT **port 22 SSH** tetap scope **infra/node OKD**, bukan image aplikasi.

---

## Langkah 1 — Scan endpoint (sesuai SOP)

Download [sslscan 2.2.2](https://github.com/rbsec/sslscan/releases/download/2.2.2/sslscan-2.2.2.zip), lalu:

```bash
sslscan --no-failed https://gct-gbo-dev-ent-dash-mgmt.apps.kpaasjt21.telkom.co.id
```

**Harus terpenuhi:**
- TLS 1.2 dan/atau TLS 1.3 aktif
- SSLv2, SSLv3, TLS 1.0, TLS 1.1 **disabled**
- Cipher modern: AES-GCM, CHACHA20-POLY1305, ECDHE
- Tidak ada weak / deprecated cipher

---

## Langkah 2 — Verifikasi di container (setelah deploy)

```bash
# Masuk pod OKD
oc rsh <pod-name>

openssl version -a
# OpenSSL 4.0.0 ...

echo "$OPENSSL_CONF"
# /usr/local/openssl/gbo-openssl.cnf

grep MinProtocol "$OPENSSL_CONF"
# MinProtocol = TLSv1.2

php -r "echo OPENSSL_VERSION_TEXT, PHP_EOL;"

# Cipher yang diizinkan (harus ECDHE + GCM/CHACHA20)
openssl ciphers -v 'ECDHE+AESGCM:ECDHE+CHACHA20'
```

Atau saat **docker build** lokal:

```bash
docker build -t gbo-test .
docker run --rm gbo-test verify-security
```

---

## Langkah 3 — Jika scan masih menemukan weak cipher

1. Pastikan image terbaru sudah deploy (`OpenSSL 4.0.0` + `gbo-openssl.cnf`).
2. Jalankan ulang `sslscan` ke URL yang sama.
3. Jika masih gagal → eskalasi ke **Tim Platform/Infra OKD** untuk hardening **Route TLS** (bukan rebuild app saja).
4. Jika temuan **SSH port 22** → eskalasi infra (sshd di node/bastion).

---

## Langkah 4 — Rebuild & deploy image

```bash
# Build lokal
docker build -t gbo-php:openssl-hardened .

# Atau push via pipeline GitLab / OpenShift BuildConfig seperti biasa
```

Setelah deploy, ulangi **Langkah 1** sampai weak cipher tidak muncul (atau dikonfirmasi sumbernya di Route OKD).

---

## File terkait

| File | Fungsi |
|------|--------|
| `docker/openssl-gbo.cnf` | Konfigurasi TLS hardening |
| `docker/apply-openssl-hardening.sh` | Pasang config saat build |
| `docker/verify-security.sh` | Cek otomatis saat build |
| `Dockerfile` | OpenSSL 4.0.0 + `OPENSSL_CONF` |
| `docker/README-OPENSSL.md` | Build OpenSSL prebuilt/compile |
