import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import WorkoutLog from './components/WorkoutLog';
import CardioTracker from './components/CardioTracker';
import BodyMetrics from './components/BodyMetrics';
import NutritionTracker from './components/NutritionTracker';
import ProgressPhotos from './components/ProgressPhotos';
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
