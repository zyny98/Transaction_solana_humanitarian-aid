import React, { useState } from 'react';
import {
  Wallet,
  LogOut,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Building2,
  Truck,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  HelpCircle,
} from 'lucide-react';
import { usePhantomWallet } from '../hooks/usePhantomWallet';
import { useSolanaMemo } from '../hooks/useSolanaMemo';
import { useAppStore } from '../lib/store/app-store';

export type UserRole = 'donor' | 'foundation' | 'vendor' | 'admin';

interface AppLayoutProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRole,
  onRoleChange,
  onNavigateHome,
  children,
}) => {
  const {
    hasPhantom,
    isConnected,
    isConnecting,
    formattedAddress,
    walletAddress,
    balance,
    isLoadingBalance,
    isDemoMode,
    error: walletError,
    connect,
    disconnect,
    refreshBalance,
    connectDemoWallet,
  } = usePhantomWallet();

  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [showNoPhantomModal, setShowNoPhantomModal] = useState(false);
  const { getHitlReceipts } = useAppStore();
  const hitlCount = getHitlReceipts().length;

  const handleConnectClick = () => {
    if (!hasPhantom) {
      setShowNoPhantomModal(true);
    } else {
      connect();
    }
  };

  const roles = [
    { id: 'donor' as UserRole, label: 'Донор', icon: Layers, path: '/app/donor' },
    { id: 'foundation' as UserRole, label: 'Фонд', icon: Building2, path: '/app/foundation' },
    { id: 'vendor' as UserRole, label: 'Поставщик', icon: Truck, path: '/app/vendor' },
    {
      id: 'admin' as UserRole,
      label: 'Администратор (HITL)',
      icon: UserCheck,
      path: '/app/admin',
      badge: hitlCount > 0 ? hitlCount : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#05060d] text-slate-100 flex flex-col font-sans selection:bg-[#4d8bff]/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#05060d]/90 backdrop-blur-md border-b border-[#141a33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Network */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 group text-left focus:outline-none"
              title="Перейти на главную страницу"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4d8bff] via-[#5ad1ff] to-[#8b6bff] flex items-center justify-center p-0.5 shadow-lg shadow-[#4d8bff]/20">
                <div className="w-full h-full bg-[#05060d] rounded-[6px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#5ad1ff] group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-base tracking-tight text-white">
                    AidChain
                  </span>
                  <span className="text-[10px] font-mono text-[#8b6bff] font-medium px-1.5 py-0.2 rounded bg-[#8b6bff]/10 border border-[#8b6bff]/20">
                    ClearGrant
                  </span>
                </div>
              </div>
            </button>

            {/* Solana Devnet Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0d1c] border border-[#1e2640] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium font-mono text-[11px]">
                Solana Devnet
              </span>
            </div>
          </div>

          {/* Role Navigation Segmented Control */}
          <nav className="hidden md:flex items-center p-1 rounded-lg bg-[#0a0d1c] border border-[#171d36]">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleChange(r.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'bg-[#182142] text-white shadow-sm border border-[#2d3b70]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5ad1ff]' : 'text-slate-500'}`} />
                  <span>{r.label}</span>
                  {r.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#ff5c7a] text-white">
                      {r.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Back to Landing & Phantom Wallet */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onNavigateHome}
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-[#0a0d1c] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>На главную</span>
            </button>

            {/* Wallet Button */}
            {!isConnected ? (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#4d8bff] to-[#8b6bff] text-white hover:opacity-95 shadow-md shadow-[#4d8bff]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wallet className="w-3.5 h-3.5" />
                )}
                <span>{isConnecting ? 'Подключение…' : 'Подключить Phantom'}</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0a0d1c] border border-[#252f55] hover:border-[#4d8bff] transition-colors text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-slate-200 font-medium">
                    {formattedAddress}
                  </span>
                  <div className="h-3.5 w-px bg-[#252f55]" />
                  <span className="font-mono text-[#5ad1ff] font-semibold tabular-nums">
                    {balance !== null ? `${balance.toFixed(3)} SOL` : '...'}
                  </span>
                  {isDemoMode && (
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-1 rounded">
                      Demo
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {walletMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0a0d1c] border border-[#252f55] shadow-2xl p-3 z-50 text-xs">
                    <div className="pb-2.5 mb-2.5 border-b border-[#182142]">
                      <div className="text-[11px] text-slate-400">Адрес кошелька</div>
                      <div className="font-mono text-slate-200 text-xs break-all mt-0.5 select-all">
                        {walletAddress}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 text-slate-300">
                      <span>Баланс Solana Devnet:</span>
                      <span className="font-mono font-semibold text-[#5ad1ff]">
                        {balance !== null ? `${balance.toFixed(4)} SOL` : '0 SOL'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#182142] flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          refreshBalance();
                        }}
                        disabled={isLoadingBalance}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#11162d] text-slate-300 text-left transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-slate-400 ${
                              isLoadingBalance ? 'animate-spin' : ''
                            }`}
                          />
                          Обновить баланс
                        </span>
                      </button>

                      <a
                        href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#11162d] text-[#4d8bff] text-left transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Смотреть в Solana Explorer
                        </span>
                      </a>

                      <button
                        onClick={() => {
                          disconnect();
                          setWalletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/30 text-rose-400 text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Отключить кошелек</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Role Navigation */}
        <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-[#141a33] bg-[#05060d]">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors relative ${
                  isActive ? 'text-[#5ad1ff]' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{r.label.split(' ')[0]}</span>
                {r.badge !== undefined && (
                  <span className="absolute top-0 right-1 px-1 rounded-full text-[9px] font-bold bg-[#ff5c7a] text-white">
                    {r.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {children}
      </main>

      {/* No Phantom Modal / Standalone Tab Guidance */}
      {showNoPhantomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowNoPhantomModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white font-display">
                  Phantom Wallet не обнаружен
                </h3>
                <p className="text-xs text-slate-400">Инструкция для подключения</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-6">
              <p className="bg-[#11162d] p-3 rounded-lg border border-[#1b2344]">
                «Откройте приложение в отдельной вкладке с установленным Phantom» — расширения браузера часто не инжектируются во встроенные фреймы предпросмотра.
              </p>
              <div className="flex items-center gap-2 text-slate-400">
                <span>1.</span>
                <span>Установите расширение с официального сайта:</span>
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5ad1ff] hover:underline font-mono inline-flex items-center gap-0.5"
                >
                  phantom.app <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>2.</span>
                <span>Переключите сеть в кошельке на <strong className="text-slate-200">Devnet</strong> (Settings &rarr; Developer Settings &rarr; Change Network).</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowNoPhantomModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#4d8bff] hover:bg-[#3d7ae8] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Открыть в новой вкладке браузера</span>
              </button>

              <button
                onClick={() => {
                  connectDemoWallet();
                  setShowNoPhantomModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#141b36] hover:bg-[#1a2347] border border-[#2b396b] text-[#5ad1ff] font-medium text-xs transition-colors cursor-pointer"
              >
                <span>Использовать тестовый Devnet кошелек (быстрый тест)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#141a33] bg-[#05060d] py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-400">AidChain</span>
            <span>·</span>
            <span>SPL Memo Program:</span>
            <span className="font-mono text-[11px] text-slate-400">MemoSq...GmfcHr</span>
          </div>
          <div>
            <span>Прозрачность благотворительных фондов на блокчейне Solana</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
