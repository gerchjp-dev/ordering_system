import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TablesScreen from './pages/TablesScreen'
import MenuScreen from './pages/MenuScreen'
import OrderScreen from './pages/OrderScreen'
import PaymentScreen from './pages/PaymentScreen'
import OrderHistoryScreen from './pages/OrderHistoryScreen'
import AnalyticsScreen from './pages/AnalyticsScreen'
import CalendarScreen from './pages/CalendarScreen'
import SettingsScreen from './pages/SettingsScreen'
import NotFoundScreen from './pages/NotFoundScreen'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<TablesScreen />} />
        <Route path="/menu" element={<MenuScreen />} />
        <Route path="/order" element={<OrderScreen />} />
        <Route path="/payment" element={<PaymentScreen />} />
        <Route path="/order-history" element={<OrderHistoryScreen />} />
        <Route path="/analytics" element={<AnalyticsScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/404" element={<NotFoundScreen />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  )
}

export default App