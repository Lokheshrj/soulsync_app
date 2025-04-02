import { Routes, Route } from 'react-router-dom';
import Menu from './menu';
import TalkingHead from './TalkingHead';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/talking-head" element={<TalkingHead />} />
    </Routes>
  );
}

export default App;
