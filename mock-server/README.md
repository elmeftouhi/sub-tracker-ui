# Subscription Tracker Mock API Server

This is a mock REST API server for the subscription tracker application. It provides all the necessary endpoints to support the frontend functionality.

## Getting Started

### Installation
```bash
cd mock-server
npm install
```

### Running the Server
```bash
# Start the server
npm start

# Start with auto-reload for development
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
  - Query params: `status`, `category`, `search`
- `GET /api/subscriptions/:id` - Get subscription by ID
- `POST /api/subscriptions` - Create new subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `PATCH /api/subscriptions/:id/status` - Update subscription status
- `PATCH /api/subscriptions/:id/payment` - Update payment status

### Analytics
- `GET /api/analytics` - Get analytics data
  - Query params: `year` (optional)

### Renewals
- `GET /api/renewals/upcoming` - Get upcoming renewals
  - Query params: `days` (default: 30)
- `GET /api/renewals/overdue` - Get overdue subscriptions

### Settings
- `GET /api/settings` - Get app settings
- `PUT /api/settings` - Update app settings

### Payment Methods
- `GET /api/payment-methods` - Get all payment methods
- `POST /api/payment-methods` - Create new payment method
- `PUT /api/payment-methods/:id` - Update payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

### Reminders
- `GET /api/reminders` - Get active reminders

### Utility
- `POST /api/reset` - Reset data to initial state (for testing)

## Data Models

### Subscription
```json
{
  "id": "string",
  "name": "string",
  "category": "string",
  "price": "number",
  "currency": "string",
  "billingCycle": "monthly | yearly | custom",
  "customInterval": "number (optional)",
  "renewalDate": "Date",
  "paymentMethod": "cash | credit-card | bank-transfer",
  "creditCardId": "string (optional)",
  "bankId": "string (optional)",
  "notes": "string (optional)",
  "status": "active | paused | canceled",
  "paid": "boolean",
  "cancelReminder": {
    "enabled": "boolean",
    "daysAfterDue": "number"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Payment Method
```json
{
  "id": "string",
  "type": "credit-card | bank-transfer",
  "name": "string",
  "last4": "string",
  "brand": "string (for credit cards)",
  "expiryMonth": "number (for credit cards)",
  "expiryYear": "number (for credit cards)",
  "bankName": "string (for bank transfers)"
}
```

### Settings
```json
{
  "categories": "string[]",
  "currencies": "string[]",
  "defaultCurrency": "string"
}
```

## Sample Data

The server comes with pre-loaded sample data including:
- 5 sample subscriptions (Netflix, Spotify, Adobe Creative Suite, GitHub Pro, Gym Membership)
- 3 sample payment methods
- Default settings with common categories and currencies

## CORS

CORS is enabled for all origins to allow frontend development.

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (for successful deletes)
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

Error responses include a JSON object with an `error` field describing the issue.