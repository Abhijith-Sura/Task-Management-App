import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { VerifyOtp } from './VerifyOtp';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';

/**
 * Main authentication component that orchestrates different auth views.
 * Handles the state and transitions between login, registration, verification, and password recovery.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onAuthSuccess - Callback invoked when authentication is successful
 * @param {string} [props.initialView='login'] - The initial view to display ('login' | 'register' | 'verify' | 'forgot-password' | 'reset-password')
 * @param {string|null} [props.resetToken=null] - Optional token used for resetting password
 * @returns {React.ReactElement} The rendered authentication view based on current state
 */
export const Auth = ({ onAuthSuccess, initialView = 'login', resetToken = null }) => {
  const [view, setView] = useState(initialView); // 'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password'
  const [email, setEmail] = useState('');

  /**
   * Switches the view to the OTP verification screen and stores the target email
   * 
   * @param {string} targetEmail - The email address requiring verification
   */
  const handleVerificationRequired = (targetEmail) => {
    setEmail(targetEmail);
    setView('verify');
  };

  if (view === 'login') {
    return (
      <Login 
        onLoginSuccess={onAuthSuccess} 
        onSwitchToRegister={() => setView('register')} 
        onVerificationRequired={handleVerificationRequired}
        onSwitchToForgotPassword={() => setView('forgot-password')}
      />
    );
  }

  if (view === 'verify') {
    return (
      <VerifyOtp 
        email={email}
        onVerificationSuccess={onAuthSuccess}
        onSwitchToLogin={() => setView('login')}
      />
    );
  }

  if (view === 'forgot-password') {
    return (
      <ForgotPassword onSwitchToLogin={() => setView('login')} />
    );
  }

  if (view === 'reset-password') {
    return (
      <ResetPassword 
        token={resetToken} 
        onSwitchToLogin={() => setView('login')} 
      />
    );
  }

  return (
    <Register 
      onRegisterSuccess={onAuthSuccess} 
      onSwitchToLogin={() => setView('login')} 
      onVerificationRequired={handleVerificationRequired}
    />
  );
};
