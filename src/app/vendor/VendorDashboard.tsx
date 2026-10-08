import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
  Download,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { useAppStore, Vendor, Receipt } from '../../lib/store/app-store';
import { usePhantomWallet } from '../../hooks/usePhantomWallet';
import { AuditTrailTable } from '../../components/AuditTrailTable';
import { formatSha256Short } from '../../lib/crypto/hash';

export const VendorDashboard: React.FC = () => {
  const { vendors, receipts, campaigns } = useAppStore();
  const { walletAddress, formattedAddress } = usePhantomWallet();

  // Current selected vendor profile (defaults to primary verified supplier)
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');
  const activeVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  // Invoices for this vendor
  const vendorReceipts = receipts.filter(
    (r) => r.vendorBIN === activeVendor?.bin || r.vendorName === activeVendor?.name
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#182142]">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-[#5ad1ff]" />
            <span>Кабинет Аккредитованного Поставщика</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Прямое получение выплат из смарт-эскроу на кошелек Solana, учет закрывающих актов и статус в реестре Whitelist.
          </p>
        </div>

        {/* Switch Vendor profile view */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Профиль компании:</span>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-3 py-1.5 bg-[#0a0d1c] border border-[#222b4d] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#4d8bff]"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier Profile Card & Whitelist Status */}
      <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#141b36]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold font-display text-white">
                {activeVendor.name}
              </h3>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                  activeVendor.status === 'VERIFIED'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                Whitelist: {activeVendor.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>БИН:</span>
                <span className="font-mono text-slate-200">{activeVendor.bin}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <span>Категория:</span>
                <span className="text-slate-200">{activeVendor.category}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <span>Дата аккредитации:</span>
                <span className="font-mono text-slate-200">{activeVendor.accreditedDate}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f142b] border border-[#1b2344] min-w-[240px]">
            <div className="text-xs text-slate-400">Всего получено из эскроу:</div>
            <div className="text-2xl font-bold font-mono text-[#5ad1ff] mt-0.5 tabular-nums">
              {activeVendor.totalDisbursedSOL} SOL
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Сеть: Solana Devnet
            </div>
          </div>
        </div>

        {/* Receiving Wallet Address */}
        <div className="mt-5 p-4 rounded-xl bg-[#090c1a] border border-[#161c36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">
              Аккредитованный кошелек для прямого зачисления выплат:
            </div>
            <div className="font-mono text-xs text-[#5ad1ff] select-all mt-1 break-all">
              {activeVendor.walletAddress}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Smart Escrow Routing</span>
            </span>
          </div>
        </div>
      </div>

      {/* Invoices & Closing Documents Table */}
      <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white font-display">
              Закрывающие документы и акты (ЭСФ / Накладные)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Счета, проверенные AI-оракулом с прямым перечислением SOL
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Всего документов: {vendorReceipts.length}
          </span>
        </div>

        {vendorReceipts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            По данному поставщику пока нет выставленных счетов
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-[#1a213d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Номер счета / Документ</th>
                  <th className="py-3 px-3">Кампания</th>
                  <th className="py-3 px-3">SHA-256 Хэш</th>
                  <th className="py-3 px-3 text-right">Сумма (SOL)</th>
                  <th className="py-3 px-3 text-center">Статус выплаты</th>
                  <th className="py-3 px-3 text-right">Solana Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131930]">
                {vendorReceipts.map((rec) => {
                  const camp = campaigns.find((c) => c.id === rec.campaignId);
                  const isApproved = rec.status === 'approved';

                  return (
                    <tr key={rec.id} className="hover:bg-[#11162d] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{rec.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {rec.fileName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                        {camp?.title || 'Благотворительный сбор'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {formatSha256Short(rec.fileHashSha256)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-[#5ad1ff]">
                        {rec.totalSOL} SOL
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {isApproved ? 'ВЫПЛАЧЕНО ИЗ ЭСКРОУ' : 'В ОЧЕРЕДИ ПРОВЕРКИ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {rec.solanaProofSignature ? (
                          <a
                            href={`https://explorer.solana.com/tx/${rec.solanaProofSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4d8bff] hover:text-[#5ad1ff]"
                          >
                            <span>Транзакция</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500">Ожидает подтверждения</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Payment Flow Guide */}
      <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6">
        <h3 className="text-sm font-semibold text-white mb-2">
          Как работает автоматическая выплата поставщикам в AidChain:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[#0f142b] border border-[#182142]">
            <span className="font-bold text-white block mb-1">1. Сверка номенклатуры</span>
            AI-оракул считывает фискальный чек или ЭСФ, проверяя совпадение каждой строчки со сметой проекта.
          </div>
          <div className="p-3.5 rounded-xl bg-[#0f142b] border border-[#182142]">
            <span className="font-bold text-white block mb-1">2. Whitelist валидация</span>
            БИН и реквизиты сверяются с реестром аккредитованных юрлиц.
          </div>
          <div className="p-3.5 rounded-xl bg-[#0f142b] border border-[#182142]">
            <span className="font-bold text-white block mb-1">3. Прямой перевод из эскроу</span>
            Средства минуют посредников и зачисляются напрямую на кошелек поставщика в сети Solana.
          </div>
        </div>
      </div>
    </div>
  );
};
