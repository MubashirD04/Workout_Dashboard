import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import WorkoutLog from './pages/WorkoutLog';
import CardioTracker from './pages/CardioTracker';
import BodyMetrics from './pages/BodyMetrics';
import NutritionTracker from './pages/NutritionTracker';
import ProgressPhotos from './pages/ProgressPhotos';
import DashboardHome from './pages/DashboardHome';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/workouts" element={<WorkoutLog />} />
          <Route path="/cardio" element={<CardioTracker />} />
          <Route path="/metrics" element={<BodyMetrics />} />
          <Route path="/nutrition" element={<NutritionTracker />} />
          <Route path="/photos" element={<ProgressPhotos />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
