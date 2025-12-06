# LEAGO - Car Rental Management System

A comprehensive, full-featured car rental management and booking platform built with React, TypeScript, and Supabase. Designed for managing multi-branch car rental operations with complete booking, payment processing, and inventory management capabilities.

## Features

### Admin Dashboard
- **User Management** - Create, update, and manage users with role-based access control
- **Car Inventory** - Full CRUD operations for cars, brands, models, and colors
- **Branch Management** - Multi-branch support with geolocation and working hours
- **Booking Management** - View, approve, and manage all bookings system-wide
- **Payment Tracking** - Monitor payments with Moyasar payment gateway integration
- **Document Verification** - Review and approve customer documents (ID, driving license)
- **Announcements** - Create global or branch-specific announcements
- **Analytics & Reports** - Dashboard with key metrics and data visualization

### Branch Manager Dashboard
- **Branch Cars** - Manage cars assigned to the branch
- **Branch Bookings** - Handle bookings for the specific branch
- **Staff Management** - Manage branch employees and roles
- **Branch Reports** - View branch-specific analytics
- **Notifications** - Send and receive branch notifications

### Authentication & Security
- Role-based access control (Admin, Branch Manager, Branch Employee, Customer)
- Protected routes with role verification
- Secure session management with JWT tokens
- Row-level security (RLS) policies on database

### Additional Features
- Bilingual support (Arabic/English)
- Dark mode support
- Responsive design (mobile and desktop)
- Real-time updates
- Geolocation with maps integration

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first styling |
| shadcn/ui | Component library |
| React Query | Server state management |
| React Router | Client-side routing |
| React Hook Form + Zod | Form handling and validation |
| Recharts | Data visualization |
| Leaflet / MapBox | Maps and geolocation |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Database |
| PostGIS | Geospatial data |
| Supabase Edge Functions | Serverless functions |
| Moyasar | Payment processing |

## Project Structure

```
carrental-db-core/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/           # Admin-specific components
│   │   ├── branch/          # Branch-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/        # Supabase client and types
│   ├── layouts/             # Page layouts
│   ├── lib/                 # Utilities and helpers
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin dashboard pages
│   │   └── branch/          # Branch dashboard pages
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Entry point
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── create-payment/  # Payment creation
│   │   ├── check-payment-status/
│   │   └── create-user/     # User creation
│   └── migrations/          # Database migrations
├── public/                  # Static assets
└── index.html               # HTML entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ (with npm or Bun)
- Supabase account and project
- Moyasar account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carrental-db-core
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with roles and branch assignments |
| `user_roles` | Role assignments and permissions |
| `branches` | Rental branch locations and configuration |
| `cars` | Car inventory with specifications |
| `car_brands` | Car manufacturers |
| `car_models` | Car models |
| `car_colors` | Available colors |
| `bookings` | Rental booking records |
| `payments` | Payment transactions |
| `documents` | Customer verification documents |
| `notifications` | System notifications |
| `announcements` | Global/branch announcements |
| `audit_log` | Activity tracking |

### Enums

```sql
-- User roles
user_role: 'admin', 'branch', 'branch_employee', 'customer'

-- Booking status
booking_status: 'pending', 'confirmed', 'payment_pending', 'active', 'completed', 'cancelled', 'expired'

-- Car status
car_status: 'available', 'rented', 'maintenance', 'hidden'

-- Document status
document_status: 'pending', 'approved', 'rejected'
```

## API Routes

### Frontend Routes

**Public**
- `/login` - User login
- `/register` - User registration

**Admin** (requires `admin` role)
- `/admin` - Dashboard home
- `/admin/users` - User management
- `/admin/cars` - Car inventory
- `/admin/bookings` - All bookings
- `/admin/branches` - Branch management
- `/admin/payments` - Payment tracking
- `/admin/reports` - Analytics

**Branch** (requires `branch` or `branch_employee` role)
- `/branch` - Branch dashboard
- `/branch/cars` - Branch cars
- `/branch/bookings` - Branch bookings
- `/branch/staff` - Staff management

### Edge Functions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/create-payment` | POST | Create payment with Moyasar |
| `/functions/v1/check-payment-status` | POST | Check payment status |
| `/functions/v1/create-user` | POST | Create new user (admin) |

## Role-Based Access Control

| Role | Access Level |
|------|--------------|
| `admin` | Full system access, manage all entities |
| `branch` | Branch manager, manage single branch |
| `branch_employee` | Limited access, handle bookings |
| `customer` | Customer portal, view bookings |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

For Edge Functions (configured in Supabase dashboard):
- `MOYASAR_SECRET_KEY` - Moyasar API secret key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

Built with React, TypeScript, and Supabase
