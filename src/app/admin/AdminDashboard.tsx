import React, { useState } from 'react';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Hash,
  Scale,
} from 'lucide-react';
import { useAppStore, Receipt, Vendor } from '../../lib/store/app-store';
import { usePhantomWallet } from '../../hooks/usePhantomWallet';
import { useSolanaMemo } from '../../hooks/useSolanaMemo';
import { formatSha256Short } from '../../lib/crypto/hash';
import { AuditTrailTable } from '../../components/AuditTrailTable';

export const AdminDashboard: React.FC = () => {
  const {
    receipts,
    vendors,
    campaigns,
    adminApproveReceipt,
    adminRejectReceipt,
    addVendor,
    toggleVendorStatus,
    memoHistory,
  } = useAppStore();
  const { provider, isConnected, connect, isDemoMode } = usePhantomWallet();
  const { writeMemo, isWriting, statusText, lastExplorerUrl, error: memoError, clearStatus } =
    useSolanaMemo(provider, isDemoMode);

  // HITL Queue: receipts requiring attention
  const hitlQueue = receipts.filter(
    (r) => r.status === 'pending' || r.aiValidation.confidenceScore < 80
  );

  // Selected receipt for Side-by-side inspection
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>(
    hitlQueue[0]?.id || receipts[0]?.id || ''
  );
  const selectedReceipt = receipts.find((r) => r.id === selectedReceiptId);

  // Find corresponding campaign and stage estimates
  const matchedCampaign = campaigns.find((c) => c.id === selectedReceipt?.campaignId);
  const matchedStage = matchedCampaign?.stages.find((s) => s.id === selectedReceipt?.stageId);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Whitelist management
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorBIN, setNewVendorBIN] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Строительство');
  const [newVendorWallet, setNewVendorWallet] = useState('');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  // Approve action
  const handleApproveReceipt = async (receipt: Receipt) => {
    setIsProcessingAction(true);
    try {
      const memoText = `[ADMIN OVERRIDE] Чек #${receipt.invoiceNumber} одобрен администратором (${receipt.totalSOL} SOL)`;
      const result = await writeMemo(memoText, 'ADMIN_OVERRIDE');
      adminApproveReceipt(receipt.id, result.signature, 'HITL проверка пройдена успешно');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Reject action
  const handleConfirmReject = async () => {
    if (!selectedReceipt || !rejectReason.trim()) return;
    setIsProcessingAction(true);
    try {
      const memoText = `[ADMIN REJECT] Чек #${selectedReceipt.invoiceNumber} отклонен. Причина: ${rejectReason.slice(0, 30)}`;
      const result = await writeMemo(memoText, 'ADMIN_OVERRIDE');
      adminRejectReceipt(selectedReceipt.id, result.signature, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Add Vendor Submit
  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newVendorBIN || !newVendorWallet) return;
    setIsProcessingAction(true);
    try {
      const memoText = `[WHITELIST ADD] Аккредитован поставщик ${newVendorName} БИН: ${newVendorBIN}`;
      const result = await writeMemo(memoText, 'ADMIN_OVERRIDE');
      addVendor(
        {
          name: newVendorName,
          bin: newVendorBIN,
          category: newVendorCategory,
          walletAddress: newVendorWallet,
          status: 'VERIFIED',
        },
        result.signature
      );
      setShowAddVendorModal(false);
      setNewVendorName('');
      setNewVendorBIN('');
      setNewVendorWallet('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#182142]">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-[#8b6bff]" />
            <span>Кабинет Администратора & HITL-очередь</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Human-in-the-Loop арбитраж спорных чеков (Confidence Score &lt; 80%), ручная авторизация траншей и реестр доверенных поставщиков (Whitelist).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#11162d] border border-[#232f59] text-[#5ad1ff] text-xs font-medium hover:bg-[#182245] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить поставщика в Whitelist</span>
          </button>
        </div>
      </div>

      {/* Transaction status alert */}
      {statusText && (
        <div className="rounded-xl p-4 bg-[#111936] border border-[#23336c] flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            {isWriting ? (
              <Loader2 className="w-4 h-4 text-[#5ad1ff] animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-semibold text-slate-100">{statusText}</span>
          </div>
          {lastExplorerUrl && (
            <a
              href={lastExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#5ad1ff] font-medium hover:underline"
            >
              <span>Посмотреть запись</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* HITL Queue Alerts Strip */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-amber-300">
              Очередь Human-in-the-Loop (HITL): {hitlQueue.length} документ(ов) требуют проверки
            </div>
            <div className="text-[11px] text-slate-400">
              Оракул передал эти чеки на ручное рассмотрение из-за скора доверия ниже 80% или статуса поставщика.
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Verification Workspace */}
      {selectedReceipt && (
        <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#141b36]">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#4d8bff]" />
                <h3 className="text-base font-bold font-display text-white">
                  Side-by-Side Инспектор: Чек vs Смета
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Документ: <strong className="text-slate-200">{selectedReceipt.fileName}</strong>
              </p>
            </div>

            {/* Selector among receipts */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Выбрать документ:</span>
              <select
                value={selectedReceiptId}
                onChange={(e) => setSelectedReceiptId(e.target.value)}
                className="px-3 py-1.5 bg-[#11162d] border border-[#232f59] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#4d8bff]"
              >
                {receipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.invoiceNumber} — {r.vendorName} ({r.totalSOL} SOL) [{r.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Columns Side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: Uploaded Receipt OCR Details */}
            <div className="p-5 rounded-xl bg-[#0d1226] border border-[#182142] space-y-4">
              <div className="flex items-center justify-between border-b border-[#161d38] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#5ad1ff]" />
                  <span>1. Распознанный фискальный чек (OCR)</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#5ad1ff]">
                  {selectedReceipt.totalSOL} SOL
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Продавец (Юрлицо):</span>
                  <span className="text-slate-200 font-medium">{selectedReceipt.vendorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">БИН/ИИН:</span>
                  <span className="text-slate-200 font-mono">{selectedReceipt.vendorBIN}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Номер документа:</span>
                  <span className="text-slate-200 font-mono">{selectedReceipt.invoiceNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Дата фискализации:</span>
                  <span className="text-slate-200 font-mono">{selectedReceipt.ocrDetails.parsedDate}</span>
                </div>
                <div className="flex flex-col py-1 border-b border-[#131930]">
                  <span className="text-slate-400 mb-1">SHA-256 Хэш файла:</span>
                  <span className="font-mono text-[11px] text-slate-300 break-all bg-[#070914] p-1.5 rounded border border-[#171c33]">
                    {selectedReceipt.fileHashSha256}
                  </span>
                </div>
              </div>

              {/* Parsed items */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Позиции в фискальном чеке:
                </span>
                <div className="space-y-1.5">
                  {selectedReceipt.ocrDetails.parsedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#080b18] border border-[#141b36] flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-200">{item.name}</span>
                      <span className="font-mono text-slate-300">{item.price} SOL</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Approved Grant Estimate */}
            <div className="p-5 rounded-xl bg-[#0d1226] border border-[#182142] space-y-4">
              <div className="flex items-center justify-between border-b border-[#161d38] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#8b6bff]" />
                  <span>2. Утвержденная смета гранта</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#8b6bff]">
                  {matchedStage?.targetSOL || selectedReceipt.totalSOL} SOL
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Кампания:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[200px]">
                    {matchedCampaign?.title || 'Сбор'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Этап эскроу:</span>
                  <span className="text-slate-200 font-medium">{matchedStage?.title || 'Этап 1'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Сумма этапа:</span>
                  <span className="text-slate-200 font-mono font-semibold">
                    {matchedStage?.targetSOL || selectedReceipt.totalSOL} SOL
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#131930]">
                  <span className="text-slate-400">Whitelist статус поставщика:</span>
                  <span
                    className={`font-semibold ${
                      selectedReceipt.aiValidation.vendorWhitelisted
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {selectedReceipt.aiValidation.vendorWhitelisted ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Estimate items */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Позиции сметы этапа:
                </span>
                <div className="space-y-1.5">
                  {matchedStage?.estimates && matchedStage.estimates.length > 0 ? (
                    matchedStage.estimates.map((est) => (
                      <div
                        key={est.id}
                        className="p-2 rounded-lg bg-[#080b18] border border-[#141b36] flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200">{est.name}</span>
                        <span className="font-mono text-slate-300">{est.totalSOL} SOL</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded-lg bg-[#080b18] border border-[#141b36] text-xs text-slate-400">
                      Позиции соответствуют утвержденному ТЗ этапа
                    </div>
                  )}
                </div>
              </div>

              {/* AI Score & Verdict bar */}
              <div className="mt-4 pt-3 border-t border-[#161d38]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">AI Confidence Score:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedReceipt.aiValidation.confidenceScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#171f40] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedReceipt.aiValidation.confidenceScore >= 80
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${selectedReceipt.aiValidation.confidenceScore}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Вердикт: <strong className="text-white">{selectedReceipt.aiValidation.verdict}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#141b36]">
            <div className="text-xs text-slate-400">
              Текущий статус: <strong className="text-slate-200 uppercase">{selectedReceipt.status}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessingAction}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Отклонить отчет</span>
              </button>

              <button
                onClick={() => handleApproveReceipt(selectedReceipt)}
                disabled={isProcessingAction}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Одобрить транш вручную (Solana Memo)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whitelist Management Table */}
      <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white font-display">
              Реестр аккредитованных поставщиков (Whitelist)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Управление доверенными поставщиками оборудования и услуг
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Всего в реестре: {vendors.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-[#1a213d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Наименование компании</th>
                <th className="py-3 px-3">БИН</th>
                <th className="py-3 px-3">Категория</th>
                <th className="py-3 px-3">Solana Кошелек</th>
                <th className="py-3 px-3 text-center">Статус</th>
                <th className="py-3 px-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131930]">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-[#11162d] transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{v.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{v.bin}</td>
                  <td className="py-3 px-3 text-slate-400">{v.category}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#5ad1ff]">
                    {v.walletAddress.slice(0, 6)}...{v.walletAddress.slice(-6)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        v.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() =>
                        toggleVendorStatus(
                          v.id,
                          v.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED'
                        )
                      }
                      className="px-2.5 py-1 rounded text-[11px] border border-[#232f59] text-slate-300 hover:text-white hover:bg-[#182142] transition-colors"
                    >
                      {v.status === 'VERIFIED' ? 'Отозвать' : 'Подтвердить'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail of Admin decisions */}
      <div className="mt-12">
        <AuditTrailTable
          records={memoHistory}
          title="Реестр решений и транзакций арбитража"
          subtitle="Полная история действий администратора с SPL Memo подписями"
        />
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-white font-display mb-1">
              Отклонить фискальный отчет
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Укажите причину для организатора фонда и фиксации в блокчейне Solana Devnet.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Причина отклонения:
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Напр. Несоответствие номенклатуры в чеке смете этапа..."
                className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmReject}
                disabled={isProcessingAction || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Подтвердить отклонение</span>
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[#11162d] text-slate-300 text-xs hover:bg-[#182142]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-white font-display mb-1">
              Аккредитовать поставщика
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Добавление компании в реестр доверенных контрагентов.
            </p>

            <form onSubmit={handleAddVendorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название компании:
                </label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="ТОО 'КазТехСнаб'"
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  БИН компании (12 цифр):
                </label>
                <input
                  type="text"
                  required
                  value={newVendorBIN}
                  onChange={(e) => setNewVendorBIN(e.target.value)}
                  placeholder="190240012933"
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Категория поставок:
                </label>
                <input
                  type="text"
                  required
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  placeholder="Медицинское оборудование"
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Solana Кошелек для выплат:
                </label>
                <input
                  type="text"
                  required
                  value={newVendorWallet}
                  onChange={(e) => setNewVendorWallet(e.target.value)}
                  placeholder="Pubkey (напр. 7vPx...mNpQ)"
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#8b6bff] text-white font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Аккредитовать (Solana Memo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#11162d] text-slate-300 text-xs hover:bg-[#182142]"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
