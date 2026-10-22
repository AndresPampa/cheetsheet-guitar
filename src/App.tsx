import './App.css'
import { toneAudio } from './audio/index.ts'
import { KeyExplorer } from './ui/KeyExplorer.tsx'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Círculo de Quintas</h1>
      </header>
      <KeyExplorer audio={toneAudio} />
    </div>
  )
}

export default App
