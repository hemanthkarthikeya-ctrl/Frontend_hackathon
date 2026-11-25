import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const res = signup(form);
    if (res.ok) navigate('/dashboard');
    else setError(res.error);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-mark">PM</div>
        <h1>Create your account</h1>
        <p className="auth-sub">Takes 10 seconds. Everything stays in your browser.</p>
        <form onSubmit={onSubmit}>
          {error && <p className="error-msg" role="alert">{error}</p>}
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required value={form.name}
              onChange={onChange} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email}
              onChange={onChange} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required value={form.password}
              onChange={onChange} autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" required value={form.confirm}
              onChange={onChange} autoComplete="new-password" />
          </div>
          <button className="btn block" type="submit">Sign up</button>
          <p className="form-foot">Already have an account? <Link to="/">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}