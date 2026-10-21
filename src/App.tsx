import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Círculo de Quintas</h1>
      </header>
      <main className="app-layout">
        <section className="panel panel-circle" aria-label="Círculo de quintas" />
        <section className="panel panel-modes" aria-label="Modos" />
        <section className="panel panel-chord" aria-label="Acorde seleccionado" />
      </main>
    </div>
  )
}

export default App
