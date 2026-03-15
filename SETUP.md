# Tejaswi Nonwovens ERP

Factory ERP system for non-woven roll and patti manufacturing.
QR-based tracking from production to dispatch.

## Workflow

```
Production → Sticker/QR → Inventory → Dispatch (QR Scan) → Packing Slip → Dispatch History
```

## Quick Start

### Backend (Flask API)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_data.py           # Seeds admin user, configs, and sample products
python run.py                 # Starts on http://localhost:5000
```

Default admin login: `admin` / `admin123`

### Frontend (React)

```bash
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

## User Roles

| Role          | Access                                    |
|---------------|-------------------------------------------|
| Admin         | Full system (all pages + user management) |
| Sticker User  | Sticker Generator + Inventory view        |
| Dispatch User | Dispatch + Inventory view                 |

## System Modules

| Page               | Description                                        |
|--------------------|----------------------------------------------------|
| Dashboard          | Production, inventory, and dispatch stats           |
| Register User      | Create users with role assignment (Admin only)      |
| Sticker Generator  | Production entry form + QR sticker generation       |
| Inventory          | Stock listing with search, edit, view, export       |
| Dispatch           | QR scan loading with validation                     |
| Dispatched History | Past dispatches with packing slips                  |
| Admin Config       | Manage dropdown options (quality, colour, etc.)     |

## API Endpoints

| Module     | Endpoint                              | Method | Description               |
|------------|---------------------------------------|--------|---------------------------|
| Auth       | `/api/auth/login`                     | POST   | User login                |
| Auth       | `/api/auth/register`                  | POST   | Create user               |
| Production | `/api/production/entry`               | POST   | Register new roll/patti   |
| Production | `/api/production/products`            | GET    | List products (paginated) |
| Production | `/api/production/products/<id>`       | PUT    | Update product            |
| Production | `/api/production/products/<id>`       | DELETE | Delete product            |
| Inventory  | `/api/inventory/stock`                | GET    | Paginated inventory       |
| Inventory  | `/api/inventory/export`               | GET    | CSV export                |
| Dispatch   | `/api/dispatch/create`                | POST   | Start dispatch session    |
| Dispatch   | `/api/dispatch/<id>/scan`             | POST   | Scan product onto truck   |
| Dispatch   | `/api/dispatch/<id>/remove/<item>`    | DELETE | Remove scanned item       |
| Dispatch   | `/api/dispatch/<id>/finalize`         | POST   | Finalize dispatch         |
| Dispatch   | `/api/dispatch/history`               | GET    | Completed dispatches      |
| Dispatch   | `/api/dispatch/<id>/sheet`            | GET    | Packing slip data         |
| Config     | `/api/config/`                        | GET    | List config options       |
| Config     | `/api/config/`                        | POST   | Add config option         |
| Config     | `/api/config/seed`                    | POST   | Seed default options      |
| Sticker    | `/api/sticker/<product_id>`           | GET    | Download sticker PNG      |
| Dashboard  | `/api/dashboard/summary`              | GET    | Factory dashboard data    |

## Product Number Format

```
{Shift}{Day}{MonthCode}{Sequence}
Example: A15MR038
```

## Product Status Flow

```
Manufactured → Sticker Printed → In Warehouse → Allocated → Loaded → Dispatched
```

## Tech Stack

- **Backend**: Flask, SQLAlchemy, SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React, React Router, Axios
- **QR/Sticker**: qrcode + Pillow (4x6 inch thermal sticker PNGs)
- **Auth**: werkzeug password hashing
