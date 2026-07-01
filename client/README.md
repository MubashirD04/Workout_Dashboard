# Fitness Dashboard — Client

The frontend application for the Fitness Dashboard, built with React and Vite.

## Tech Stack

- **React 19**: UI library
- **TypeScript**: Typed development experience
- **Vite**: Build tool and dev server
- **Tailwind CSS v4**: Utility-first styling (theme tokens in `src/index.css`)
- **Recharts**: Data visualization
- **React Router v7**: Client-side routing
- **Clerk**: Authentication (`@clerk/clerk-react`)
- **Convex React SDK**: Real-time data (`useQuery`, `useMutation`, `useAction`, `usePaginatedQuery`)

## Getting Started

### Prerequisites

Create `client/.env.local`:

```bash
VITE_CONVEX_URL=<your-convex-deployment-url>
VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
```

### Installation

```bash
npm install
```

### Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Builds the application for production
- `npm run lint`: Runs ESLint for code quality
- `npm run preview`: Previews the production build locally

## Routes

| Path | Page | Access |
|---|---|---|
| `/` | Dashboard Home | All authenticated users |
| `/workouts` | Workout Log | All |
| `/cardio` | Cardio Tracker | All |
| `/metrics` | Body Metrics | All |
| `/nutrition` | Nutrition Tracker | All |
| `/photos` | Progress Photos | Clients only (trainers blocked) |
| `/clients` | Trainer client list | Trainer, admin |
| `/clients/:clientId` | Client detail view | Trainer, admin |
| `/admin` | Admin panel | Admin |
| `/invite/:code` | Claim trainer invite | Unauthenticated / new clients |

## Features & Components

- **Dashboard Home**: Overview of recent activities with key statistics
- **Workout Log**: Exercise management with set-by-set tracking
- **Cardio Tracker**: Activity logging for runs, cycles, and more
- **Body Metrics**: Historical tracking of weight and body measurements
- **Nutrition Tracker**: Daily log for calories and macros with visual donut chart
- **Progress Photos**: Visual diary of physical transformation
- **AI Fitness Coach**: Floating chat interface (RAG-powered) for personalized advice
- **Admin Panel**: User role management and trainer–client assignment
- **Trainer Portal**: Client list and per-client fitness data views

### Data Visualizations

- **VolumeLineChart**: Strength volume over time
- **ConsistencyHeatmap**: Active days visualization
- **AthleteRadarChart**: Multi-dimensional performance metrics
- **MacroDonutChart**: Visual macro breakdown
- **WorkoutMaxWeightChart**: Track max weight progress for individual exercises
- **CardioProgressChart**: Cardio activity trends

### Key Hooks & Components

- **`useCurrentUser`**: Resolves the authenticated Convex user and role flags (`isAdmin`, `canViewClients`)
- **`UserSync`**: Upserts Clerk identity into the Convex `users` table on sign-in
- **`DashboardLayout`**: Shell with role-aware navigation and floating AI chat

## Configuration

Styling uses Tailwind CSS v4 with custom theme tokens defined in `src/index.css` via the `@theme` directive. PostCSS config is in `postcss.config.js`.

The app connects directly to Convex (no REST proxy). Legacy wrappers in `src/api/` exist for a few chart components but new code should use Convex React hooks directly.
