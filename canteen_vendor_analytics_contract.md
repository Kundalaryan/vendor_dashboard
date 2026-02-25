# Canteen Vendor Analytics API Contract

> Base URL: `https://<your-domain>/api`
> Auth: `Authorization: Bearer <vendor_jwt_token>`
> Role required: `VENDOR`

---

## Endpoint

```
GET /vendor/analytics/canteen
```

Returns today vs yesterday KPI comparison plus a 7-day trend, scoped to the authenticated vendor's canteen.

---

## Response `200`

```json
{
  "today": {
    "date": "2026-02-23",
    "totalOrders": 42,
    "completedOrders": 30,
    "cancelledOrders": 5,
    "rejectedOrders": 3,
    "totalRevenue": 8400.00,
    "netRevenue": 8400.00,
    "platformFeeRate": 0.0,
    "averageOrderValue": 240.00
  },
  "yesterday": {
    "date": "2026-02-22",
    "totalOrders": 38,
    "completedOrders": 28,
    "cancelledOrders": 4,
    "rejectedOrders": 2,
    "totalRevenue": 7600.00,
    "netRevenue": 7600.00,
    "platformFeeRate": 0.0,
    "averageOrderValue": 220.00
  },
  "revenueChangePercent": 10.52,
  "ordersChangePercent": 10.52,
  "sevenDayTrend": [
    {
      "date": "2026-02-16",
      "totalOrders": 35,
      "completedOrders": 26,
      "cancelledOrders": 3,
      "rejectedOrders": 2,
      "totalRevenue": 6500.00,
      "netRevenue": 6500.00,
      "platformFeeRate": 0.0,
      "averageOrderValue": 200.00
    }
    // ... 6 more days, oldest → newest
  ]
}
```

---

## KPI Field Reference

| Field | Type | Description |
|---|---|---|
| `date` | `date` | The day this snapshot represents |
| `totalOrders` | `int` | All orders placed for the day |
| `completedOrders` | `int` | Orders with status `READY` (picked up by customer) |
| `cancelledOrders` | `int` | Orders cancelled by customer |
| `rejectedOrders` | `int` | Orders rejected by vendor |
| `totalRevenue` | `double` | Revenue from **paid orders only** — excludes CANCELLED / REJECTED / EXPIRED |
| `netRevenue` | `double` | `totalRevenue × (1 - platformFeeRate)` |
| `platformFeeRate` | `double` | e.g. `0.05` = 5%. Currently `0` (configurable later) |
| `averageOrderValue` | `double` | `totalRevenue ÷ paidOrders` (computed, not persisted) |
| `revenueChangePercent` | `double` | `(today - yesterday) / yesterday × 100` |
| `ordersChangePercent` | `double` | Same formula for total orders |
| `sevenDayTrend` | `array` | 7 entries (day before yesterday going back 7 days), oldest first |

> **Revenue rule:** An order counts toward revenue only if its status is **not** `EXPIRED`, `CANCELLED`, or `REJECTED`. Since this is a pay-first model, a successfully placed & paid order whose fulfilment status is `ORDER_PLACED`, `ACCEPTED`, `PREPARING`, or `READY` is included.

---

## How today's stats are computed

- **Today:** Live aggregation directly from the `orders` table.
- **Yesterday + 7-day Trend:** Read from the nightly `daily_order_stats` snapshot table, which is populated by `DailyOrderStatsJob` at `00:05 AM` every day.

---

## Error Responses

| HTTP | Reason |
|---|---|
| `401` | Missing or expired JWT |
| `403` | Token is not a VENDOR token |
