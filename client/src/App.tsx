import { useState } from 'react';
import { MachineVisualizationPage } from './features/machine-visualization/MachineVisualizationPage';
import { RtmsApp } from './features/rtms/RtmsApp';

type View = 'floor' | 'rtms';

export function App() {
  const [view, setView] = useState<View>('rtms');

  if (view === 'rtms') {
    return <RtmsApp onBackToFloor={() => setView('floor')} />;
  }

  return <MachineVisualizationPage onOpenRtms={() => setView('rtms')} />;
}

export default App;

