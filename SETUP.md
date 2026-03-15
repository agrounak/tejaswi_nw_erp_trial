# Tejaswi Nonwovens ERP

Factory ERP system for non-woven roll and patti manufacturing.
QR-based tracking from production to dispatch.

## Workflow

```
Production → Sticker/QR → Warehouse → Order Allocation → Loading (QR Scan) → Dispatch
```

## Quick Start

### Backend (Flask API)

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py               # Starts on http://localhost:5000
```

To seed sample data:
```bash
python seed_data.py
```

### Frontend (React)

```bash
cd frontend
npm install
npm start                   # Starts on http://localhost:3000
```

## API Endpoints

| Module     | Endpoint                          | Method | Description               |
|------------|-----------------------------------|--------|---------------------------|
| Production | `/api/production/entry`           | POST   | Register new roll/patti   |
| Production | `/api/production/products`        | GET    | List products (filterable)|
| Production | `/api/production/scan/<number>`   | GET    | Lookup by product number  |
| Inventory  | `/api/inventory/receive`          | POST   | Scan into warehouse       |
| Inventory  | `/api/inventory/stock`            | GET    | Current warehouse stock   |
| Inventory  | `/api/inventory/summary`          | GET    | Aggregated summary        |
| Inventory  | `/api/inventory/locations`        | GET    | Warehouse location map    |
| Orders     | `/api/orders/`                    | POST   | Create sales order        |
| Orders     | `/api/orders/`                    | GET    | List orders               |
| Orders     | `/api/orders/<id>/allocate`       | POST   | Auto-allocate inventory   |
| Dispatch   | `/api/dispatch/create`            | POST   | Start dispatch session    |
| Dispatch   | `/api/dispatch/<id>/scan`         | POST   | Scan product onto truck   |
| Dispatch   | `/api/dispatch/<id>/complete`     | POST   | Complete dispatch         |
| Dispatch   | `/api/dispatch/<id>/sheet`        | GET    | Dispatch summary sheet    |
| Sticker    | `/api/sticker/<product_id>`       | GET    | Download sticker PNG      |
| Dashboard  | `/api/dashboard/summary`          | GET    | Factory dashboard data    |

## Product Number Format

```
{Shift}-{Day}{MonthCode}-{Sequence}
Example: A-15MR-023
```

- Shift: A or B
- Day: 01-31
- Month code: JA, FE, MR, AP, MY, JN, JL, AU, SE, OC, NV, DE
- Sequence: Auto-incrementing per shift+day

## Product Status Flow

```
Manufactured → Sticker Printed → In Warehouse → Allocated → Loaded → Dispatched
```

## Tech Stack

- **Backend**: Flask, SQLAlchemy, SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React, React Router, Axios
- **QR/Sticker**: qrcode + Pillow (generates 4x6 inch thermal sticker PNGs)
