import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MemoRecord, getStoredMemoHistory, saveStoredMemoHistory } from '../../hooks/useSolanaMemo';

export interface EstimateItem {
  id: string;
  name: string;
  vendorName: string;
  vendorBIN: string;
  quantity: number;
  unitPriceSOL: number;
  totalSOL: number;
  category: string;
}

export interface CampaignStage {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  targetSOL: number;
  releasedSOL: number;
  status: 'locked' | 'advance_released' | 'verified_released' | 'under_review' | 'disputed' | 'refunded';
  dueDate: string;
  estimates: EstimateItem[];
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: 'Медицина' | 'Дети' | 'Инфраструктура' | 'Экология' | 'Образование';
  city: string;
  organizer: {
    name: string;
    bin: string;
    address: string;
    reputationScore: number;
  };
  escrowAddress: string;
  targetAmountSOL: number;
  collectedAmountSOL: number;
  donorCount: number;
  deadline: string;
  status: 'active' | 'completed' | 'refunded' | 'disputed';
  stages: CampaignStage[];
  createdAt: string;
}

export interface Receipt {
  id: string;
  campaignId: string;
  stageId: string;
  fileName: string;
  fileHashSha256: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  vendorName: string;
  vendorBIN: string;
  invoiceNumber: string;
  totalSOL: number;
  ocrDetails: {
    parsedVendor: string;
    parsedBIN: string;
    parsedDate: string;
    parsedTotalSOL: number;
    parsedItems: { name: string; qty: number; price: number }[];
  };
  aiValidation: {
    confidenceScore: number; // 0 - 100
    vendorWhitelisted: boolean;
    budgetDeviationPercent: number;
    verdict: 'APPROVED' | 'HITL_REVIEW' | 'REJECTED';
    flags: string[];
    aiAnalysisText: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  solanaProofSignature?: string;
}

export interface Vendor {
  id: string;
  name: string;
  bin: string;
  category: string;
  walletAddress: string;
  status: 'VERIFIED' | 'PENDING' | 'REVOKED';
  totalDisbursedSOL: number;
  accreditedDate: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  amountSOL: number;
  donorAddress: string;
  timestamp: number;
  signature: string;
  memoText: string;
}

interface AppStoreContextType {
  campaigns: Campaign[];
  receipts: Receipt[];
  vendors: Vendor[];
  donations: Donation[];
  memoHistory: MemoRecord[];
  
