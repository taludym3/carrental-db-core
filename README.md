# ByteTransform

A comprehensive dashboard application for managing trainers and trainees. Built with React, TypeScript, and Supabase, providing a complete management system for training programs, bookings, payments, and user management.

## Features

### Admin Dashboard
- **User Management** - Manage trainers, trainees, and admin accounts with role-based access
- **Booking Management** - View, approve, and manage all training session bookings
- **Branch Management** - Multi-branch support with location tracking and working hours
- **Payment Tracking** - Monitor payments with Moyasar payment gateway integration
- **Document Verification** - Review and approve user documents (ID, certifications)
- **Announcements** - Create global or branch-specific announcements
- **Notifications** - Send notifications to users
- **Analytics & Reports** - Dashboard with key metrics and data visualization

### Branch Manager Dashboard
- **Staff Management** - Manage trainers and employees
- **Bookings** - Handle training session bookings
- **Reports** - View branch-specific analytics
- **Settings** - Configure branch preferences

### Authentication & Security
- Role-based access control (Admin, Branch Manager, Employee, Customer)
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
bytransform/
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
   cd bytransform
   ```

2. **Install dependencies**
   ```bash
   npm install
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
| `branches` | Branch locations and configuration |
| `bookings` | Training session bookings |
| `payments` | Payment transactions |
| `documents` | User verification documents |
| `notifications` | System notifications |
| `announcements` | Global/branch announcements |

### User Roles

| Role | Access Level |
|------|--------------|
| `admin` | Full system access |
| `branch` | Branch manager access |
| `branch_employee` | Limited branch access |
| `customer` | Trainee access |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

Built with React, TypeScript, and Supabase
