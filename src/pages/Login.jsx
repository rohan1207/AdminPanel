import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Helper to call backend API. Adjust base path if your frontend proxies to backend.
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error || json.message || text || 'Request failed');
    return json;
  } catch (err) {
    if (res.ok) return {};
    throw err;
  }
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
  // Backend mounts admin routes at /api/admin (see Backend/server.js)
  const data = await postJson('/api/admin/login', { username, password });
      // store token and username locally (consider using httpOnly cookie from backend for better security)
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.username);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm border-t-4 border-brand"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-brand">Admin Login</h2>
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full ${loading ? 'bg-brand-300' : 'bg-brand hover:bg-brand-700'} text-white py-2 rounded-md`}
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
