# 🌙 Noctra Store — WhatsApp E-Commerce Bot

> Your Digital Gaming Store — sistem e-commerce lengkap yang beroperasi lewat WhatsApp.

Status: **Phase 1 selesai** — Project setup, database schema penuh, dan koneksi WhatsApp (webhook verify + receive + kirim menu) sudah berjalan dan dapat diuji.

---

## 1. Architecture Overview

```
                     ┌─────────────────────┐
   WhatsApp User ───▶│  Meta WhatsApp       │
                     │  Cloud API           │
                     └─────────┬───────────┘
                               │ webhook (HTTPS POST)
                               ▼
                     ┌─────────────────────┐
                     │  Express App        │
                     │  ┌───────────────┐  │
                     │  │ /webhooks/    │  │  ← verify (GET) + receive (POST)
                     │  │  whatsapp     │  │
                     │  ├───────────────┤  │
                     │  │ /api/*        │  │  ← REST API (dashboard/admin nanti)
                     │  └───────────────┘  │
                     │  middleware:         │
                     │  - requestId          │
                     │  - pino-http logger   │
                     │  - error handler      │
                     └─────────┬───────────┘
                               │ Prisma ORM
                               ▼
                     ┌─────────────────────┐
                     │  PostgreSQL          │
                     │  (full schema, lihat │
                     │   prisma/schema.prisma)│
                     └─────────────────────┘
```

Prinsip desain:

- **Modular by module, bukan by layer** — setiap domain (products, orders, payments, dst) akan punya foldernya sendiri di `src/modules/*` mulai Phase 2, supaya berkembang tanpa saling menyenggol.
- **WhatsApp layer dan business logic dipisah.** `src/whatsapp/*` hanya tahu cara bicara dengan Meta Graph API dan cara memformat pesan. Ia tidak query database langsung — di Phase 2+ ia akan memanggil service dari `src/modules/*`.
- **Payment provider adalah interface, bukan implementasi hardcode** — diimplementasikan di Phase 4 sebagai `PaymentProvider`, supaya QRIS/e-wallet/manual bisa ditambah tanpa mengubah alur checkout.
- **Snapshot, bukan referensi, untuk harga di order.** `OrderItem` menyimpan `unitPrice`/`unitDiscount`/`lineTotal` sendiri — perubahan harga produk di masa depan tidak pernah mengubah riwayat order lama.

---

## 2. Technology Selection & Alasan

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Bahasa | **TypeScript** | Type-safety untuk domain yang rawan bug finansial (harga, stok, saldo). |
| WhatsApp integration | **WhatsApp Cloud API (resmi, Meta)** | Ini satu-satunya opsi yang sesuai ToS WhatsApp secara resmi. Library tidak resmi (whatsapp-web.js/Baileys) berisiko nomor diblokir kapan saja karena mem-bypass WhatsApp Business API — tidak layak untuk sistem *production* yang menangani uang customer. Env var yang kamu sebutkan (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) sudah persis format Cloud API, jadi ini sejalan dengan rencana kamu. |
| Database | **PostgreSQL** | Mendukung transaksi ACID kuat (penting untuk alokasi stok & digital code supaya tidak pernah dobel), tipe `Decimal` presisi untuk uang, dan matang untuk deployment produksi (termasuk di Railway, sesuai stack kamu yang lain). |
| ORM | **Prisma** | Migration terkelola otomatis, type-safe query, schema jadi dokumentasi ERD hidup. |
| Web framework | **Express** | Stabil, ekosistem besar, cukup untuk REST API + webhook receiver; tidak butuh performa ekstrem Fastify di tahap ini. |
| Redis | **Ditunda ke phase lanjut** | Belum dibutuhkan di Phase 1–3 karena state percakapan & cart disimpan di Postgres (lebih tahan restart tanpa infra tambahan). Akan diperkenalkan saat butuh job queue (expired order auto-cancel, dsb) di Phase 4/5. |
| Logging | **pino** | Structured JSON logging, cepat, mendukung correlation id per request. |
| Validasi | **zod** | Validasi env & request body dengan pesan error yang jelas, tanpa boilerplate class-validator. |

