import React, { useState } from 'react';
import Login from '../pages/login';
import Dashboard from '../pages/dashboard';

function App() {
  const [loggedIn, setLoggedIn] = React.useState(false);

  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => setLoggedIn(false);

  return (
    <div className="app">
      {loggedIn ? (
        <div>
          <h1>PF DevSecOps Dashboard</h1>
          <p>Welcome back!</p>
          <button onClick={handleLogout}>Logout</button>
          <Dashboard />
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;