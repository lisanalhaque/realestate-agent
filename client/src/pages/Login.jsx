import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Home, Mail, Lock, User } from 'lucide-react';
import styles from './Login.module.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, verifyOtp, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isForgotPassword) {
      if (!email) {
        setError('Email address is required');
        setLoading(false); return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false); return;
      }

      if (!forgotOtpSent) {
        const result = await forgotPassword(email);
        if (result.success) {
          setForgotOtpSent(true);
          setError(result.message || 'OTP sent successfully!');
        } else {
          setError(result.error);
        }
      } else {
        if (!otp || !password || !confirmPassword) {
          setError('All fields are required');
          setLoading(false); return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false); return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false); return;
        }
        const result = await resetPassword(email, otp, password);
        if (result.success) {
          setIsForgotPassword(false);
          setForgotOtpSent(false);
          setOtp('');
          setPassword('');
          setConfirmPassword('');
          setError('Password reset successful. You may now log in.');
        } else {
          setError(result.error);
        }
      }
    } else if (showOtp) {
      if (!otp) {
        setError('Please enter the OTP');
        setLoading(false); return;
      }
      const result = await verifyOtp(email, otp);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } else if (isLogin) {
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false); return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false); return;
      }
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        setError('Please fill in all required fields');
        setLoading(false); return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false); return;
      }
      if (phone && !/^\d{10}$/.test(phone)) {
        setError('Phone number must be exactly 10 digits');
        setLoading(false); return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false); return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false); return;
      }

      const result = await register({ name, phone, email, password, role });
      if (result.success) {
        setShowOtp(true);
        setError(result.message || 'OTP sent successfully!');
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setForgotOtpSent(false);
    setError('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotOtpSent(false);
    setError('');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.loginLogo}>
            <Home size={32} />
          </div>
          <h2 className={styles.loginTitle}>BoomAgent</h2>
          <p className={styles.loginSubtitle}>
            {isForgotPassword 
              ? 'Reset your password securely' 
              : isLogin ? 'Sign in to manage your real estate business' : 'Create an account to get started'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          {!isForgotPassword && showOtp ? (
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter 6-digit OTP sent to {email}</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="otp"
                  type="text"
                  className="form-control form-control-with-icon"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
            </div>
          ) : !isForgotPassword ? (
            <>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div className="input-icon-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        id="name"
                        type="text"
                        className="form-control form-control-with-icon"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number (Optional)</label>
                    <div className="input-icon-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        id="phone"
                        type="tel"
                        className="form-control form-control-with-icon"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="role">Sign up as</label>
                    <select
                      id="role"
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="user">User (Browse & Buy properties)</option>
                      <option value="broker">Broker (List & Sell properties)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    id="email"
                    type="email"
                    className="form-control form-control-with-icon"
                    placeholder="agent@boom.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    id="password"
                    type="password"
                    className="form-control form-control-with-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-icon-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      id="confirmPassword"
                      type="password"
                      className="form-control form-control-with-icon"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : null}
          {isForgotPassword && (
            <>
              {!forgotOtpSent ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="emailReset">Enter your Email Address</label>
                  <div className="input-icon-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      id="emailReset"
                      type="email"
                      className="form-control form-control-with-icon"
                      placeholder="agent@boom.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="resetOtp">Enter 6-digit OTP sent to {email}</label>
                    <div className="input-icon-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        id="resetOtp"
                        type="text"
                        className="form-control form-control-with-icon"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">New Password</label>
                    <div className="input-icon-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        id="newPassword"
                        type="password"
                        className="form-control form-control-with-icon"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmResetPassword">Confirm New Password</label>
                    <div className="input-icon-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        id="confirmResetPassword"
                        type="password"
                        className="form-control form-control-with-icon"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Processing...' : (
              isForgotPassword ? (forgotOtpSent ? 'Reset Password' : 'Send OTP') 
              : showOtp ? 'Verify OTP' 
              : isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          {!showOtp && !isForgotPassword && (
            <div className={styles.toggleContainer}>
              <div style={{ marginBottom: '1rem' }}>
                <button type="button" onClick={toggleForgotPassword} className={styles.toggleBtn}>
                  Forgot Password?
                </button>
              </div>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button type="button" onClick={toggleMode} className={styles.toggleBtn}>
                {isLogin ? 'Register Now' : 'Sign in here'}
              </button>
            </div>
          )}

          {isForgotPassword && (
            <div className={styles.toggleContainer}>
              <button type="button" onClick={() => setIsForgotPassword(false)} className={styles.toggleBtn}>
                Back to Sign in
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
