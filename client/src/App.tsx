import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import WorkoutLog from './components/WorkoutLog';
import CardioTracker from './components/CardioTracker';
import BodyMetrics from './components/BodyMetrics';
import NutritionTracker from './components/NutritionTracker';
import ProgressPhotos from './components/ProgressPhotos';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<div className="text-center mt-10"><h2 className="text-2xl font-bold">Welcome to FitTrack</h2><p>Select a module to get started.</p></div>} />
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

export default App
