# Resello Backend API

Backend API for a device resale marketplace platform built on Node.js + Express + PostgreSQL.

---

## 📁 Project Structure

```
resello-backend/
├── app.js                          # Express app setup, middleware & route mounting
├── server.js                       # HTTP server entry point & graceful shutdown
├── package.json
├── config/
│   ├── database.js                 # PostgreSQL connection pool
│   ├── multer.config.js            # File upload configuration
│   ├── delete.config.js            # File deletion helpers
│   ├── response.logger.js          # Response logging middleware
│   └── winston.logger.js           # Winston logger setup
├── controllers/
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── sell.controller.js
│   ├── system.controller.js
│   ├── ui.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── auth.middleware.js          # JWT verification
│   ├── async_handler.js            # Async error wrapper
│   ├── error_handler.middleware.js # Global error handler
│   └── req_body.middleware.js      # Request body parser / normalizer
├── providers/
│   └── email.provider.js           # Nodemailer email sending
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── sell.routes.js
│   ├── system.routes.js
│   ├── ui.routes.js
│   └── user.routes.js
├── services/
│   ├── auth.service.js
│   ├── product.service.js
│   ├── sell.service.js
│   ├── system.service.js
│   ├── ui.service.js
│   └── user.service.js
├── database/
│   ├── db_script_resello.sql       # Full schema
│   ├── pre_requisites_data.sql     # Seed / prerequisite data
│   └── DROP_everything_resello.sql # Teardown script
├── uploads/                        # Locally stored uploaded files
└── logs/                           # Daily rotating log files
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root (never commit it):

```env
PORT=1000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=resello
DB_USER=postgres
DB_PASSWORD=<your_password>

DATABASE_URL=postgresql://username:testpass@localuser/Resello

JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<your_refresh_secret>

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASS=<email_password>
```

### Run

```bash
# Development (nodemon)
npx nodemon server.js

# Production
node server.js
```

---

## 📚 API Reference

> Base URL: `http://localhost:1000`

---

### Authentication — `/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/initiate` | Start auth flow — send OTP to email |
| POST | `/auth/request_otp` | Request a new OTP |
| POST | `/auth/resend_otp` | Resend OTP to same email |
| POST | `/auth/verify_otp` | Verify OTP and receive tokens |
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/refresh` | Refresh access token using refresh token |
| DELETE | `/auth/logout` | Logout / invalidate session |

---

### Products — `/product`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/product/create` | Create product listing (multipart: `image[]`) |
| GET | `/product/get_products` | Get all products |
| GET | `/product/get_products/:id` | Get product by ID |
| PUT | `/product/update/:id` | Update product |
| DELETE | `/product/delete/:id` | Soft-delete product |
| GET | `/product/slug/:slug` | Get product by slug |
| GET | `/product/sku/:sku` | Get product by SKU |
| GET | `/product/brand/:brandSlug/products` | Products for a brand |
| GET | `/product/brand/:brandSlug/series` | Series for a brand |
| GET | `/product/brand/:brandSlug/models` | Models for a brand |
| GET | `/product/brand/:brandSlug/:seriesSlug/models` | Models for a brand + series |
| GET | `/product/:brandSlug/:modelSlug` | Get model by brand + model slug |
| GET | `/product/:modelSlug` | Get questions by model slug |

---

### Users — `/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/create` | Create user |
| GET | `/users/get_users` | Get all users |
| GET | `/users/get_users/:id` | Get user by ID |
| DELETE | `/users/delete_user/:id` | Delete user |

---

### System — `/system`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system/get_services` | Get all services |
| POST | `/system/create_service` | Create service (multipart: `image`) |
| DELETE | `/system/delete_service/:id` | Delete service |
| GET | `/system/get_categories/:sub` | Get categories (pass `true` for subcategories) |
| POST | `/system/create_category` | Create category (multipart: `image`) |
| DELETE | `/system/delete_category/:id` | Delete category |
| GET | `/system/get_brands` | Get all brands |
| GET | `/system/get_brands/:cat_slug` | Get brands by category slug |
| POST | `/system/create_brand` | Create brand (multipart: `image`) |
| DELETE | `/system/delete_brand/:id` | Delete brand |
| GET | `/system/get_roles` | Get all roles |
| GET | `/system/series/:brand_slug` | Get series for a brand |
| POST | `/system/series` | Create a series |
| GET | `/system/get_models/:cat_slug/:brand_slug/:series_slug` | Get models |
| POST | `/system/models` | Create model (multipart: `image`) |

---

### Sell — `/sell`

