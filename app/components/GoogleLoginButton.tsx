import { signIn } from 'next-auth/react';

export function GoogleLoginButton() {
  const handleSignIn = async () => {
    try {
      const result = await signIn('google', { callbackUrl: '/', redirect: false });
      console.log('Sign-in result:', result);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="lk-button"
    >
      Sign in with Google
    </button>
  );
}
