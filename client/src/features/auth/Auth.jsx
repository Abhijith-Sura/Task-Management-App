import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { VerifyOtp } from './VerifyOtp';

export const Auth = ({ onAuthSuccess }) => {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'verify'
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

  return (
    <Register 
      onRegisterSuccess={onAuthSuccess} 
      onSwitchToLogin={() => setView('login')} 
      onVerificationRequired={handleVerificationRequired}
    />
  );
};
