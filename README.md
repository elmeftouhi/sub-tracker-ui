# SubTracker - Subscription Tracker

A simple web application to help you track your paid subscriptions and avoid surprise renewals.

## Features

- **Dashboard Overview**: View total monthly/yearly spend and upcoming renewals
- **Subscription Management**: Add, edit, and delete subscriptions
- **Status Tracking**: Mark subscriptions as active, paused, or canceled
- **Renewal Alerts**: See upcoming renewals in the next 7 days
- **Local Storage**: All data stored locally using IndexedDB (no server required)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS  
- **Data Storage**: IndexedDB via Dexie.js
- **Build Tool**: Vite
- **Date Handling**: date-fns
- **Routing**: React Router DOM

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout.tsx       # Main app layout with navigation
│   ├── Dashboard.tsx    # Overview with stats and alerts
│   ├── SubscriptionList.tsx  # Table view of all subscriptions
│   └── AddSubscription.tsx   # Form to add new subscriptions
├── hooks/              
│   └── useSubscriptions.ts   # Custom hook for data management
├── types/              
│   └── subscription.ts      # TypeScript interfaces
├── utils/              
│   ├── database.ts          # IndexedDB setup with Dexie
│   └── helpers.ts           # Utility functions
└── App.tsx             # Main app component with routing
```

## Core User Flows

1. **First-run**: Add your first subscription quickly via the "Add Subscription" form
2. **Daily use**: Check the dashboard for subscription overview and upcoming renewals  
3. **Maintenance**: Use the subscriptions list to edit status or delete subscriptions

## Data Model

Subscriptions are stored with the following fields:
- Basic info: name, category, notes
- Pricing: price, currency, billing cycle
- Dates: renewal date, created/updated timestamps
- Status: active, paused, or canceled
- Payment: optional payment method info

## Development Roadmap

### Milestone 1 ✅ (Complete)
- Project setup and core infrastructure
- Basic CRUD operations for subscriptions
- Dashboard with overview statistics

### Milestone 2 (Next)
- Enhanced form validation
- Better error handling and user feedback
- Subscription editing capabilities

### Milestone 3 (Future)
- Data export/import functionality
- Email/push notification alerts
- Optional cloud sync for cross-device access

## License

MIT License - feel free to use this project as a starting point for your own subscription tracker!
