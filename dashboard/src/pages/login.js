import React, { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'devsecops') {
      // In a real app, would set auth state
      window.location.href = '/dashboard';
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;