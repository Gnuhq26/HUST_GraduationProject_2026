# Buildify — Multi-Tenant Store Management System

> Đồ án tốt nghiệp 2026 — Trường Công nghệ Thông tin và Truyền thông, Đại học Bách Khoa Hà Nội  
> Sinh viên thực hiện: **Hungdz**

Buildify là một hệ thống quản lý bán hàng theo mô hình **SaaS (Software as a Service)**, được xây dựng trên kiến trúc **Multi-tenant** kết hợp **Role-Based Access Control (RBAC)**. Hệ thống cho phép nhiều cửa hàng độc lập vận hành trên cùng một nền tảng, với đầy đủ các nghiệp vụ quản lý từ sản phẩm, tồn kho, đơn hàng đến báo cáo tài chính và phân tích AI.

---

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Tech Stack](#tech-stack)
- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Database Schema](#database-schema)
- [Bắt đầu (Development)](#bắt-đầu-development)
- [Chạy với Docker](#chạy-với-docker)
- [Biến môi trường](#biến-môi-trường)
- [API Documentation](#api-documentation)
- [CI/CD Pipeline](#cicd-pipeline)
- [Triển khai Production](#triển-khai-production)

---

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│             Nginx (Reverse Proxy + SSL/TLS)              │
│                   buildify.dangky.app                    │
└──────────┬──────────────────────────┬───────────────────┘
           │ :8081                    │ :3000
┌──────────▼──────────┐   ┌───────────▼───────────────────┐
│  Frontend Container  │   │      Backend Container         │
│  React + Vite        │   │  NestJS + Prisma               │
│  nginx:alpine        │   │  node:22-alpine                │
└─────────────────────┘   └───────────┬───────────────────┘
                                       │ TCP/3306
                          ┌────────────▼───────────────────┐
                          │    MariaDB (External Host)      │
                          │    mysql.toolhub.app:3306       │
                          └────────────────────────────────┘
```

**Mô hình Multi-tenant:** Mỗi `Store` có dữ liệu riêng biệt (row-level isolation). Tenant context được truyền qua header `X-Store-ID` hoặc `X-Subdomain` trên mỗi request.

**Mô hình RBAC:** Mỗi user trong một store được gán một `Role`. Role chứa tập hợp `Permission` (action + subject). `PermissionGuard` kiểm tra quyền trên mỗi request được bảo vệ.

---

## Tech Stack

### Backend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| Node.js | 22 (LTS) | Runtime |
| NestJS | 11 | Application framework |
| Prisma ORM | 7.8.0 | Database access layer |
| `@prisma/adapter-mariadb` | 7.6.0 | MariaDB-native driver adapter |
| MariaDB / MySQL | — | Relational database |
| Passport.js | — | Authentication middleware |
| JWT | — | Stateless token auth |
| Google OAuth 2.0 | — | Social login |
| `@nestjs/swagger` | 11 | API documentation |
| `@nestjs/throttler` | 6 | Rate limiting |
| Google Gemini 2.5 Flash | — | AI Analyst feature |
| ExcelJS | 4 | Export báo cáo Excel |
| bcrypt | 6 | Password hashing |

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Utility-first CSS |
| React Router | v7 | Client-side routing |
| Zustand | 5 | State management |
| Axios | — | HTTP client |
| Recharts | 3 | Data visualization |
| React Hook Form | 7 | Form management |
| Lucide React | — | Icon library |

### Infrastructure
| Công nghệ | Vai trò |
|---|---|
| Docker + Docker Compose | Container orchestration |
| Nginx (alpine) | Frontend serving + SPA routing |
| GitHub Actions | CI/CD pipeline |
| VPS (Ubuntu) | Production hosting |

---

## Tính năng chính

### Xác thực & Phân quyền
- Đăng ký / đăng nhập bằng Email + Password (bcrypt hash)
- Đăng nhập bằng **Google OAuth 2.0**
- JWT access token với thời hạn cấu hình
- **RBAC**: Tạo Role tùy chỉnh, gán Permission (action × subject) theo cú pháp CASL-inspired
- Guard toàn cục: `GlobalJwtAuthGuard` + `PermissionGuard` trên mọi route

### Quản lý Cửa hàng (Multi-tenant)
- Tạo và quản lý nhiều cửa hàng độc lập
- Mời thành viên vào store, gán role cụ thể
- Subdomain riêng cho từng store

### Quản lý Danh mục & Sản phẩm
- CRUD danh mục sản phẩm (category)
- Quản lý sản phẩm với SKU, đơn vị gốc (`BaseUnit`), mô tả, trạng thái
- **Đơn vị quy đổi** (ProductUnit): hỗ trợ nhiều đơn vị tính với tỷ lệ quy đổi (ví dụ: 1 Pallet = 500 Viên)
- Biên lợi nhuận mục tiêu (`MarginRate`) theo từng sản phẩm

### Quản lý Kho hàng (Inventory)
- **Tồn kho 3 lớp**: `Quantity` (thực tế) / `ReservedQty` (đã đặt, chưa xuất) / `InTransitQty` (đang về)
- Phiếu nhập kho (`StockReceipt`) với mã tự sinh `PN-YYYYMMDD-NNN`
- Chiết khấu nhà cung cấp theo từng dòng hàng
- `InventoryLog`: lịch sử biến động tồn kho đầy đủ

### Quản lý Nhà cung cấp & Khách hàng
- CRUD nhà cung cấp, liên kết với phiếu nhập
- CRUD khách hàng, lịch sử giao dịch

### Quản lý Đơn hàng & Bán hàng
- Tạo đơn hàng nhiều dòng sản phẩm
- Trạng thái đơn: `Pending` → `Completed` / `Cancelled`
- Ghi nhận thanh toán một phần (`PaidAmount`)
- Liên kết đơn hàng với phiếu nhập (đặt hàng theo nhu cầu)

### Quản lý Công nợ
- Tự động tính công nợ khách hàng (`TotalAmount - PaidAmount`)
- Gom nhóm công nợ theo khách hàng
- Ghi nhận thanh toán công nợ từng phần

### Báo cáo & Thống kê
- **Báo cáo doanh thu** theo khoảng thời gian (doanh số, tiền thực thu, công nợ phát sinh)
- **Top sản phẩm** bán chạy
- Xuất báo cáo ra file **Excel** (.xlsx)

### AI Analyst (Google Gemini 2.5 Flash)
- Tự động phân tích dữ liệu kinh doanh của store (doanh thu, tồn kho thấp, công nợ)
- Sinh insight dạng Markdown, cache in-memory 30 phút (tránh spam API)
- Graceful degradation: nếu thiếu `GEMINI_API_KEY`, app vẫn chạy bình thường

---

## Cấu trúc dự án

```
GR2_HUST_2025.1/
├── backend/                    # NestJS application
│   ├── src/
│   │   ├── main.ts             # Bootstrap, Swagger, CORS, global pipes
│   │   ├── app.module.ts       # Root module
│   │   ├── common/
│   │   │   ├── decorators/     # @Public, @CurrentUser, @CurrentStore, @CheckPermission
│   │   │   ├── filters/        # GlobalExceptionFilter
│   │   │   ├── guards/         # GlobalJwtAuthGuard, PermissionGuard
│   │   │   ├── interceptors/   # LoggingInterceptor
│   │   │   ├── middleware/
│   │   │   ├── pagination/
│   │   │   └── prisma/         # PrismaModule, PrismaService (với heartbeat)
│   │   ├── modules/
│   │   │   ├── ai-analyst/     # Google Gemini integration
│   │   │   ├── auth/           # JWT + Google OAuth strategies
│   │   │   ├── categories/
│   │   │   ├── customers/
│   │   │   ├── debts/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   ├── permissions/
│   │   │   ├── products/
│   │   │   ├── reports/
│   │   │   ├── roles/
│   │   │   ├── stores/
│   │   │   └── suppliers/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (13 models)
│   │   ├── migrations/         # Prisma migration history
│   │   └── seeds/              # Seed data scripts
│   ├── generated/prisma/       # Prisma Client (auto-generated, gitignored)
│   └── prisma.config.ts
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # Axios service layer (per module)
│   │   ├── store/              # Zustand global state (authStore)
│   │   ├── hooks/              # Custom hooks (usePermission)
│   │   ├── layouts/            # MainLayout
│   │   ├── routes/             # Route definitions + ProtectedRoute
│   │   └── types/              # TypeScript type definitions
│
├── backend/docker-compose.yml  # MySQL local dev only
├── ecosystem.config.cjs        # PM2 production (API)
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
└── docs/                       # Architecture docs, changelogs
```

---

## Database Schema

Hệ thống có **13 Prisma models** tổ chức thành 3 nhóm:

**Nhóm 1 — IAM (Identity & Access Management)**
```
User ──< StoreUser >── Store ──< Role ──< RolePermission >── Permission
```

**Nhóm 2 — Catalog**
```
Store ──< Category ──< Product ──< ProductUnit
```

**Nhóm 3 — Operations**
```
Store ──< Supplier ──< StockReceipt ──< StockReceiptDetail
Store ──< Inventory ──< InventoryLog
Store ──< Customer ──< Order ──< OrderDetail
```

---

## Bắt đầu (Development)

### Yêu cầu
- Node.js >= 22
- npm >= 10
- Một instance MySQL/MariaDB (local hoặc remote)

### Backend

```bash
cd backend

# Cài dependencies
npm install

# Tạo file .env (xem mục Biến môi trường)
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Chạy migration (lần đầu)
npx prisma migrate deploy

# Seed dữ liệu demo (tuỳ chọn)
npx ts-node prisma/seeds/seed-demo.ts

# Khởi động development server
npm run start:dev
```

Backend chạy tại `http://localhost:3000`

### Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Tạo file .env
echo "VITE_API_BASE_URL=http://localhost:3000" > .env

# Khởi động Vite dev server
npm run dev
```

Frontend chạy tại `http://localhost:5173`

---

## Docker (chỉ dev — MySQL local)

Production dùng **PM2 + Nginx**. Docker chỉ còn để chạy MySQL trên máy dev:

```bash
cd backend
docker compose up -d    # MySQL cổng 3307
```

> **Lưu ý:** `DATABASE_URL` trong `backend/.env` trỏ tới MariaDB/MySQL (local hoặc remote).

---

## Biến môi trường

### `backend/.env`

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/dbname"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="1d"

# CORS (comma-separated origins)
CORS_ORIGINS="http://localhost:5173,http://localhost:8081"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Frontend URL (redirect sau OAuth)
FRONTEND_URL="http://localhost:5173"

# AI Analyst (tuỳ chọn — thiếu key app vẫn chạy bình thường)
GEMINI_API_KEY="your-gemini-api-key"

# App port (mặc định 3000)
PORT=3000
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## API Documentation

Swagger UI khả dụng tại: `http://localhost:3000/api`

API được tổ chức theo module với authentication qua **Bearer JWT**. Mỗi request tới các endpoint được bảo vệ cần:
- Header `Authorization: Bearer <token>`
- Header `X-Store-ID: <storeId>` (hoặc `X-Subdomain: <subdomain>`)

**Các nhóm endpoint chính:**

| Tag | Prefix | Mô tả |
|---|---|---|
| Authentication | `/auth` | Register, Login, Google OAuth, Profile |
| Stores | `/stores` | CRUD store, quản lý thành viên |
| Roles & Permissions | `/roles`, `/permissions` | RBAC management |
| Products | `/products` | CRUD sản phẩm, units |
| Categories | `/categories` | CRUD danh mục |
| Suppliers | `/suppliers` | CRUD nhà cung cấp |
| Inventory | `/inventory` | Tồn kho, phiếu nhập, xuất kho |
| Customers | `/customers` | CRUD khách hàng |
| Orders | `/orders` | Tạo & quản lý đơn hàng |
| Debts | `/debts` | Công nợ khách hàng |
| Reports | `/reports` | Báo cáo doanh thu, top sản phẩm |
| AI Analyst | `/ai-analyst` | Phân tích AI theo store |

---

## CI/CD Pipeline

Pipeline tự động trigger khi có push vào nhánh `hungdz`:

```
Push to hungdz
      │
      ▼
GitHub Actions (ubuntu-latest)
      │
      ▼
SSH vào VPS
      │
      ├── git fetch origin && git reset --hard origin/hungdz
      ├── backend: npm ci → prisma generate → build → migrate deploy
      ├── frontend: npm ci → build (dist/ cho Nginx)
      └── pm2 startOrReload ecosystem.config.cjs
```

Cấu hình tại [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**GitHub Secrets cần thiết:**
- `VPS_HOST` — IP hoặc domain của VPS
- `VPS_USERNAME` — SSH username
- `VPS_SSH_KEY` — Private key SSH (ED25519 hoặc RSA)

---

## Triển khai Production

**Domain:** `buildify.dangky.app`

**Kiến trúc production:**

```
Internet
   │ HTTPS (443)
   ▼
Nginx (host) — SSL termination (Let's Encrypt)
   │
   ├── / → proxy_pass http://127.0.0.1:8081  (Frontend container)
   └── /api → proxy_pass http://127.0.0.1:3000  (Backend container)
```

**Các giá trị `.env` cần thay đổi trên VPS:**

```env
CORS_ORIGINS="https://buildify.dangky.app"
GOOGLE_CALLBACK_URL="https://buildify.dangky.app/api/auth/google/callback"
FRONTEND_URL="https://buildify.dangky.app"
```

```env
# frontend/.env (build time)
VITE_API_BASE_URL=https://buildify.dangky.app/api
```

---

## Thiết kế đáng chú ý

**Prisma Heartbeat** — `PrismaService` gửi `SELECT 1` mỗi 30 giây để duy trì kết nối TCP với MariaDB, tránh server-side idle timeout sau 8 giờ không có traffic.

**Graceful degradation cho AI** — Nếu `GEMINI_API_KEY` không được cấu hình, `AiAnalystService` log warning và các endpoint AI trả về `503` thay vì làm crash toàn bộ ứng dụng.

**Stateless với fresh data** — JWT payload chỉ chứa `userId`. Mỗi request, `JwtStrategy` query DB để lấy danh sách stores/roles mới nhất, đảm bảo không bao giờ có stale permission data.

**Docker multi-stage build** — Image production không chứa `devDependencies`, TypeScript compiler, hay source `.ts`. Prisma Client được generate trong builder stage với dummy `DATABASE_URL`.

---

## License

UNLICENSED — Đồ án tốt nghiệp, không dùng cho mục đích thương mại.