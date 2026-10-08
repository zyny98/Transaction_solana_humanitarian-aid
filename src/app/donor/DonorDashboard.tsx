import React, { useState } from 'react';
import {
  Heart,
  TrendingUp,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
  ChevronRight,
  Info,
  Loader2,
  DollarSign,
  Hash,
} from 'lucide-react';
import { useAppStore, Campaign, CampaignStage } from '../../lib/store/app-store';
import { usePhantomWallet } from '../../hooks/usePhantomWallet';
import { useSolanaMemo } from '../../hooks/useSolanaMemo';
import { AuditTrailTable } from '../../components/AuditTrailTable';
import { formatSha256Short } from '../../lib/crypto/hash';

export const DonorDashboard: React.FC = () => {
  const { campaigns, receipts, memoHistory, donateToCampaign, requestRefund } = useAppStore();
  const { provider, isConnected, connect, isDemoMode, walletAddress } = usePhantomWallet();
  const { writeMemo, isWriting, statusText, lastExplorerUrl, error: memoError, clearStatus } =
    useSolanaMemo(provider, isDemoMode);

  // Donation modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0.5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationSuccessMsg, setDonationSuccessMsg] = useState<{
    txUrl: string;
    amount: number;
    title: string;
  } | null>(null);

  // Refund state
  const [selectedRefundStage, setSelectedRefundStage] = useState<{
    campaign: Campaign;
    stage: CampaignStage;
  } | null>(null);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  // Active view tab: 'campaigns' | 'expenses' | 'refunds'
  const [activeTab, setActiveTab] = useState<'campaigns' | 'expenses' | 'refunds'>('campaigns');

  const handleOpenDonate = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDonationAmount(0.5);
    setCustomAmount('');
    setDonationSuccessMsg(null);
    clearStatus();
  };

  const handleConfirmDonation = async () => {
    if (!selectedCampaign) return;
    const finalAmount = customAmount ? parseFloat(customAmount) : donationAmount;
    if (!finalAmount || finalAmount <= 0) return;

    if (!isConnected) {
      connect();
      return;
    }

    setIsSubmittingDonation(true);
    try {
      const memoText = `[AIDCHAIN DONATION] ${finalAmount} SOL -> Кампания: ${selectedCampaign.title.slice(0, 40)}`;
      const result = await writeMemo(memoText, 'DONATION');

      // Update store
      donateToCampaign(
        selectedCampaign.id,
        finalAmount,
        walletAddress || 'DevnetDonorWallet',
        result.signature,
        memoText
      );

      setDonationSuccessMsg({
        txUrl: result.explorerUrl,
        amount: finalAmount,
        title: selectedCampaign.title,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!selectedRefundStage) return;
    setIsSubmittingRefund(true);
    try {
      const { campaign, stage } = selectedRefundStage;
      const refundAmount = stage.targetSOL;
      const memoText = `[AIDCHAIN REFUND] Запрос возврата ${refundAmount} SOL. Этап: ${stage.title.slice(0, 30)} (Сбор: ${campaign.id})`;
      const result = await writeMemo(memoText, 'REFUND');

      requestRefund(campaign.id, stage.id, result.signature);
      setRefundSuccessMsg(`Возврат средств зарегистрирован в Solana Devnet (Сигнатура: ${result.signature.slice(0, 10)}...)`);
      setSelectedRefundStage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Filter donor-relevant memo records
  const donorMemos = memoHistory.filter(
    (m) => m.category === 'DONATION' || m.category === 'REFUND'
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#182142]">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <span>Кабинет Донора</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#4d8bff]/15 text-[#5ad1ff] border border-[#4d8bff]/30">
              Zero-Trust Escrow
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Пожертвования блокируются в смарт-эскроу на Solana Devnet и выплачиваются исполнителям строго по этапам после машинной AI-валидации чеков.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-xl bg-[#0a0d1c] border border-[#1e2640] text-xs">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'campaigns'
                ? 'bg-[#4d8bff] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Каталог сборов
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'expenses'
                ? 'bg-[#4d8bff] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Куда ушли деньги ({receipts.length})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'refunds'
                ? 'bg-[#4d8bff] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Гарантии возврата
          </button>
        </div>
      </div>

      {/* Status banner for Memo operations */}
      {statusText && (
        <div className="rounded-xl p-4 bg-[#111936] border border-[#23336c] flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            {isWriting ? (
              <Loader2 className="w-4 h-4 text-[#5ad1ff] animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <div>
              <span className="font-semibold text-slate-100">{statusText}</span>
              {lastExplorerUrl && (
                <span className="ml-2 text-slate-400">
                  Транзакция отправлена в сеть Solana Devnet.
                </span>
              )}
            </div>
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

      {memoError && (
        <div className="rounded-xl p-4 bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{memoError}</span>
          </div>
          <button onClick={clearStatus} className="text-slate-400 hover:text-white">
            Закрыть
          </button>
        </div>
      )}

      {refundSuccessMsg && (
        <div className="rounded-xl p-4 bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{refundSuccessMsg}</span>
          </div>
          <button onClick={() => setRefundSuccessMsg(null)} className="text-slate-400 hover:text-white">
            Ок
          </button>
        </div>
      )}

      {/* TAB 1: Campaigns Catalog */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const percent = Math.min(
              100,
              Math.round((camp.collectedAmountSOL / camp.targetAmountSOL) * 100)
            );

            return (
              <div
                key={camp.id}
                className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 flex flex-col justify-between hover:border-[#2d3a6d] transition-all shadow-xl"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[11px] font-mono text-[#5ad1ff] font-medium px-2 py-0.5 rounded bg-[#5ad1ff]/10 border border-[#5ad1ff]/20">
                      {camp.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{camp.city}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white font-display tracking-tight leading-snug">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {camp.description}
                  </p>

                  {/* Organizer info */}
                  <div className="mt-4 pt-3 border-t border-[#141b36] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-medium">{camp.organizer.name}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-[11px]">БИН: {camp.organizer.bin}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      Рейтинг доверия: {camp.organizer.reputationScore}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <span className="text-xl font-bold font-mono text-white tabular-nums">
                          {camp.collectedAmountSOL} SOL
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          из {camp.targetAmountSOL} SOL
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#5ad1ff]">
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#141b36] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4d8bff] to-[#5ad1ff] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{camp.donorCount} доноров поддержали</span>
                      <span>Дедлайн: {camp.deadline}</span>
                    </div>
                  </div>

                  {/* Stages Timeline */}
                  <div className="mt-6 space-y-2.5">
                    <div className="text-xs font-medium text-slate-300">
                      Смета и этапы эскроу-выплат:
                    </div>
                    <div className="space-y-2">
                      {camp.stages.map((stage) => {
                        const isReleased = stage.status === 'verified_released';
                        const isUnderReview = stage.status === 'under_review';
                        const isRefunded = stage.status === 'refunded';

                        return (
                          <div
                            key={stage.id}
                            className="p-3 rounded-xl bg-[#0f142b] border border-[#1b2344] text-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-200 truncate">
                                  {stage.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {stage.description}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono font-semibold text-slate-100 tabular-nums">
                                {stage.targetSOL} SOL
                              </div>
                              <span
                                className={`text-[10px] font-medium ${
                                  isReleased
                                    ? 'text-emerald-400'
                                    : isUnderReview
                                    ? 'text-amber-400'
                                    : isRefunded
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {isReleased
                                  ? 'Выплачено по чекам'
                                  : isUnderReview
                                  ? 'На AI-аудите'
                                  : isRefunded
                                  ? 'Возвращено'
                                  : 'Заблокировано в эскроу'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Donate CTA button */}
                <div className="mt-6 pt-4 border-t border-[#141b36] flex items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                    Escrow: {camp.escrowAddress.slice(0, 10)}...
                  </div>
                  <button
                    onClick={() => handleOpenDonate(camp)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#5ad1ff] text-white font-medium text-xs hover:opacity-95 shadow-md shadow-[#4d8bff]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white/20" />
                    <span>Поддержать (Devnet Memo)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Transparent Expenditure Feed ("Куда ушли деньги") */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#1b2344] bg-[#0a0d1c] p-5">
            <h3 className="text-base font-semibold text-white font-display">
              Публичный реестр целевых расходов и фискальных чеков
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Каждый закрывающий документ и фискальный чек проходит сверку со сметой, хешируется по алгоритму SHA-256 и заверяется в блокчейне Solana.
            </p>
          </div>

          <div className="space-y-4">
            {receipts.map((rec) => {
              const campaign = campaigns.find((c) => c.id === rec.campaignId);
              const isApproved = rec.status === 'approved';

              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 hover:border-[#2d3a6d] transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#141b36]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white text-sm">
                          {rec.vendorName}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-xs text-slate-400">
                          БИН {rec.vendorBIN}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{rec.uploadedAt}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Кампания:{' '}
                        <span className="text-slate-300 font-medium">
                          {campaign?.title || 'Благотворительный проект'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Сумма документа:</div>
                        <div className="text-base font-bold font-mono text-[#5ad1ff] tabular-nums">
                          {rec.totalSOL} SOL
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono ${
                          isApproved
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {isApproved ? 'ОДОБРЕНО ОРАКУЛОМ' : 'НА HITL-ПРОВЕРКЕ'}
                      </div>
                    </div>
                  </div>

                  {/* OCR & Hash Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-2">
                    <div className="p-3 rounded-xl bg-[#0f142b] border border-[#182142] space-y-1">
                      <div className="text-[11px] text-slate-400">Цифровой отпечаток (SHA-256):</div>
                      <div className="font-mono text-xs text-slate-200 break-all select-all flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#5ad1ff] shrink-0" />
                        <span>{formatSha256Short(rec.fileHashSha256)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Файл: {rec.fileName}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f142b] border border-[#182142] space-y-1">
                      <div className="text-[11px] text-slate-400">Точность OCR (AI Oracle):</div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-white">
                          {rec.aiValidation.confidenceScore}%
                        </span>
                        <div className="flex-1 h-1.5 bg-[#171f40] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rec.aiValidation.confidenceScore >= 80
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${rec.aiValidation.confidenceScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rec.aiValidation.vendorWhitelisted
                          ? 'Поставщик в Whitelist'
                          : 'Ожидает аккредитации'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f142b] border border-[#182142] space-y-1">
                      <div className="text-[11px] text-slate-400">Фиксация в блокчейне:</div>
                      {rec.solanaProofSignature ? (
                        <a
                          href={`https://explorer.solana.com/tx/${rec.solanaProofSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-[#4d8bff] hover:text-[#5ad1ff] flex items-center gap-1"
                        >
                          <span className="truncate">
                            {rec.solanaProofSignature.slice(0, 14)}...
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-amber-400/90 font-mono">
                          Ожидает подтверждения админа
                        </span>
                      )}
                      <div className="text-[10px] text-slate-500">
                        Статус: {rec.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* AI Notes */}
                  <div className="mt-3 text-xs text-slate-400 bg-[#0d1226] p-3 rounded-xl border border-[#161d38]">
                    <span className="text-slate-300 font-medium">Заключение AI-оракула: </span>
                    {rec.aiValidation.aiAnalysisText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Refund System */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#1b2344] bg-[#0a0d1c] p-6">
            <h3 className="text-base font-semibold text-white font-display flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#ff5c7a]" />
              <span>Механизм защиты доноров и возврата средств (Refund Escrow)</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              В отличие от классического краудфандинга, в AidChain средства никогда не выплачиваются фонду целиком. Если этап задерживается или отчет отклонен, неиспользованная часть средств возвращается донорам пропорционально их вкладу через транзакцию возврата.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.flatMap((c) =>
              c.stages.map((stage) => {
                const canRefund =
                  stage.status === 'disputed' ||
                  stage.status === 'locked' ||
                  stage.status === 'under_review';

                return (
                  <div
                    key={`${c.id}-${stage.id}`}
                    className="p-5 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>{c.title}</span>
                        <span className="font-mono text-white font-semibold">
                          {stage.targetSOL} SOL
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{stage.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{stage.description}</p>
                      <div className="mt-3 text-[11px] text-slate-400">
                        Статус этапа:{' '}
                        <span className="font-semibold text-slate-200 uppercase">
                          {stage.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#161d38] flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">
                        Срок: {stage.dueDate}
                      </span>
                      <button
                        onClick={() => setSelectedRefundStage({ campaign: c, stage })}
                        disabled={stage.status === 'verified_released'}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-[#ff5c7a]/30 text-[#ff5c7a] hover:bg-[#ff5c7a]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      >
                        Запросить возврат доли
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Audit Trail Table of Donations & Refunds */}
      <div className="mt-12">
        <AuditTrailTable
          records={memoHistory}
          title="Реестр пожертвований и возвратов (Solana Devnet Memo)"
          subtitle="Все транзакции фиксируются со спецификацией SPL Memo и доступны в блокчейн-обозревателе"
        />
      </div>

      {/* Donation Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-[#182142]">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Внести пожертвование
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Кампания: {selectedCampaign.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {donationSuccessMsg ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Пожертвование успешно записано!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Сумма <strong className="text-white">{donationSuccessMsg.amount} SOL</strong> переведена на смарт-эскроу с регистрацией в SPL Memo.
                </p>
                <div className="pt-2">
                  <a
                    href={donationSuccessMsg.txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#5ad1ff] font-medium hover:underline bg-[#111936] px-4 py-2 rounded-xl border border-[#23336c]"
                  >
                    <span>Смотреть в Solana Explorer Devnet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="w-full py-2.5 rounded-xl bg-[#141b36] hover:bg-[#1b254a] text-slate-200 text-xs font-medium transition-colors"
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <div className="py-4 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Выберите сумму взноса (SOL):
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[0.1, 0.5, 1.0].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonationAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold transition-all ${
                          donationAmount === amt && !customAmount
                            ? 'bg-[#4d8bff] text-white shadow-md'
                            : 'bg-[#11162d] text-slate-300 hover:bg-[#182142] border border-[#1f2952]'
                        }`}
                      >
                        {amt} SOL
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      SOL
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Или укажите свою сумму (напр. 0.25)"
                      className="w-full pl-12 pr-4 py-2.5 bg-[#11162d] border border-[#1f2952] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#4d8bff]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0d1226] border border-[#161d38] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Формат записи Memo:</span>
                    <span className="font-mono text-[11px] text-[#8b6bff]">SPL Memo Program</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 break-all bg-[#070914] p-2 rounded border border-[#182142]">
                    [AIDCHAIN DONATION] {customAmount ? customAmount : donationAmount} SOL -&gt; {selectedCampaign.title.slice(0, 30)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleConfirmDonation}
                    disabled={isSubmittingDonation}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#5ad1ff] text-white font-semibold text-xs hover:opacity-95 shadow-lg shadow-[#4d8bff]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDonation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Подписание транзакции в Phantom…</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white/20" />
                        <span>
                          Внести {customAmount ? customAmount : donationAmount} SOL в эскроу
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {selectedRefundStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-white font-display mb-2">
              Подтверждение возврата средств
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Вы запрашиваете возврат доли из этапа <strong className="text-white">{selectedRefundStage.stage.title}</strong>. Транзакция будет зафиксирована в блокчейне Solana Devnet.
            </p>

            <div className="p-3 bg-[#11162d] rounded-xl border border-[#1f2952] text-xs space-y-1 mb-5">
              <div className="text-slate-400">Сумма этапа к возврату:</div>
              <div className="font-mono text-base font-bold text-[#ff5c7a]">
                {selectedRefundStage.stage.targetSOL} SOL
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExecuteRefund}
                disabled={isSubmittingRefund}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5c7a] hover:bg-[#e64766] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRefund ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Подтвердить в Solana</span>
              </button>
              <button
                onClick={() => setSelectedRefundStage(null)}
                className="px-4 py-2.5 rounded-xl bg-[#11162d] text-slate-300 text-xs hover:bg-[#182142]"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