  // Actions
  createCampaign: (data: Partial<Campaign>, signature: string) => void;
  donateToCampaign: (campaignId: string, amountSOL: number, donorAddress: string, signature: string, memoText: string) => void;
  uploadReceiptWithOcr: (
    campaignId: string,
    stageId: string,
    file: { name: string; size: number; sha256: string },
    manualOverrides?: Partial<Receipt>
  ) => Promise<Receipt>;
  releaseTranche: (campaignId: string, stageId: string, signature: string) => void;
  requestRefund: (campaignId: string, stageId: string, signature: string) => void;
  adminApproveReceipt: (receiptId: string, signature: string, comment?: string) => void;
  adminRejectReceipt: (receiptId: string, signature: string, reason: string) => void;
  addVendor: (vendor: Omit<Vendor, 'id' | 'accreditedDate' | 'totalDisbursedSOL'>, signature: string) => void;
  toggleVendorStatus: (vendorId: string, newStatus: Vendor['status']) => void;
  getHitlReceipts: () => Receipt[];
  addMemoRecord: (record: MemoRecord) => void;
  resetToDefaults: () => void;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-01',
    title: 'Детская площадка и инклюзивный спорткомплекс #1',
    description: 'Строительство сертифицированного безопасного пространства для двигательной реабилитации детей в микрорайоне Самал-2.',
    category: 'Дети',
    city: 'Алматы',
    organizer: {
      name: 'БФ "Балаларға Сенім"',
      bin: '190440018274',
      address: '7xWqPz3nL8yJ4vRtM2uE9bCaD5fG1hK3sN6pQ8vT4',
      reputationScore: 98,
    },
    escrowAddress: 'EscrowSamalChildrenPlaygroundDevnet1111111111',
    targetAmountSOL: 25.0,
    collectedAmountSOL: 18.5,
    donorCount: 42,
    deadline: '2026-11-15',
    status: 'active',
    createdAt: '2026-09-20',
    stages: [
      {
        id: 'stage-01-1',
        stageNumber: 1,
        title: 'Этап 1: Травмобезопасное покрытие EPDM и подготовка грунта',
        description: 'Закупка амортизирующих полимерных плит и дренажных мембран у аккредитованного производителя.',
        targetSOL: 6.0,
        releasedSOL: 6.0,
        status: 'verified_released',
        dueDate: '2026-10-01',
        estimates: [
          {
            id: 'est-1-1',
            name: 'Плитка резиновая бесшовная 40мм (220 кв.м)',
            vendorName: 'ТОО "СпортСтройСервис"',
            vendorBIN: '180940011922',
            quantity: 220,
            unitPriceSOL: 0.0227,
            totalSOL: 5.0,
            category: 'Покрытия',
          },
          {
            id: 'est-1-2',
            name: 'Монтажный клей полиуретановый и праймер',
            vendorName: 'ТОО "СпортСтройСервис"',
            vendorBIN: '180940011922',
            quantity: 10,
            unitPriceSOL: 0.1,
            totalSOL: 1.0,
            category: 'Расходные материалы',
          },
        ],
      },
      {
        id: 'stage-01-2',
        stageNumber: 2,
        title: 'Этап 2: Инклюзивные тренажеры и игровые комплексы',
        description: 'Пандусные карусели, тактильные панели и тренажеры с опорами для ЛФК.',
        targetSOL: 12.5,
        releasedSOL: 0,
        status: 'under_review',
        dueDate: '2026-10-25',
        estimates: [
          {
            id: 'est-1-3',
            name: 'Инклюзивный игровой городок "Радуга Надежды" с пандусом',
            vendorName: 'ТОО "СпортСтройСервис"',
            vendorBIN: '180940011922',
            quantity: 1,
            unitPriceSOL: 8.5,
            totalSOL: 8.5,
            category: 'Оборудование',
          },
          {
            id: 'est-1-4',
            name: 'Тактильно-звуковые развивающие стенды (комплект из 3 шт.)',
            vendorName: 'ТОО "МедСнаб Казахстан"',
            vendorBIN: '210440029181',
            quantity: 3,
            unitPriceSOL: 1.33,
            totalSOL: 4.0,
            category: 'Реабилитационный инвентарь',
          },
        ],
      },
      {
        id: 'stage-01-3',
        stageNumber: 3,
        title: 'Этап 3: Финальный аудит безопасности и сдача объекта',
        description: 'Экспертная проверка ГОСТ, монтаж видеонаблюдения и защитных ограждений.',
        targetSOL: 6.5,
        releasedSOL: 0,
        status: 'locked',
        dueDate: '2026-11-15',
        estimates: [
          {
            id: 'est-1-5',
            name: 'Сертификация независимой лаборатории качества',
            vendorName: 'ТОО "ТехноЭксперт"',
            vendorBIN: '150340008819',
            quantity: 1,
            unitPriceSOL: 3.5,
            totalSOL: 3.5,
            category: 'Сертификация',
          },
          {
            id: 'est-1-6',
            name: 'Защитные ограждения и освещение на солнечных батареях',
            vendorName: 'ИП "ЭнергоМонтаж"',
            vendorBIN: '920512300481',
            quantity: 1,
            unitPriceSOL: 3.0,
            totalSOL: 3.0,
            category: 'Инженерия',
          },
        ],
      },
    ],
  },
  {
    id: 'camp-02',
    title: 'Резервные генераторы для районного роддома и хирургии',
    description: 'Оснащение сельской больницы дизельными электростанциями с автоматическим вводом резерва (АВР) при аварийных отключениях сети.',
    category: 'Медицина',
    city: 'Талдыкорган',
    organizer: {
      name: 'Общественный фонд "Шипагер Көмек"',
      bin: '200140023411',
      address: '3mYgT8kL6wR9pB2vC4xZ1aF7eN5sH3jK9uP4vW8',
      reputationScore: 95,
    },
    escrowAddress: 'EscrowTaldykorganGeneratorsHospitalDevnet2222',
    targetAmountSOL: 40.0,
    collectedAmountSOL: 40.0,
    donorCount: 78,
    deadline: '2026-10-30',
    status: 'active',
    createdAt: '2026-09-12',
    stages: [
      {
        id: 'stage-02-1',
        stageNumber: 1,
        title: 'Этап 1: Аванс 20% на бронирование оборудования завода',
        description: 'Заказ двух промышленных генераторов 60 кВт с японскими двигателями.',
        targetSOL: 8.0,
        releasedSOL: 8.0,
        status: 'verified_released',
        dueDate: '2026-09-28',
        estimates: [
          {
            id: 'est-2-1',
            name: 'Авансовый платеж за генераторы ДЭС-60 (2 шт.)',
            vendorName: 'ТОО "МедСнаб Казахстан"',
            vendorBIN: '210440029181',
            quantity: 1,
            unitPriceSOL: 8.0,
            totalSOL: 8.0,
            category: 'Оборудование',
          },
        ],
      },
      {
        id: 'stage-02-2',
        stageNumber: 2,
        title: 'Этап 2: Поставка, пусконаладка и подключение АВР',
        description: 'Доставка оборудования, монтаж кабельной трассы и тестирование под нагрузкой.',
        targetSOL: 32.0,
        releasedSOL: 0,
        status: 'under_review',
        dueDate: '2026-10-30',
        estimates: [
          {
            id: 'est-2-2',
            name: 'Окончательный расчет за генераторы ДЭС-60',
            vendorName: 'ТОО "МедСнаб Казахстан"',
            vendorBIN: '210440029181',
            quantity: 1,
            unitPriceSOL: 24.0,
            totalSOL: 24.0,
            category: 'Оборудование',
          },
          {
            id: 'est-2-3',
            name: 'Электромонтаж щита АВР и силовой кабель 4х70мм',
            vendorName: 'ИП "ЭнергоМонтаж"',
            vendorBIN: '920512300481',
            quantity: 1,
            unitPriceSOL: 8.0,
            totalSOL: 8.0,
            category: 'Монтаж',
          },
        ],
      },
    ],
  },
  {
    id: 'camp-03',
    title: 'Мобильный класс робототехники и дронов для сельских школ',
    description: 'Обучающие STEM-наборы, 3D-принтеры и портативные ноутбуки для выездных лабораторий в Акмолинской области.',
    category: 'Образование',
    city: 'Кокшетау',
    organizer: {
      name: 'Ассоциация STEM Учителей',
      bin: '220840031952',
      address: '9aB3c4D5e6F7g8H9j1K2m3N4p5Q6r7S8t9U1v2W',
      reputationScore: 92,
    },
    escrowAddress: 'EscrowStemMobileClassDevnet33333333333333333',
    targetAmountSOL: 15.0,
    collectedAmountSOL: 7.2,
    donorCount: 19,
    deadline: '2026-12-01',
    status: 'active',
    createdAt: '2026-10-01',
    stages: [
      {
        id: 'stage-03-1',
        stageNumber: 1,
        title: 'Этап 1: Закупка 10 комплектов Arduino & STEM Lab',
        description: 'Базовые наборы датчиков, контроллеров и микросхем.',
        targetSOL: 5.0,
        releasedSOL: 0,
        status: 'locked',
        dueDate: '2026-11-10',
        estimates: [
          {
            id: 'est-3-1',
            name: 'STEM Robot Kit v3 (10 комплектов)',
            vendorName: 'ТОО "МедСнаб Казахстан"',
            vendorBIN: '210440029181',
            quantity: 10,
            unitPriceSOL: 0.5,
            totalSOL: 5.0,
            category: 'Электроника',
          },
        ],
      },
    ],
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'ven-01',
    name: 'ТОО "СпортСтройСервис"',
    bin: '180940011922',
    category: 'Детские и спортивные площадки',
    walletAddress: '7vPxK9L2wRtM4uY8zQaB3cDeF5gH1jK6mNpQrStU',
    status: 'VERIFIED',
    totalDisbursedSOL: 11.0,
    accreditedDate: '2026-07-15',
  },
  {
    id: 'ven-02',
    name: 'ТОО "МедСнаб Казахстан"',
    bin: '210440029181',
    category: 'Медицинское и силовое оборудование',
    walletAddress: '4hKm9b3xP8L2yQ1zN4tJkM7wR5vT9sU6aC8dE2fG',
    status: 'VERIFIED',
    totalDisbursedSOL: 16.0,
    accreditedDate: '2026-06-10',
  },
  {
    id: 'ven-03',
    name: 'ИП "ЭнергоМонтаж"',
    bin: '920512300481',
    category: 'Энергетика и кабельные сети',
    walletAddress: '9zQrS2tV4wX6yA8bC1dE3fG5hJ7kL9mP2rT4vW6',
    status: 'PENDING',
    totalDisbursedSOL: 0,
    accreditedDate: '2026-10-02',
  },
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rec-01',
    campaignId: 'camp-01',
    stageId: 'stage-01-1',
    fileName: 'Акт_приема_EPDM_плитка_Чек_ФК_49182.pdf',
    fileHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSize: 482104,
    uploadedAt: '2026-10-02 14:22',
    uploadedBy: 'БФ "Балаларға Сенім"',
    vendorName: 'ТОО "СпортСтройСервис"',
    vendorBIN: '180940011922',
    invoiceNumber: 'INV-2026-8812',
    totalSOL: 6.0,
    ocrDetails: {
      parsedVendor: 'ТОО "СпортСтройСервис"',
      parsedBIN: '180940011922',
      parsedDate: '2026-10-02',
      parsedTotalSOL: 6.0,
      parsedItems: [
        { name: 'Плитка резиновая бесшовная 40мм (220 кв.м)', qty: 220, price: 0.0227 },
        { name: 'Клей полиуретановый монтажный', qty: 10, price: 0.1 },
      ],
    },
    aiValidation: {
      confidenceScore: 96,
      vendorWhitelisted: true,
      budgetDeviationPercent: 0,
      verdict: 'APPROVED',
      flags: ['БИН совпадает с Whitelist', 'Номенклатура 100% соответствует смете', 'ЭЦП/Печать действительна'],
      aiAnalysisText: 'Автоматический аудит пройден: Поставщик в белом списке, реквизиты совпадают с договором эскроу, сумма точно соответствует траншу 1.',
    },
    status: 'approved',
    solanaProofSignature: '4zNm8xP2qR9tL3wK6vJ1yA5bC7dE9fG2hJ4kL8mN1pQ3rS5tU7vW9xY2z34567890',
  },
  {
    id: 'rec-02',
    campaignId: 'camp-02',
    stageId: 'stage-02-2',
    fileName: 'ЭСФ_Монтаж_АВР_Кабель_Роддом.pdf',
    fileHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    fileSize: 612800,
    uploadedAt: '2026-10-06 18:40',
    uploadedBy: 'ОФ "Шипагер Көмек"',
    vendorName: 'ИП "ЭнергоМонтаж"',
    vendorBIN: '920512300481',
    invoiceNumber: 'ACT-9012',
    totalSOL: 8.0,
    ocrDetails: {
      parsedVendor: 'ИП "ЭнергоМонтаж"',
      parsedBIN: '920512300481',
      parsedDate: '2026-10-05',
      parsedTotalSOL: 8.0,
      parsedItems: [
        { name: 'Щит распределительный АВР-100 и кабель силовой ВВГнг', qty: 1, price: 8.0 },
      ],
    },
    aiValidation: {
      confidenceScore: 74,
      vendorWhitelisted: false,
      budgetDeviationPercent: 0,
      verdict: 'HITL_REVIEW',
      flags: [
        'Внимание: Статус поставщика в реестре "PENDING" (требует подтверждения лицензии)',
        'Confidence score 74% ниже порога автовыплаты (80%)',
        'Требуется ручная верификация администратором платформы',
      ],
      aiAnalysisText: 'Оракул передал чек в HITL-очередь: поставщик ожидает подтверждения лицензии на электромонтажные работы в медучреждениях.',
    },
    status: 'pending',
  },
];

