# Guide Deploy Life OS ke VPS Ubuntu/Debian

Dokumen ini berisi panduan lengkap langkah-demi-langkah untuk melakukan deploy aplikasi **Life OS** ke VPS.

---

## 📌 Informasi Server & Domain

- **Domain:** `lifeos.nurikhsan.web.id`
- **IP VPS:** `195.88.211.147`
- **Backend API Port (Express/Node.js):** `3010`
- **Frontend Port (Next.js):** `3011`

---

## 🌐 Langkah 1: Pengaturan DNS Domain

Pastikan DNS Management domain `nurikhsan.web.id` sudah dikonfigurasi dengan tipe **A Record**:

| Type | Name / Host | Value / Target | TTL |
|------|-------------|----------------|-----|
| A | `lifeos` | `195.88.211.147` | Auto / 3600 |

*(Tunggu beberapa menit hingga DNS terpropagasi ke IP VPS)*

---

## 💻 Langkah 2: Persiapan Server VPS (SSH)

Masuk ke VPS via SSH:
```bash
ssh root@195.88.211.147
```

### 2.1 Update System & Install Tool Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw build-essential
```

### 2.2 Install Node.js (v20 LTS) & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2.3 Install Nginx & Certbot (SSL)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2.4 Install PostgreSQL Database
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## 🗄️ Langkah 3: Setup Database PostgreSQL

Masuk ke user `postgres`:
```bash
sudo -u postgres psql
```

Jalankan perintah SQL berikut di dalam prompt `psql`:
```sql
CREATE DATABASE lifeos_db;
CREATE USER lifeos_user WITH PASSWORD 'BuatPasswordKuatDiSini';
GRANT ALL PRIVILEGES ON DATABASE lifeos_db TO lifeos_user;
ALTER DATABASE lifeos_db OWNER TO lifeos_user;
\q
```

---

## 📂 Langkah 4: Clone & Setup Projek Life OS

### 4.1 Clone Repository
```bash
mkdir -p /var/www
cd /var/www
git clone <URL_REPOSITORY_GIT_KAMU> lifeos
cd lifeos
```

### 4.2 Setup Environment File (`.env`)
Salin file template `.env.production.example` menjadi `.env`:
```bash
cp .env.production.example .env
nano .env
```

Isi variabel `.env` dengan kredensial produksi (Backend Port 3010):
```env
NODE_ENV=production
PORT=3010

DATABASE_URL="postgresql://lifeos_user:BuatPasswordKuatDiSini@localhost:5432/lifeos_db?schema=public"
TELEGRAM_BOT_TOKEN="123456789:Token_Bot_Dari_BotFather"
JWT_SECRET="rahasia_jwt_session_key_acak_dan_panjang"
NEXT_PUBLIC_API_URL="https://lifeos.nurikhsan.web.id"
```

### 4.3 Install Package & Build Project
```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

---

## ⚙️ Langkah 5: Konfigurasi Nginx Reverse Proxy

### 5.1 Salin Konfigurasi Nginx
```bash
sudo cp nginx/lifeos.nurikhsan.web.id.conf /etc/nginx/sites-available/lifeos.nurikhsan.web.id
sudo ln -s /etc/nginx/sites-available/lifeos.nurikhsan.web.id /etc/nginx/sites-enabled/
```

### 5.2 Test & Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Langkah 6: Pass SSL Certificate (HTTPS) via Certbot

Jalankan Certbot untuk mengaktifkan HTTPS otomatis pada domain:
```bash
sudo certbot --nginx -d lifeos.nurikhsan.web.id
```
Pilih opsi **Redirect HTTP to HTTPS** saat diminta.

---

## 🚀 Langkah 7: Jalankan Aplikasi via PM2

Jalankan backend API (Port 3010) dan frontend web (Port 3011) sekaligus menggunakan file `ecosystem.config.js`:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

*(Jalankan perintah baris yang dihasilkan oleh `pm2 startup` jika diminta agar layanan otomatis start saat server restart)*

### Cek Status PM2
```bash
pm2 status
pm2 logs
```

---

## 🛡️ Langkah 8: Konfigurasi Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## ⚡ Langkah 9: Setup Auto Deploy (GitHub Actions CI/CD)

Aplikasi LifeOS kini dilengkapi dengan otomatisasi deploy setiap kali ada `push` ke branch `main`.

1. Buka repo GitHub: `https://github.com/ikhsanhikari/lifeos`
2. Masuk ke **Settings** → **Secrets and variables** → **Actions**.
3. Klik **New repository secret**:
   - Jika menggunakan SSH Key: Name = `VPS_SSH_KEY`, Value = isi private key SSH root VPS kamu (`cat ~/.ssh/id_rsa`).
   - Jika menggunakan Password VPS: Name = `VPS_PASSWORD`, Value = password user root VPS kamu.
4. Lakukan `git push origin main`. GitHub Actions akan otomatis SSH ke VPS dan mengeksekusi `./deploy.sh`.

---

## 🎉 Selesai!

Aplikasi Life OS sekarang dapat diakses secara resmi di:
- **Web Dashboard:** [https://lifeos.nurikhsan.web.id](https://lifeos.nurikhsan.web.id)
- **API Health Check:** [https://lifeos.nurikhsan.web.id/health](https://lifeos.nurikhsan.web.id/health)
