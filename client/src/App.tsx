import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import DashboardLayout from './components/DashboardLayout';
import WorkoutLog from './pages/WorkoutLog';
import CardioTracker from './pages/CardioTracker';
import BodyMetrics from './pages/BodyMetrics';
import NutritionTracker from './pages/NutritionTracker';
import ProgressPhotos from './pages/ProgressPhotos';
import DashboardHome from './pages/DashboardHome';
import AdminPanel from './pages/Admin/AdminPanel';
import ClientsView from './pages/Trainer/ClientsView';
import ClientDetail from './pages/Trainer/ClientDetail';
import ClaimInvite from './pages/Auth/ClaimInvite';

import { UserSync } from './components/UserSync';

function App() {
  return (
    <Router>
      <SignedIn>
        <UserSync />
        <DashboardLayout>
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
          </Routes>
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn/>
      </SignedOut>
    </Router>
  );
}

export default App;
