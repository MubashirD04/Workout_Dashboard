import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing';

import { UserSync } from './components/UserSync';
import { AthleteProfileGate } from './components/AthleteProfileGate';

const WorkoutLog = lazy(() => import('./pages/WorkoutLog'));
const CardioTracker = lazy(() => import('./pages/CardioTracker'));
const BodyMetrics = lazy(() => import('./pages/BodyMetrics'));
const NutritionTracker = lazy(() => import('./pages/NutritionTracker'));
const ProgressPhotos = lazy(() => import('./pages/ProgressPhotos'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel'));
const ClientsView = lazy(() => import('./pages/Trainer/ClientsView'));
const ClientDetail = lazy(() => import('./pages/Trainer/ClientDetail'));
const ClaimInvite = lazy(() => import('./pages/Auth/ClaimInvite'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Router>
      <SignedIn>
        <UserSync />
        <AthleteProfileGate>
          <DashboardLayout>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/workouts" element={<WorkoutLog />} />
                <Route path="/cardio" element={<CardioTracker />} />
                <Route path="/metrics" element={<BodyMetrics />} />
                <Route path="/nutrition" element={<NutritionTracker />} />
                <Route path="/photos" element={<ProgressPhotos />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/clients" element={<ClientsView />} />
                <Route path="/clients/:clientId" element={<ClientDetail />} />
                <Route path="/invite/:code" element={<ClaimInvite />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </DashboardLayout>
        </AthleteProfileGate>
      </SignedIn>
      <SignedOut>
        <Landing />
      </SignedOut>
    </Router>
  );
}

export default App;
