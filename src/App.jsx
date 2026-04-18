import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookingApp from "./booking-app";   // ← tu app de clientes
import AdminPanel from "./AdminPanel";     // ← el panel admin

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<BookingApp />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}