import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { VerifyOtp } from './VerifyOtp';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';

export const Auth = ({ onAuthSuccess, initialView = 'login', resetToken = null }) => {
  const [view, setView] = useState(initialView); // 'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password'
  const [email, setEmail] = useState('');

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
