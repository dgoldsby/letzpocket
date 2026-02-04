import { useState } from 'react';

export function useSignInControl() {
  const [signInControl] = useState({
    enabled: true,
    message: ''
  });

  const isSignInDisabled = !signInControl.enabled;
  const disabledMessage = signInControl.message || 'Sign-in is currently disabled. Please try again later.';

  return {
    isSignInDisabled,
    disabledMessage,
    signInControl
  };
}
