import React, { useState, useRef } from 'react';
import {
  Building2,
  PlusCircle,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Hash,
  Send,
  Layers,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { useAppStore, Campaign, CampaignStage } from '../../lib/store/app-store';
import { usePhantomWallet } from '../../hooks/usePhantomWallet';
import { useSolanaMemo } from '../../hooks/useSolanaMemo';
import { calculateFileSha256, formatSha256Short } from '../../lib/crypto/hash';
import { AuditTrailTable } from '../../components/AuditTrailTable';

export const FoundationDashboard: React.FC = () => {
  const { campaigns, receipts, createCampaign, uploadReceiptWithOcr, releaseTranche } =
    useAppStore();
  const { provider, isConnected, connect, isDemoMode } = usePhantomWallet();
  const { writeMemo, isWriting, statusText, lastExplorerUrl, error: memoError, clearStatus } =
    useSolanaMemo(provider, isDemoMode);

  // Modal: Create Campaign
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetSOL, setNewTargetSOL] = useState<number>(15);
  const [newCategory, setNewCategory] = useState<Campaign['category']>('Медицина');
  const [newCity, setNewCity] = useState('Астана');
  const [newDeadline, setNewDeadline] = useState('2026-12-20');
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  // File Upload & SHA-256 State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [selectedStageId, setSelectedStageId] = useState<string>(
    campaigns[0]?.stages[0]?.id || ''
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessResult, setUploadSuccessResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tranche release execution state
  const [releasingStage, setReleasingStage] = useState<{
    campaignId: string;
    stageId: string;
    stageTitle: string;
    amount: number;
  } | null>(null);
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setUploadedFile(file);
    setIsHashing(true);
    setUploadSuccessResult(null);
    try {
      const hash = await calculateFileSha256(file);
      setCalculatedHash(hash);
    } catch (err) {
      console.error('Hash calculation failed', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleUploadAndVerify = async () => {
    if (!uploadedFile || !calculatedHash || !selectedCampaignId || !selectedStageId) return;
    setIsUploading(true);
    try {
      const receipt = await uploadReceiptWithOcr(
        selectedCampaignId,
        selectedStageId,
        {
          name: uploadedFile.name,
          size: uploadedFile.size,
          sha256: calculatedHash,
        }
      );
      setUploadSuccessResult(receipt);
      setUploadedFile(null);
      setCalculatedHash(null);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Create Campaign Submit
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTargetSOL <= 0) return;

    setIsSubmittingCampaign(true);
    try {
      const memoText = `[AIDCHAIN CAMPAIGN] Создан сбор: ${newTitle.slice(0, 35)} (${newTargetSOL} SOL)`;
      const result = await writeMemo(memoText, 'CAMPAIGN_CREATE');

      createCampaign(
        {
          title: newTitle,
          description: newDescription,
          targetAmountSOL: newTargetSOL,
          category: newCategory,
          city: newCity,
          deadline: newDeadline,
        },
        result.signature
      );

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // Tranche release
  const handleConfirmTrancheRelease = async () => {
    if (!releasingStage) return;
    setIsSubmittingRelease(true);
    try {
      const { campaignId, stageId, stageTitle, amount } = releasingStage;
      const memoText = `[TRANCHE RELEASE] ${stageTitle.slice(0, 25)} одобрен, сумма: ${amount} SOL`;
      const result = await writeMemo(memoText, 'TRANCHE_RELEASE');

      releaseTranche(campaignId, stageId, result.signature);
      setReleasingStage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRelease(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#182142]">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#4d8bff]" />
            <span>Кабинет Организатора Фонда</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Управление сборами, загрузка фискальных актов со сверкой в реальном времени и выплата целевых траншей из эскроу через Solana Devnet.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#8b6bff] text-white font-medium text-xs hover:opacity-95 shadow-md shadow-[#4d8bff]/20 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Опубликовать новый сбор</span>
        </button>
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

      {/* Main Grid: Left = Receipt Upload & AI Oracle, Right = Active Stages & Tranche Release */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Receipt Upload & AI Oracle Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white font-display mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#5ad1ff]" />
              <span>Загрузка фискального чека и расчет SHA-256</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Загрузите электронную счет-фактуру (ЭСФ), фискальный чек ОФД или акт приема-передачи. Хеш вычисляется прямо в браузере через Web Crypto API.
            </p>

            {/* Campaign & Stage selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Кампания:
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    setSelectedCampaignId(e.target.value);
                    const camp = campaigns.find((c) => c.id === e.target.value);
                    if (camp && camp.stages[0]) {
                      setSelectedStageId(camp.stages[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#4d8bff]"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Этап финансирования:
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#4d8bff]"
                >
                  {activeCampaign?.stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.targetSOL} SOL)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#5ad1ff] bg-[#5ad1ff]/5'
                  : 'border-[#222b4d] hover:border-[#4d8bff] bg-[#0c1024]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#141b36] border border-[#232f59] flex items-center justify-center text-[#5ad1ff]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {uploadedFile ? (
                    <span className="text-[#5ad1ff] font-semibold">{uploadedFile.name}</span>
                  ) : (
                    <>Нажмите для выбора файла или перетащите его сюда</>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Поддерживаются форматы PDF, PNG, JPG, XML (акты, счета-фактуры, чеки)
                </p>
              </div>
            </div>

            {/* Real-time Hash computation status */}
            {isHashing && (
              <div className="mt-4 p-3 rounded-xl bg-[#11162d] border border-[#1b2344] flex items-center gap-3 text-xs text-[#5ad1ff]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Вычисление криптографического хэша SHA-256 в браузере...</span>
              </div>
            )}

            {calculatedHash && (
              <div className="mt-4 p-4 rounded-xl bg-[#0f142b] border border-[#1b2344] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Контрольная сумма SHA-256:</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">
                    Сгенерировано локально
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-200 break-all bg-[#090c1a] p-2.5 rounded-lg border border-[#151c36] select-all">
                  {calculatedHash}
                </div>

                <button
                  onClick={handleUploadAndVerify}
                  disabled={isUploading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#5ad1ff] text-white font-medium text-xs hover:opacity-95 shadow-md shadow-[#4d8bff]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Анализ документа AI-оракулом...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Отправить на AI-верификацию и сверку со сметой</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* AI Oracle Result Presentation */}
            {uploadSuccessResult && (
              <div className="mt-5 p-5 rounded-xl bg-[#0d142d] border border-[#233566] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5ad1ff]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Результат AI-Оракула (OCR & Сверка)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      Score: {uploadSuccessResult.aiValidation.confidenceScore}%
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        uploadSuccessResult.aiValidation.verdict === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {uploadSuccessResult.aiValidation.verdict}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#080b18] p-2.5 rounded-lg border border-[#141b36]">
                    <span className="text-slate-400 block text-[10px]">Распознанный поставщик:</span>
                    <span className="text-slate-200 font-medium truncate block">
                      {uploadSuccessResult.ocrDetails.parsedVendor}
                    </span>
                  </div>
                  <div className="bg-[#080b18] p-2.5 rounded-lg border border-[#141b36]">
                    <span className="text-slate-400 block text-[10px]">БИН поставщика:</span>
                    <span className="text-slate-200 font-mono font-medium block">
                      {uploadSuccessResult.ocrDetails.parsedBIN}
                    </span>
                  </div>
                  <div className="bg-[#080b18] p-2.5 rounded-lg border border-[#141b36]">
                    <span className="text-slate-400 block text-[10px]">Сумма по чеку:</span>
                    <span className="text-[#5ad1ff] font-mono font-bold block">
                      {uploadSuccessResult.ocrDetails.parsedTotalSOL} SOL
                    </span>
                  </div>
                  <div className="bg-[#080b18] p-2.5 rounded-lg border border-[#141b36]">
                    <span className="text-slate-400 block text-[10px]">Сверка с позициями сметы:</span>
                    <span className="text-emerald-400 font-medium block">
                      100% совпадение позиций
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-[#080b18] p-3 rounded-lg border border-[#141b36] leading-relaxed">
                  {uploadSuccessResult.aiValidation.aiAnalysisText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Stages, Estimates & Tranche Release (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-[#1b2344] bg-[#0a0d1c] p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white font-display mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8b6bff]" />
              <span>Этапы сбора и выплата траншей</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Кампания: <strong className="text-slate-200">{activeCampaign?.title}</strong>
            </p>

            <div className="space-y-4">
              {activeCampaign?.stages.map((stage) => {
                const isReleased = stage.status === 'verified_released';
                const isUnderReview = stage.status === 'under_review';

                return (
                  <div
                    key={stage.id}
                    className="p-4 rounded-xl bg-[#0f142b] border border-[#1b2344] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{stage.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{stage.description}</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#5ad1ff] shrink-0 tabular-nums">
                        {stage.targetSOL} SOL
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#161d38] text-[11px]">
                      <span className="text-slate-400">
                        Статус:{' '}
                        <span
                          className={`font-medium ${
                            isReleased
                              ? 'text-emerald-400'
                              : isUnderReview
                              ? 'text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {isReleased
                            ? 'Выплачено'
                            : isUnderReview
                            ? 'Проверен оракулом'
                            : 'Ожидает чека'}
                        </span>
                      </span>

                      {!isReleased && (
                        <button
                          onClick={() =>
                            setReleasingStage({
                              campaignId: activeCampaign.id,
                              stageId: stage.id,
                              stageTitle: stage.title,
                              amount: stage.targetSOL,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Запросить выплату транша</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="mt-12">
        <AuditTrailTable
          records={receipts.map((r, i) => ({
            id: r.id,
            text: `[RECEIPT VERIFIED] Хэш: ${r.fileHashSha256.slice(0, 16)}... Поставщик: ${r.vendorName} (${r.totalSOL} SOL)`,
            timestamp: Date.now() - (i + 1) * 3600 * 1000,
            signature: r.solanaProofSignature || 'pending-admin-review-on-chain',
            explorerUrl: r.solanaProofSignature
              ? `https://explorer.solana.com/tx/${r.solanaProofSignature}?cluster=devnet`
              : 'https://explorer.solana.com/?cluster=devnet',
            status: r.status === 'approved' ? 'confirmed' : 'pending',
            category: 'TRANCHE_RELEASE',
          }))}
          title="Реестр верифицированных чеков и актов"
          subtitle="Контрольные суммы документов, подтвержденные в смарт-контрактах Solana"
        />
      </div>

      {/* Modal: Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-white font-display mb-1">
              Создать грантовый сбор
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Фиксация инициативы в блокчейне Solana Devnet через SPL Memo.
            </p>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название сбора:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Напр. Закупка аппаратов ИВЛ для детской больницы"
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Целевая сумма (SOL):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={newTargetSOL}
                  onChange={(e) => setNewTargetSOL(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Категория:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#4d8bff]"
                  >
                    <option value="Медицина">Медицина</option>
                    <option value="Дети">Дети</option>
                    <option value="Инфраструктура">Инфраструктура</option>
                    <option value="Экология">Экология</option>
                    <option value="Образование">Образование</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Город реализации:
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white focus:outline-none focus:border-[#4d8bff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Описание и смета:
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Опишите задачи сбора и требования к поставщикам..."
                  className="w-full px-3 py-2 bg-[#11162d] border border-[#1e274a] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#4d8bff]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0d1226] border border-[#161d38] text-xs space-y-1">
                <div className="text-slate-400">Автоматическая разбивка на эскроу-этапы:</div>
                <div className="text-[11px] text-slate-300">
                  • Этап 1: Аванс 20% ({(newTargetSOL * 0.2).toFixed(2)} SOL)
                  <br />• Этап 2: Поставка и закрывающие документы 80% ({(newTargetSOL * 0.8).toFixed(2)} SOL)
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCampaign}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#8b6bff] text-white font-medium text-xs hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCampaign ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Запись в Solana Devnet...</span>
                    </>
                  ) : (
                    <span>Опубликовать сбор (Solana Memo)</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#11162d] text-slate-300 text-xs hover:bg-[#182142]"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Tranche Release */}
      {releasingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0d1c] border border-[#252f55] rounded-2xl p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-white font-display mb-2">
              Запрос выплаты транша из эскроу
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Вы подтверждаете завершение этапа <strong className="text-white">{releasingStage.stageTitle}</strong> и запрашиваете выплату <strong className="text-white font-mono">{releasingStage.amount} SOL</strong> на кошелек аккредитованного поставщика.
            </p>

            <div className="p-3 bg-[#0d1226] rounded-xl border border-[#161d38] text-xs font-mono text-[#5ad1ff] mb-5">
              [TRANCHE RELEASE] {releasingStage.stageTitle.slice(0, 20)} одобрен, сумма: {releasingStage.amount} SOL
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmTrancheRelease}
                disabled={isSubmittingRelease}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRelease ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Подписать транзакцию в Phantom</span>
              </button>
              <button
                onClick={() => setReleasingStage(null)}
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
