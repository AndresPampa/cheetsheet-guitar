import './App.css'
import { toneAudio } from './audio/index.ts'
import { KeyExplorer } from './ui/KeyExplorer.tsx'
import { svguitarDiagram } from './ui/svguitarDiagram.ts'
import { loadVoicings } from './voicings/index.ts'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Círculo de Quintas</h1>
      </header>
      <KeyExplorer audio={toneAudio} voicings={loadVoicings} drawDiagram={svguitarDiagram} />
    </div>
  )
}

export default App
