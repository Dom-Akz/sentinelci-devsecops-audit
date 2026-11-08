import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/login';
import Dashboard from '../pages/dashboard';

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          loggedIn ? <Dashboard /> : <Login />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/logout">
          <button onClick={() => window.location.reload()}>
            Logout
        </button>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;