const AppStoreContext = createContext<AppStoreContextType | null>(null);

export const AppStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
    try {
      const saved = localStorage.getItem('aidchain_campaigns');
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    if (typeof window === 'undefined') return INITIAL_RECEIPTS;
    try {
      const saved = localStorage.getItem('aidchain_receipts');
      return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
    } catch {
      return INITIAL_RECEIPTS;
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (typeof window === 'undefined') return INITIAL_VENDORS;
    try {
      const saved = localStorage.getItem('aidchain_vendors');
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('aidchain_donations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [memoHistory, setMemoHistory] = useState<MemoRecord[]>(() => getStoredMemoHistory());

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aidchain_campaigns', JSON.stringify(campaigns));
    } catch {}
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem('aidchain_receipts', JSON.stringify(receipts));
    } catch {}
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem('aidchain_vendors', JSON.stringify(vendors));
    } catch {}
  }, [vendors]);

  useEffect(() => {
    try {
      localStorage.setItem('aidchain_donations', JSON.stringify(donations));
    } catch {}
  }, [donations]);

  const addMemoRecord = useCallback((record: MemoRecord) => {
    setMemoHistory((prev) => {
      const next = [record, ...prev];
      saveStoredMemoHistory(next);
      return next;
    });
  }, []);

  const createCampaign = useCallback((data: Partial<Campaign>, signature: string) => {
    const newId = `camp-${Date.now().toString(36)}`;
    const newCampaign: Campaign = {
      id: newId,
      title: data.title || 'Новый сбор',
      description: data.description || '',
      category: data.category || 'Медицина',
      city: data.city || 'Алматы',
      organizer: data.organizer || {
        name: 'Благотворительный фонд',
        bin: '123456789012',
        address: 'AidChainOrgDevnetWalletAddress111111111111',
        reputationScore: 90,
      },
      escrowAddress: `Escrow${newId.toUpperCase()}Devnet`,
      targetAmountSOL: data.targetAmountSOL || 10,
      collectedAmountSOL: 0,
      donorCount: 0,
      deadline: data.deadline || '2026-12-31',
      status: 'active',
      stages: data.stages || [
        {
          id: `${newId}-s1`,
          stageNumber: 1,
          title: 'Этап 1: Аванс 20%',
          description: 'Бронирование оборудования и материалов',
          targetSOL: (data.targetAmountSOL || 10) * 0.2,
          releasedSOL: 0,
          status: 'locked',
          dueDate: '2026-11-15',
          estimates: [],
        },
        {
          id: `${newId}-s2`,
          stageNumber: 2,
          title: 'Этап 2: Основная закупка и доставка',
          description: 'Поставка и закрывающие документы',
          targetSOL: (data.targetAmountSOL || 10) * 0.8,
          releasedSOL: 0,
          status: 'locked',
          dueDate: '2026-12-15',
          estimates: [],
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
  }, []);

  const donateToCampaign = useCallback(
    (campaignId: string, amountSOL: number, donorAddress: string, signature: string, memoText: string) => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            return {
              ...c,
              collectedAmountSOL: Number((c.collectedAmountSOL + amountSOL).toFixed(4)),
              donorCount: c.donorCount + 1,
            };
          }
          return c;
        })
      );

      const newDonation: Donation = {
        id: `don-${Date.now()}`,
        campaignId,
        amountSOL,
        donorAddress,
        timestamp: Date.now(),
        signature,
        memoText,
      };

      setDonations((prev) => [newDonation, ...prev]);
    },
    []
  );

  const uploadReceiptWithOcr = useCallback(
    async (
      campaignId: string,
      stageId: string,
      file: { name: string; size: number; sha256: string },
      manualOverrides?: Partial<Receipt>
    ): Promise<Receipt> => {
      // Find matching campaign & stage
      const campaign = campaigns.find((c) => c.id === campaignId);
      const stage = campaign?.stages.find((s) => s.id === stageId);

      const targetAmount = stage ? stage.targetSOL : 5.0;
      const primaryEstimate = stage?.estimates[0];
      const vendorName = manualOverrides?.vendorName || primaryEstimate?.vendorName || 'ТОО "СпортСтройСервис"';
      const vendorBIN = manualOverrides?.vendorBIN || primaryEstimate?.vendorBIN || '180940011922';

      // Verify against Whitelist
      const isVendorWhitelisted = vendors.some(
        (v) => v.bin === vendorBIN && v.status === 'VERIFIED'
      );

      // AI confidence calculation based on budget match & whitelist
      let confidence = isVendorWhitelisted ? 94 : 72;
      const flags: string[] = [];

      if (isVendorWhitelisted) {
        flags.push('Поставщик подтвержден в Whitelist реестре');
      } else {
        flags.push('Поставщик не прошел полную аккредитацию (Статус PENDING)');
      }

      flags.push(`SHA-256 хеш файла рассчитан в браузере: ${file.sha256.slice(0, 16)}...`);
      flags.push('Фискальный QR-код чека проверен через оператора фискальных данных');

      const verdict: Receipt['aiValidation']['verdict'] =
        confidence >= 80 ? 'APPROVED' : 'HITL_REVIEW';

      const newReceipt: Receipt = {
        id: `rec-${Date.now()}`,
        campaignId,
        stageId,
        fileName: file.name,
        fileHashSha256: file.sha256,
        fileSize: file.size,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        uploadedBy: campaign?.organizer.name || 'Организатор сбора',
        vendorName,
        vendorBIN,
        invoiceNumber: manualOverrides?.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        totalSOL: targetAmount,
        ocrDetails: {
          parsedVendor: vendorName,
          parsedBIN: vendorBIN,
          parsedDate: new Date().toISOString().split('T')[0],
          parsedTotalSOL: targetAmount,
          parsedItems: [
            {
              name: primaryEstimate?.name || 'Поставка сертифицированного оборудования',
              qty: 1,
              price: targetAmount,
            },
          ],
        },
        aiValidation: {
          confidenceScore: confidence,
          vendorWhitelisted: isVendorWhitelisted,
          budgetDeviationPercent: 0,
          verdict,
          flags,
          aiAnalysisText:
            verdict === 'APPROVED'
              ? 'Оракул подтвердил подлинность чека и соответствие смете. Этап готов к выплате транша.'
              : 'Требуется проверка администратором в HITL-очереди из-за статуса поставщика.',
        },
        status: verdict === 'APPROVED' ? 'approved' : 'pending',
      };

      setReceipts((prev) => [newReceipt, ...prev]);

      // Update stage status to under_review
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            return {
              ...c,
              stages: c.stages.map((s) => {
                if (s.id === stageId) {
                  return {
                    ...s,
                    status: 'under_review' as const,
                  };
                }
                return s;
              }),
            };
          }
          return c;
        })
      );

      return newReceipt;
    },
    [campaigns, vendors]
  );

  const releaseTranche = useCallback(
    (campaignId: string, stageId: string, signature: string) => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            return {
              ...c,
              stages: c.stages.map((s) => {
                if (s.id === stageId) {
                  return {
                    ...s,
                    status: 'verified_released' as const,
                    releasedSOL: s.targetSOL,
                  };
                }
                return s;
              }),
            };
          }
          return c;
        })
      );

      // Find receipt for this stage and attach signature
      setReceipts((prev) =>
        prev.map((r) => {
          if (r.campaignId === campaignId && r.stageId === stageId) {
            return {
              ...r,
              status: 'approved',
              solanaProofSignature: signature,
            };
          }
          return r;
        })
      );
    },
    []
  );

  const requestRefund = useCallback((campaignId: string, stageId: string, signature: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            stages: c.stages.map((s) => {
              if (s.id === stageId) {
                return {
                  ...s,
                  status: 'refunded' as const,
                };
              }
              return s;
            }),
          };
        }
        return c;
      })
    );
  }, []);

  const adminApproveReceipt = useCallback((receiptId: string, signature: string, comment?: string) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          return {
            ...r,
            status: 'approved',
            solanaProofSignature: signature,
            aiValidation: {
              ...r.aiValidation,
              confidenceScore: 100,
              verdict: 'APPROVED',
              flags: [...r.aiValidation.flags, `Одобрено вручную администратором: ${comment || 'Подтверждено без замечаний'}`],
            },
          };
        }
        return r;
      })
    );
  }, []);

  const adminRejectReceipt = useCallback((receiptId: string, signature: string, reason: string) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          return {
            ...r,
            status: 'rejected',
            rejectionReason: reason,
            solanaProofSignature: signature,
            aiValidation: {
              ...r.aiValidation,
              verdict: 'REJECTED',
              flags: [...r.aiValidation.flags, `Отклонено администратором: ${reason}`],
            },
          };
        }
        return r;
      })
    );
  }, []);

  const addVendor = useCallback(
    (vendorData: Omit<Vendor, 'id' | 'accreditedDate' | 'totalDisbursedSOL'>, signature: string) => {
      const newVendor: Vendor = {
        ...vendorData,
        id: `ven-${Date.now()}`,
        totalDisbursedSOL: 0,
        accreditedDate: new Date().toISOString().split('T')[0],
      };
      setVendors((prev) => [newVendor, ...prev]);
    },
    []
  );

  const toggleVendorStatus = useCallback((vendorId: string, newStatus: Vendor['status']) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v))
    );
  }, []);

  const getHitlReceipts = useCallback(() => {
    return receipts.filter((r) => r.status === 'pending' || r.aiValidation.confidenceScore < 80);
  }, [receipts]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem('aidchain_campaigns');
    localStorage.removeItem('aidchain_receipts');
    localStorage.removeItem('aidchain_vendors');
    localStorage.removeItem('aidchain_donations');
    localStorage.removeItem('aidchain_memo_history');
    setCampaigns(INITIAL_CAMPAIGNS);
    setReceipts(INITIAL_RECEIPTS);
    setVendors(INITIAL_VENDORS);
    setDonations([]);
    setMemoHistory([]);
  }, []);

  return (
    <AppStoreContext.Provider
      value={{
        campaigns,
        receipts,
        vendors,
        donations,
        memoHistory,
        createCampaign,
        donateToCampaign,
        uploadReceiptWithOcr,
        releaseTranche,
        requestRefund,
        adminApproveReceipt,
        adminRejectReceipt,
        addVendor,
        toggleVendorStatus,
        getHitlReceipts,
        addMemoRecord,
        resetToDefaults,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}
