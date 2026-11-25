import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, saveUsers, loadPortfolio, savePortfolio, samplePortfolio } from '../utils/storage';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const res = login(form);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  const tryDemo = () => {
    const demoEmail = 'demo@portfoliomaker.dev';
    const demoPass = 'demo1234';
    const users = getUsers();
    if (!users.some((u) => u.email === demoEmail)) {
      saveUsers([...users, { name: 'Aarav Sharma', email: demoEmail, password: demoPass }]);
    }
    if (!loadPortfolio(demoEmail)) {
      savePortfolio(demoEmail, samplePortfolio('Aarav Sharma', demoEmail));
    }
    const res = login({ email: demoEmail, password: demoPass });
    if (res.ok) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-mark">PM</div>
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to craft and export your portfolio.</p>
        <form onSubmit={onSubmit}>
          {error && <p className="error-msg" role="alert">{error}</p>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required
              value={form.email} onChange={onChange} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required
              value={form.password} onChange={onChange} autoComplete="current-password" />
          </div>
          <button className="btn block" type="submit">Log in</button>
          <button className="btn secondary block" type="button" onClick={tryDemo}>
            Try demo portfolio
          </button>
          <p className="form-foot">No account? <Link to="/signup">Create one</Link></p>
        </form>
      </div>
    </div>
  );
}