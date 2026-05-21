# Resello Backend API

Backend API for a device resale marketplace platform built on Node.js + Express + PostgreSQL.

---

## 📁 Project Structure

```
resello-backend/
├── app.js                          # Express app setup, middleware & route mounting
# recall-backend
recall-backend
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