#### Model Configs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/configs/:model_slug` | Get configs for a model |
| POST | `/sell/configs` | Create model config |
| PUT | `/sell/configs/:id` | Update model config |
| DELETE | `/sell/configs/:id` | Delete model config |

#### Sell Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/questions` | Get all questions |
| GET | `/sell/questions/:modelSlug` | Get questions by model |
| GET | `/sell/questions/category/:category_id` | Get questions by category |
| POST | `/sell/questions` | Create question |
| PUT | `/sell/questions/:id` | Update question |
| DELETE | `/sell/questions/:id` | Deactivate question |

**Create/Update question payload:**
```json
{
  "text": "Is the screen cracked?",
  "description": "Check for any cracks or dead pixels",
  "input_type": "yes_no",
  "sort_index": 1,
  "category_slugs": ["mobile", "tablet"]
}
```

> `input_type` must be one of: `yes_no` | `single_select` | `multi_select`
> For `yes_no` questions, **Yes** and **No** options are auto-created by the system on question creation and are readonly — they can be used immediately to wire conditional appearance rules.

#### Question Options

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/options/:question_id` | Get options for a question |
| POST | `/sell/options` | Create option |
| PUT | `/sell/options/:id` | Update option |
| DELETE | `/sell/options/:id` | Delete option |

**Option payload:**
```json
{
  "question_id": 1,
  "text": "Cracked",
  "price_deduction": 2000,
  "sort_index": 1
}
```

#### Conditions (Conditional Appearance)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/conditions/:question_id` | Get conditions for a question |
| POST | `/sell/conditions` | Create condition |
| DELETE | `/sell/conditions/:id` | Delete condition |

**Condition payload:**
```json
{
  "trigger_option_id": 5,
  "show_question_id": 3
}
```

> When option `trigger_option_id` is selected by the user, question `show_question_id` becomes visible in the sell flow.

#### Category–Question Mapping

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/category-questions/:category_id` | Get questions for a category |
| POST | `/sell/category-questions` | Map question to category |
| DELETE | `/sell/category-questions/:category_id/:question_id` | Unmap question from category |

#### Sell Flow & Pricing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/flow/:category_slug` | Full question flow for a category (with conditions) |
| POST | `/sell/calculate-price` | Calculate device price from submitted answers |

#### Listings (Sell Leads)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sell/listings` | Get all sell listings |
| POST | `/sell/listings` | Create sell listing |
| PUT | `/sell/listings/:id/assign` | Assign listing to a merchant |
| PUT | `/sell/listings/:id/transfer` | Transfer listing |
| PUT | `/sell/listings/:id/reject` | Reject listing |
| GET | `/sell/merchants` | Get all merchants |

---

### UI — `/ui`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ui/home_banners` | Get home page banners |

---

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check — returns `{ status: "success", code: 200 }` |
| GET | `/logs` | Tail today's application log (array of JSON log entries, newest first) |

---

## 🔐 Authentication

JWT-based. Pass the access token in every protected request:

```
Authorization: Bearer <access_token>
```

Refresh via `POST /auth/refresh`.

---

## 🚦 HTTP Status Codes

| Code | Meaning | When used |
|------|---------|-----------|
| `200` | OK | Successful read / update / operation |
| `201` | Created | Resource successfully created |
| `304` | Not Modified | Resource same as last request |
| `400` | Bad Request | Missing or invalid parameters |
| `401` | Unauthorized | Invalid credentials or expired OTP |
| `403` | Forbidden | Account inactive / access denied |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (already exists) |
| `429` | Too Many Requests | OTP / auth rate limit exceeded |
| `500` | Internal Server Error | Unexpected server-side failure |

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `pg` | PostgreSQL client |
| `bcrypt` | Password hashing |
| `jsonwebtoken` | JWT access & refresh tokens |
| `multer` | File / image uploads |
| `nodemailer` | Transactional email (OTP delivery) |
| `winston` + `winston-daily-rotate-file` | Structured daily rotating logs |
| `morgan` | HTTP request access logging |
| `cookie-parser` | Cookie parsing |
| `cors` | Cross-origin request handling |
| `dotenv` | Environment variable loading |
| `slugify` | Auto slug generation |
| `uuid` | UUID generation |

---

## 🗄️ Enums

```
product_status : draft | active | archived
user_status    : active | suspended | deleted
order_status   : pending | paid | shipped | cancelled
input_type     : yes_no | single_select | multi_select
```

---

## 📝 Logging

- Application logs: `logs/app.log.<YYYY-MM-DD>` — daily rotation via Winston
- HTTP access log: morgan `dev` format to stdout
- View today's log: `GET /logs`
- Clean today's logs: `GET /logs_clean`
