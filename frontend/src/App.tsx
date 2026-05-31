import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthContextProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';

import DashboardLayout from './components/layout/DashboardLayout';

import { LoginPage } from './pages/LoginPage';

import { SignupPage } from './pages/SignupPage';

import { DashboardPage } from './pages/DashboardPage';

import { SearchPage } from './pages/SearchPage';

import { PropertyDetailsPage } from './pages/PropertyDetailsPage';

import { CalculatorPage } from './pages/CalculatorPage';

import { LeadsPage } from './pages/LeadsPage';



const App: React.FC = () => {

  return (

    <AuthContextProvider>

      <Router>

        <Routes>

          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />



          <Route element={<ProtectedRoute />}>

            <Route element={<DashboardLayout />}>

              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/search" element={<SearchPage />} />

              <Route path="/leads" element={<LeadsPage />} />

              <Route path="/calculator" element={<CalculatorPage />} />

              <Route path="/properties/:propertyId" element={<PropertyDetailsPage />} />

            </Route>

          </Route>



          <Route path="/" element={<Navigate to="/search" replace />} />

          <Route path="*" element={<Navigate to="/search" replace />} />

        </Routes>

      </Router>

    </AuthContextProvider>

  );

};



export default App;

