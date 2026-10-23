import './App.css'
import { toneAudio } from './audio/index.ts'
import { AppShell } from './ui/AppShell.tsx'
import { svguitarDiagram } from './ui/svguitarDiagram.ts'
import { loadVoicings } from './voicings/index.ts'

function App() {
  return <AppShell audio={toneAudio} voicings={loadVoicings} drawDiagram={svguitarDiagram} />
}

export default App