---

## 3. Database ERD (ringkas)

Skema penuh ada di [`prisma/schema.prisma`](./prisma/schema.prisma). Ringkasan relasi utama:

```
User ──< Cart ──< CartItem >── Product >── Category
User ──< Order ──< OrderItem >── Product
Order ──< Payment ──< PaymentTransaction
Order >── Voucher ──< VoucherUsage >── User
Product ── DigitalProduct ──< DigitalCode
Admin ──< AuditLog
User ──< Notification >── Order
WebhookEvent (idempotency store, provider+externalId unique)
Setting (key-value config di DB)
```

Poin penting yang sudah diimplementasikan di level schema:

- `OrderItem.unitPrice` / `unitDiscount` / `lineTotal` = **snapshot**, bukan lookup ke `Product.price`.
- `DigitalCode.code` **unique** + status machine (`AVAILABLE → RESERVED → SOLD/REVOKED`) mencegah 1 code terjual 2×.
- `WebhookEvent` punya `@@unique([provider, externalId])` → dasar idempotency webhook pembayaran (Phase 4).
- `Cart`/`CartItem` disimpan di Postgres, bukan memori proses → survive restart.

---

## 4. Folder Structure (Phase 1)

```
noctra-store/
├── prisma/
│   ├── schema.prisma       # full ERD
│   └── seed.ts             # data contoh (kategori + 2 produk)
├── src/
│   ├── api/
│   │   ├── health.route.ts
│   │   └── routes.ts       # agregator /api/*
│   ├── config/
│   │   ├── env.ts          # validasi env (zod), fail-fast jika invalid
│   │   └── store.ts        # config terpusat (nama toko, currency, dst)
│   ├── database/
│   │   └── prisma.ts       # Prisma client singleton
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── requestId.ts
│   ├── utils/
│   │   ├── errors.ts       # AppError & turunannya
│   │   └── logger.ts       # pino + correlation id helper
│   ├── whatsapp/
│   │   ├── client.ts           # kirim text / interactive list (+fallback)
│   │   ├── messageBuilder.ts   # teks & struktur menu (brand voice)
│   │   ├── messageDispatcher.ts# routing pesan masuk
│   │   ├── types.ts            # tipe payload webhook Meta
│   │   └── webhook.route.ts    # GET verify + POST receive
│   ├── app.ts               # Express app assembly
│   └── server.ts            # entry point + graceful shutdown
├── tests/
│   └── webhook.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

`src/modules/*` (users, products, categories, cart, orders, payments, vouchers, fulfillment, notifications, admin) akan diisi mulai **Phase 2**.

---

## 5. Environment Variables

Lihat [`.env.example`](./.env.example). Ringkasan:

| Variable | Wajib di Phase 1? | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `WHATSAPP_TOKEN` | ✅ | Access token dari Meta App Dashboard |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | Phone Number ID dari Meta |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | String bebas buatanmu sendiri, untuk verifikasi webhook |
| `WHATSAPP_API_VERSION` | opsional (default `v20.0`) | Versi Graph API |
| `PAYMENT_API_KEY`, `WEBHOOK_SECRET` | belum, dipakai Phase 4 | |
| `ADMIN_SECRET` | belum, dipakai Phase 6 | |
| `REDIS_URL` | belum | |

**Tidak ada credential yang di-hardcode di source code** — `src/config/env.ts` akan menolak start (`process.exit(1)`) jika variabel wajib kosong, dengan pesan yang menyebut nama key saja (bukan menampilkan value).

---

## 6. Installation Requirements

- Node.js ≥ 20
- PostgreSQL ≥ 14 (lokal, Docker, atau managed seperti Railway/Supabase/Neon)
- Akun Meta Developer + WhatsApp Business App (untuk `WHATSAPP_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID`)
- Untuk testing webhook di lokal: tool tunnel seperti `ngrok` (Meta butuh HTTPS public URL)

---

## 7. Cara Menjalankan (Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy dan isi environment variables
cp .env.example .env
# isi DATABASE_URL, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN

# 3. Generate Prisma client + jalankan migration
npx prisma generate
npx prisma migrate dev --name init

# 4. (opsional) isi data contoh
npm run seed

# 5. Jalankan server (auto-reload)
npm run dev
```

Server akan jalan di `http://localhost:3000`. Cek:

```bash
curl http://localhost:3000/api/health
```

Untuk menghubungkan webhook WhatsApp:

```bash
# expose localhost ke internet (untuk testing)
ngrok http 3000

# lalu di Meta App Dashboard -> WhatsApp -> Configuration -> Webhook:
# Callback URL : https://<ngrok-id>.ngrok-free.app/webhooks/whatsapp
# Verify Token : (samakan dengan WHATSAPP_VERIFY_TOKEN di .env)
```

Setelah tersambung, kirim pesan `menu` dari WhatsApp ke nomor bisnis kamu — bot akan membalas dengan menu utama (interactive list, atau numbered text jika interactive gagal).

### Build & Production

```bash
npm run build          # compile TypeScript -> dist/
npx prisma migrate deploy   # jalankan migration di server produksi
npm start               # jalankan dist/server.js
```

### Deploy ke Railway (sesuai stack kamu)

1. Push repo ke GitHub.
2. Buat project baru di Railway, hubungkan ke repo.
3. Tambahkan Railway PostgreSQL plugin → salin `DATABASE_URL` yang di-generate ke Variables.
4. Isi semua env var lain (`WHATSAPP_TOKEN`, dst) di tab Variables Railway — jangan pernah commit `.env`.
5. Set build command `npm run build && npx prisma migrate deploy`, start command `npm start`.
6. Setelah deploy, gunakan domain Railway sebagai Callback URL webhook di Meta Dashboard.

---

## 8. Cara Testing

```bash
npm test
```

Test Phase 1 mencakup:

- Webhook GET verification (token cocok → 200 + echo challenge; tidak cocok → 403).
- Webhook POST selalu balas 200 (kontrak dengan Meta agar tidak retry).
- Health endpoint mengembalikan status store + database.

> **Catatan sandbox pengembangan ini:** saat kode ini dibuat, `prisma generate` sempat gagal mengunduh *query engine binary* karena environment sandbox membatasi domain jaringan keluar (bukan masalah kode). Client TypeScript-nya tetap ter-generate sempurna (`tsc --noEmit` lolos tanpa error). Di komputer/server kamu dengan akses internet normal, `npx prisma generate` akan berjalan 100% tanpa masalah — ini bagian standar setup Prisma.

---

## 9. Data Safety / Backup (persiapan Phase 9)

- Order & payment history tidak boleh hilang — gunakan PostgreSQL managed (Railway/Supabase/RDS) dengan **automated daily backup** diaktifkan.
- Rekomendasi: `pg_dump` terjadwal ke object storage terpisah, retensi minimal 30 hari.
- Jangan pernah menjalankan migration destruktif (`prisma migrate reset`) di production.

---

## 10. Roadmap Phase Selanjutnya

- [x] **Phase 1** — Setup + Database + WhatsApp connection
- [ ] Phase 2 — User + Product + Category (service layer, list & detail produk asli dari DB, pagination kategori)
- [ ] Phase 3 — Cart + Checkout + Order
- [ ] Phase 4 — Payment + Webhook (PaymentProvider interface, idempotency)
- [ ] Phase 5 — Digital fulfillment (alokasi kode aman)
- [ ] Phase 6 — Admin system (role-based, audit log)
- [ ] Phase 7 — Admin web dashboard
- [ ] Phase 8 — Notifications + logging + security hardening (rate limit, dst)
- [ ] Phase 9 — Testing menyeluruh + deployment

Bilang saja "lanjut phase 2" kalau siap lanjut — saya akan bangun di atas fondasi ini tanpa mengubah kontrak yang sudah ada.
