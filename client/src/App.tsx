import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell.js';
import { Today } from './pages/Today.js';
import { Play } from './pages/Play.js';
import { Progress } from './pages/Progress.js';
import { Settings } from './pages/Settings.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Today />} />
          <Route path="/play/:game" element={<Play />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
