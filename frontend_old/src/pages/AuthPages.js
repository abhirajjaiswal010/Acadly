import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Eye, EyeOff, GraduationCap, Rocket, Mail, Lock, 
  User, ShieldCheck, Users, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { loginUser, registerUser } from '../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (!result.error) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={32} strokeWidth={2} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your LearnLive account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Mail size={14} />
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Lock size={14} />
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                }}
              />
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Sign In Safely</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="flex items-center gap-1 justify-center">
            Create one free <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 items-start">
          <CheckCircle2 size={16} className="text-primary mt-0.5" />
          <p className="text-[0.78rem] text-muted leading-relaxed">
            <strong className="text-primary">Demo Hint:</strong> You can register as a Teacher to host classes or a Student to join them.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRoleSelect = (role) =>
    setForm((prev) => ({ ...prev, role }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (!result.error) navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Rocket size={32} strokeWidth={2} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the next generation of learning</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div className="role-selector">
              <div
                className={`role-option ${form.role === 'student' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('student')}
              >
                <div className="role-icon">
                  <Users size={20} />
                </div>
                <span className="role-name">Student</span>
              </div>
              <div
                className={`role-option ${form.role === 'teacher' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('teacher')}
              >
                <div className="role-icon">
                  <ShieldCheck size={20} />
                </div>
                <span className="role-name">Teacher</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <User size={14} />
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              name="name"
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Mail size={14} />
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Lock size={14} />
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="register-submit-btn"
          >
            {loading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                }}
              />
            ) : (
              <>
                <Rocket size={18} />
                <span>Get Started Now</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="flex items-center gap-1 justify-center">Sign in <ArrowRight size={14} /></Link>
        </div>
      </motion.div>
    </div>
  );
};
