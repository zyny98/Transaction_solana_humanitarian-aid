import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import {
  getPhantomProvider,
  PhantomProvider,
  fetchSolBalance,
  formatAddress,
  getSolanaConnection,
} from '../lib/solana/phantom';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  hasPhantom: boolean;
  publicKey: PublicKey | null;
  walletAddress: string;
  formattedAddress: string;
  balance: number | null;
  isLoadingBalance: boolean;
  error: string | null;
  isDemoMode: boolean;
}

const DEMO_WALLET_PUBKEY = 'DevNetAidChainDemoWallet777777777777777777';

export function usePhantomWallet() {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [hasPhantom, setHasPhantom] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('aidchain_demo_wallet') === 'true';
  });

  // Detect Phantom
  useEffect(() => {
    const checkPhantom = () => {
      const p = getPhantomProvider();
      if (p) {
        setProvider(p);
        setHasPhantom(true);

        // Auto-connect if already authorized
        if (p.isConnected && p.publicKey) {
          setIsConnected(true);
          setPublicKey(p.publicKey);
          updateBalance(p.publicKey);
        }
      } else {
        setHasPhantom(false);
      }
    };

    checkPhantom();
    const timer = setTimeout(checkPhantom, 500);
    return () => clearTimeout(timer);
  }, []);

  const updateBalance = useCallback(async (pubkey: PublicKey) => {
    setIsLoadingBalance(true);
    try {
      const sol = await fetchSolBalance(pubkey);
      setBalance(sol);
    } catch {
      setBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (isDemoMode) {
      setBalance((prev) => (prev !== null ? prev : 4.85));
      return;
    }
    if (publicKey) {
      await updateBalance(publicKey);
    }
  }, [publicKey, updateBalance, isDemoMode]);

  const connect = useCallback(async () => {
    setError(null);
    const p = getPhantomProvider();

    if (!p) {
      setHasPhantom(false);
      setError('Phantom не найден. Откройте приложение в отдельной вкладке с установленным Phantom');
      return;
    }

    try {
      setIsConnecting(true);
      const resp = await p.connect();
      setProvider(p);
      setPublicKey(resp.publicKey);
      setIsConnected(true);
      setIsDemoMode(false);
      localStorage.removeItem('aidchain_demo_wallet');
      await updateBalance(resp.publicKey);
    } catch (err: any) {
      console.error('Phantom connection error:', err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        setError('Подключение отменено пользователем в Phantom');
      } else {
        setError(err?.message || 'Не удалось подключиться к Phantom кошельку');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  const disconnect = useCallback(async () => {
    try {
      if (provider) {
        await provider.disconnect();
      }
    } catch (err) {
      console.warn('Disconnect error:', err);
    } finally {
      setIsConnected(false);
      setPublicKey(null);
      setBalance(null);
      setIsDemoMode(false);
      localStorage.removeItem('aidchain_demo_wallet');
    }
  }, [provider]);

  // Demo Devnet Wallet for instant review / testing if extension isn't loaded in iframe
  const connectDemoWallet = useCallback(() => {
    try {
      const demoKey = new PublicKey('AidChnDevnetEscrow111111111111111111111111111');
      setPublicKey(demoKey);
      setIsConnected(true);
      setIsDemoMode(true);
      setBalance(8.45);
      setError(null);
      localStorage.setItem('aidchain_demo_wallet', 'true');
    } catch {
      // Fallback
    }
  }, []);

  // Listen to phantom provider events
  useEffect(() => {
    if (!provider) return;

    const handleConnect = (pubkey: PublicKey) => {
      setIsConnected(true);
      setPublicKey(pubkey);
      updateBalance(pubkey);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setPublicKey(null);
      setBalance(null);
    };

    const handleAccountChange = (newPubkey: PublicKey | null) => {
      if (newPubkey) {
        setPublicKey(newPubkey);
        updateBalance(newPubkey);
      } else {
        handleDisconnect();
      }
    };

    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
    provider.on('accountChanged', handleAccountChange);

    return () => {
      try {
        provider.off('connect', handleConnect);
        provider.off('disconnect', handleDisconnect);
        provider.off('accountChanged', handleAccountChange);
      } catch {
        // ignore
      }
    };
  }, [provider, updateBalance]);

  const walletAddress = publicKey ? publicKey.toBase58() : '';
  const formattedAddress = formatAddress(publicKey);

  return {
    provider,
    hasPhantom,
    isConnected,
    isConnecting,
    publicKey,
    walletAddress,
    formattedAddress,
    balance,
    isLoadingBalance,
    error,
    isDemoMode,
    connect,
    disconnect,
    refreshBalance,
    connectDemoWallet,
  };
}
