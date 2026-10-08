import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { InterviewRoom } from './pages/InterviewRoom';
import { JobsDashboard } from './pages/JobsDashboard';

export function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<JobsDashboard />} />
          <Route path="/jobs/:id" element={<InterviewRoom />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
