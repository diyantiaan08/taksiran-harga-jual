# Deployment (FE + BE) — Ringkas Step-by-Step

Gunakan panduan ini untuk tim network. Asumsi lokasi:
- FE: `/var/www/html`
- BE: `/home/nodeapp`

## 1) Ambil Kode dari Repo
Ganti nilai berikut sesuai repo/branch yang dipakai:
```
REPO_URL=<isi_url_repo>
BRANCH=<nama_branch>
```

```
git clone -b $BRANCH $REPO_URL
```

Struktur repo:
- FE: `taksiran-harga/`
- BE: `taksiran-be/`

## 2) Setup Backend (Node/Express)
```
cd /home/nodeapp
rm -rf /home/nodeapp/*
cp -r /path/to/repo/taksiran-be/* /home/nodeapp/
```

### Env BE
```
cat <<'EOF' > /home/nodeapp/.env
MONGODB_URI=mongodb://USER:PASS@HOST:PORT/DBNAME
PORT=3000
EOF
```

### Install & Run
```
cd /home/nodeapp
npm install
node index.js
```

Opsional (PM2):
```
npm install -g pm2
pm2 start index.js --name taksiran-be
pm2 save
pm2 startup
```

## 3) Setup Frontend (Vite React)
```
cd /path/to/repo/taksiran-harga
```

### Env FE
Jika tanpa proxy:
```
cat <<'EOF' > .env.production
VITE_API_URL=http://IP_OR_DOMAIN_BE:3000
EOF
```

Jika pakai Nginx proxy `/api`:
```
cat <<'EOF' > .env.production
VITE_API_URL=/api
EOF
```

### Build & Deploy FE
```
npm install
npm run build
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
```

## 4) Nginx (FE + Proxy BE)
```
server {
    listen 80;
    server_name domainanda.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5) Verifikasi
- FE: `http://domainanda.com`
- API: `http://domainanda.com/api/stores` (jika proxy)
- API langsung: `http://IP_OR_DOMAIN_BE:3000/stores`
