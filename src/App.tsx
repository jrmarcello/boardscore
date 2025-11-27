import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage, RoomPage } from './pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sala/:roomId" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
