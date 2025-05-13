import { UserButton, useUser } from "@civic/auth-web3/react";
import { useEffect, useState } from "react";
import { useWalletContext } from "../hooks/useWalletContext";
import { useToaster } from "../hooks/useToaster";
import { ToastContainer } from 'react-toastify';

const LandingPage = () => {
  const { user, authStatus, error: authError } = useUser();
  const { publicKey, balance, isLoading, error: walletError, createWallet } = useWalletContext();
  const [isPublicKeyLoading, setIsPublicKeyLoading] = useState(false);
  const { handleAuthStatus, handleWalletStatus, handlePublicKeyStatus } = useToaster();

  // Handle authentication status
  useEffect(() => {
    handleAuthStatus({
      status: authStatus as 'authenticating' | 'authenticated' | 'unauthenticated',
      error: authError || undefined
    });
  }, [authStatus, authError]);

  // Handle wallet creation
  useEffect(() => {
    handleWalletStatus({
      isLoading,
      error: walletError,
      publicKey
    });
  }, [isLoading, walletError, publicKey]);

  // Handle public key fetching
  useEffect(() => {
    if (user && !publicKey) {
      setIsPublicKeyLoading(true);
    } else if (publicKey) {
      setIsPublicKeyLoading(false);
    }
  }, [user, publicKey]);

  useEffect(() => {
    handlePublicKeyStatus(publicKey, isPublicKeyLoading);
  }, [publicKey, isPublicKeyLoading]);

  // Handle wallet creation when user is authenticated
  useEffect(() => {
    if (user && !publicKey && !isLoading) {
      createWallet();
    }
  }, [user, publicKey, isLoading]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <ToastContainer />
      <div style={{ marginTop: '20px' }}>
        {authStatus === 'authenticating' || isLoading || isPublicKeyLoading ? (
          <div>
            <p>Authenticating...</p>
            <div style={{ margin: '20px auto' }}>
              {isLoading ? 'Setting up your wallet...' : 
               isPublicKeyLoading ? 'Fetching your public key...' :
               'Please wait while we connect to Civic Auth...'}
            </div>
          </div>
        ) : user ? (
          <div>
            <p>Welcome, {user.name || 'User'}!</p>
            <div style={{ margin: '20px 0' }}>
              {publicKey ? (
                <>
                  <p style={{ wordBreak: 'break-all' }}>Wallet Address: {publicKey}</p>
                  <p>Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}</p>
                </>
              ) : (
                <p>Creating your wallet...</p>
              )}
            </div>
            <UserButton />
          </div>
        ) : (
          <div>
            <p>Please sign in to continue</p>
            <UserButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
