import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: Transaction,
    options?: { minContextSlot?: number }
  ) => Promise<{ signature: string }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;

  const anyWindow = window as any;
  if ('phantom' in anyWindow && anyWindow.phantom?.solana?.isPhantom) {
    return anyWindow.phantom.solana;
  }
  if ('solana' in anyWindow && anyWindow.solana?.isPhantom) {
    return anyWindow.solana;
  }
  return null;
}

export function getSolanaConnection(): Connection {
  return new Connection(SOLANA_DEVNET_RPC, 'confirmed');
}

export function formatAddress(address: string | PublicKey | null): string {
  if (!address) return '';
  const str = typeof address === 'string' ? address : address.toBase58();
  if (str.length <= 8) return str;
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

export function getExplorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export async function fetchSolBalance(publicKey: PublicKey, connection?: Connection): Promise<number> {
  try {
    const conn = connection || getSolanaConnection();
    const lamports = await conn.getBalance(publicKey, 'confirmed');
    return lamports / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('Failed to fetch SOL balance:', err);
    return 0;
  }
}

export interface SendMemoResult {
  signature: string;
  explorerUrl: string;
}

export async function sendSolanaMemoTransaction(
  provider: PhantomProvider,
  memoText: string,
  connection?: Connection
): Promise<SendMemoResult> {
  if (!provider.publicKey) {
    throw new Error('Кошелек не подключен');
  }

  const conn = connection || getSolanaConnection();
  const payer = provider.publicKey;

  // STRICT requirement: use new TextEncoder().encode(memoText), NO Buffer
  const encodedData = new TextEncoder().encode(memoText);

  const memoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: payer,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: MEMO_PROGRAM_ID,
    data: encodedData as unknown as any,
  });

  const transaction = new Transaction().add(memoInstruction);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;

  try {
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Wait for confirmation
    await conn.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    return {
      signature,
      explorerUrl: getExplorerTxUrl(signature),
    };
  } catch (err: any) {
    const message = err?.message || '';
    if (message.includes('User rejected') || err?.code === 4001) {
      throw new Error('Транзакция отменена в кошельке');
    }
    if (message.includes('insufficient funds') || message.includes('Attempt to debit an account but found no record of a prior credit')) {
      throw new Error('Недостаточно SOL на балансе devnet для оплаты комиссии');
    }
    throw new Error(err?.message || 'Ошибка отправки транзакции в Solana Devnet');
  }
}
