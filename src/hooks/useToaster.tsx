import { toast } from 'react-toastify';
import { useRef, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

interface ToastOptions {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  autoClose?: number | false;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
}

interface AuthStatus {
  status: 'authenticating' | 'authenticated' | 'unauthenticated';
  error?: Error;
  isLogout?: boolean;
}

interface WalletStatus {
  isLoading: boolean;
  error?: string | null;
  publicKey?: string | null;
}

export const useToaster = (customOptions?: ToastOptions) => {
  const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...customOptions
  };

  const authToastId = useRef<string | number | null>(null);
  const walletToastId = useRef<string | number | null>(null);
  const publicKeyToastId = useRef<string | number | null>(null);
  const isLogoutInProgress = useRef<boolean>(false);

  const showLoading = (message: string, duration?: number | false) => {
    return toast.loading(message, {
      ...defaultOptions,
      autoClose: duration
    });
  };

  const showSuccess = (message: string) => {
    return toast.success(message, defaultOptions);
  };

  const showError = (message: string) => {
    return toast.error(message, defaultOptions);
  };

  const updateToast = (toastId: string | number, message: string, type: 'success' | 'error', autoClose?: number | false) => {
    if (toastId) {
      toast.update(toastId, {
        render: message,
        type: type,
        isLoading: false,
        autoClose: autoClose !== undefined ? autoClose : defaultOptions.autoClose,
        ...defaultOptions
      });
    }
  };

  const dismissToast = (toastId: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  // Handle authentication status changes
  const handleAuthStatus = (authStatus: AuthStatus) => {
    // Set logout flag when unauthenticated with isLogout true
    if (authStatus.status === 'unauthenticated' && authStatus.isLogout) {
      isLogoutInProgress.current = true;
    }

    if (authStatus.status === 'authenticating') {
      // Create auth toast if it doesn't exist
      if (!authToastId.current) {
        authToastId.current = showLoading('Authenticating with Civic...', false);
      }
    } else if (authStatus.status === 'authenticated') {
      // Update auth toast if it exists
      if (authToastId.current) {
        updateToast(authToastId.current, 'Successfully authenticated!', 'success');
        authToastId.current = null;
      }
      // Reset logout flag
      isLogoutInProgress.current = false;
    } else if (authStatus.status === 'unauthenticated') {
      // Update auth toast if it exists
      if (authToastId.current) {
        if (authStatus.error) {
          updateToast(authToastId.current, `Authentication failed: ${authStatus.error.message}`, 'error');
        } else if (authStatus.isLogout) {
          updateToast(authToastId.current, 'Logged out successfully', 'success');
        }
        authToastId.current = null;
      } else if (authStatus.isLogout) {
        // Show logout success if there was no auth toast
        showSuccess('Logged out successfully');
      }
    }
  };

  // Handle wallet status changes
  const handleWalletStatus = (walletStatus: WalletStatus, isNewWallet?: boolean) => {
    // Skip wallet toast notifications during logout
    if (isLogoutInProgress.current) {
      return;
    }

    if (walletStatus.isLoading && !walletToastId.current) {
      walletToastId.current = showLoading('Loading your wallet...', false);
    } else if (!walletStatus.isLoading && walletToastId.current) {
      if (walletStatus.error) {
        updateToast(walletToastId.current, `Wallet error: ${walletStatus.error}`, 'error');
      } else if (walletStatus.publicKey) {
        if (isNewWallet) {
          updateToast(walletToastId.current, 'Wallet created successfully!', 'success');
        } else {
          updateToast(walletToastId.current, 'Wallet loaded successfully!', 'success');
        }
      }
      walletToastId.current = null;
    }
  };

  // Handle public key fetching
  const handlePublicKeyStatus = (publicKey: string | null, isLoading: boolean, error?: string | null) => {
    // Skip public key toast notifications during logout
    if (isLogoutInProgress.current) {
      return;
    }
    
    if (isLoading && !publicKeyToastId.current) {
      publicKeyToastId.current = showLoading('Fetching your public key...', false);
    } else if (!isLoading && publicKeyToastId.current) {
      if (error) {
        updateToast(publicKeyToastId.current, `Failed to fetch public key: ${error}`, 'error');
      } else if (publicKey) {
        updateToast(publicKeyToastId.current, 'Public key fetched successfully!', 'success');
      } else {
        updateToast(publicKeyToastId.current, 'Failed to fetch public key', 'error');
      }
      publicKeyToastId.current = null;
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (authToastId.current) dismissToast(authToastId.current);
    if (walletToastId.current) dismissToast(walletToastId.current);
    if (publicKeyToastId.current) dismissToast(publicKeyToastId.current);
    
    authToastId.current = null;
    walletToastId.current = null;
    publicKeyToastId.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, []);

  return {
    handleAuthStatus,
    handleWalletStatus,
    handlePublicKeyStatus,
    showLoading,
    showSuccess,
    showError,
    updateToast,
    dismissToast,
    cleanup
  };
};