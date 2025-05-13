import { toast } from 'react-toastify';
import { useRef, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';

interface ToastOptions {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
}

interface AuthStatus {
  status: 'authenticating' | 'authenticated' | 'unauthenticated';
  error?: Error;
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

  const showLoading = (message: string) => {
    return toast.loading(message, {
      ...defaultOptions,
      autoClose: false
    });
  };

  const showSuccess = (message: string) => {
    return toast.success(message, defaultOptions);
  };

  const showError = (message: string) => {
    return toast.error(message, defaultOptions);
  };

  const updateToast = (toastId: string | number, message: string, type: 'success' | 'error') => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      ...defaultOptions
    });
  };

  const dismissToast = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  // Handle authentication status changes
  const handleAuthStatus = (authStatus: AuthStatus) => {
    if (authStatus.status === 'authenticating' && !authToastId.current) {
      authToastId.current = showLoading('Authenticating with Civic...');
    } else if (authStatus.status === 'authenticated' && authToastId.current) {
      updateToast(authToastId.current, 'Successfully authenticated!', 'success');
      authToastId.current = null;
    } else if (authStatus.status === 'unauthenticated' && authToastId.current) {
      if (authStatus.error) {
        updateToast(authToastId.current, `Authentication failed: ${authStatus.error.message}`, 'error');
      }
      authToastId.current = null;
    }
  };

  // Handle wallet status changes
  const handleWalletStatus = (walletStatus: WalletStatus) => {
    if (walletStatus.isLoading && !walletToastId.current) {
      walletToastId.current = showLoading('Creating your wallet...');
    } else if (!walletStatus.isLoading && walletToastId.current) {
      if (walletStatus.error) {
        updateToast(walletToastId.current, `Wallet creation failed: ${walletStatus.error}`, 'error');
      } else {
        updateToast(walletToastId.current, 'Wallet created successfully!', 'success');
      }
      walletToastId.current = null;
    }
  };

  // Handle public key fetching
  const handlePublicKeyStatus = (publicKey: string | null, isLoading: boolean) => {
    if (isLoading && !publicKeyToastId.current) {
      publicKeyToastId.current = showLoading('Fetching your public key...');
    } else if (!isLoading && publicKeyToastId.current) {
      if (publicKey) {
        updateToast(publicKeyToastId.current, 'Public key fetched successfully!', 'success');
      } else {
        updateToast(publicKeyToastId.current, 'Failed to fetch public key', 'error');
      }
      publicKeyToastId.current = null;
    }
  };

  // Cleanup function
  const cleanup = () => {
    [authToastId.current, walletToastId.current, publicKeyToastId.current].forEach(id => {
      if (id) dismissToast(id);
    });
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