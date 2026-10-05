# OpenSSL 4.0.0 — build cepat vs lambat

## Kenapa lambat?

Compile OpenSSL dari **source** (~52 MB) butuh **15–30 menit** per build image.
Di OpenShift lebih parah jika `make -j96` → OOM.

## Solusi cepat (disarankan): **prebuilt binary**

| Mode | Waktu build OpenSSL | File yang dibutuhkan |
|------|---------------------|----------------------|
| **prebuilt** (default) | **~1 menit** (extract saja) | `openssl-4.0.0-prebuilt-linux-amd64.tar.gz` |
| compile (fallback) | 15–30 menit | `openssl-4.0.0.tar.gz` (source) |

### Langkah sekali di laptop (ada Docker + internet)

```bash
cd TELKOM/gbo
bash docker/build-openssl-prebuilt.sh
```

**Mac + XAMPP di `/Applications/...`:** Jangan pakai `docker run -v` (error *mounts denied*).
Script di atas sudah pakai **`docker buildx --output`** — tidak perlu Docker → File Sharing.

Alternatif manual (tanpa script):

```bash
cd TELKOM/gbo
docker buildx build -f docker/Dockerfile.prebuilt-generator \
  --build-arg OPENSSL_BUILD_JOBS=4 \
  --output type=local,dest=docker \
  docker/
```

Hasil: `docker/openssl-4.0.0-prebuilt-linux-amd64.tar.gz` (~25–35 MB)

### Push ke GitLab

```bash
git add docker/openssl-4.0.0-prebuilt-linux-amd64.tar.gz Dockerfile docker/install-openssl-4.sh
git commit -m "OpenSSL 4.0.0 prebuilt for fast image build"
git push
```

Build OpenShift otomatis pakai `OPENSSL_MODE=prebuilt` (default).

### Opsional: hapus source tarball dari repo

Setelah prebuilt ada, `openssl-4.0.0.tar.gz` (52 MB) tidak wajib di server build lagi.

---

## Solusi tim: image base di registry (build paling jarang compile)

```bash
# Sekali saja
podman build -f Dockerfile.openssl-base -t gbo-php-openssl:4.0.0 .
podman push .../gbo-php-openssl:4.0.0

# Dockerfile app cukup:
# FROM .../gbo-php-openssl:4.0.0
```

---

## Fallback compile di OpenShift

Hanya jika prebuilt belum ada:

```yaml
buildArgs:
  - name: OPENSSL_MODE
    value: compile
  - name: OPENSSL_BUILD_JOBS
    value: "2"
```

Memory limit BuildConfig: **>= 4Gi**.

---

## Verifikasi

```bash
openssl version
# OpenSSL 4.0.0 ...
grep MinProtocol "$OPENSSL_CONF"
# MinProtocol = TLSv1.2
```

Retest TLS / weak cipher: lihat **`docker/README-TLS-SCAN.md`**.
