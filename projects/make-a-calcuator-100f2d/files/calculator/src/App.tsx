import Calculator from './components/Calculator'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <Calculator />
      <footer className="app__footer">
        <a href="#" onClick={(e) => e.preventDefault()}>
          Keyboard shortcuts: 0-9 . + - * / Enter Esc %
        </a>
      </footer>
    </main>
  )
}
