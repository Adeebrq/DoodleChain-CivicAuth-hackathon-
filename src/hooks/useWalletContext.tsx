import { useState, useEffect } from 'react';
import { userHasWallet } from "@civic/auth-web3";
import { useUser } from "@civic/auth-web3/react";
import { Connection, PublicKey } from '@solana/web3.js';

// Define types for wallet context
interface WalletContextState {
  publicKey: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  createWallet: () => Promise<void>;
}

interface SolanaWallet {
  solana: {
    address: string;
    wallet: {
      publicKey: PublicKey;
    };
  };
}

const SOLANA_RPC_ENDPOINT = "https://api.devnet.solana.com"; // Using devnet for development

export const useWalletContext = (): WalletContextState => {
  const userContext = useUser();
  const { user } = userContext;
  
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Solana connection
  const connection = new Connection(SOLANA_RPC_ENDPOINT);

  // Function to create wallet
  const createWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (user && !userHasWallet(userContext)) {
        await userContext.createWallet();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      console.error('Wallet creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch balance
  const fetchBalance = async (pubKey: PublicKey) => {
    try {
      const walletBalance = await connection.getBalance(pubKey);
      setBalance(walletBalance / 1e9); // Convert lamports to SOL
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    }
  };

  // Effect to handle wallet state updates
  useEffect(() => {
    const updateWalletState = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (user && userHasWallet(userContext)) {
          const walletContext = userContext as unknown as SolanaWallet;
          if (walletContext.solana?.wallet?.publicKey) {
            const pubKey = walletContext.solana.wallet.publicKey;
            setPublicKey(pubKey.toString());
            await fetchBalance(pubKey);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update wallet state');
        console.error('Wallet state update error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    updateWalletState();
  }, [user, userContext]);

  return {
    publicKey,
    balance,
    isLoading,
    error,
    createWallet
  };
}; 