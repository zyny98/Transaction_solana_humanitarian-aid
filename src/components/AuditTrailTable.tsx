import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldCheck, Search, Filter } from 'lucide-react';
import { MemoRecord } from '../hooks/useSolanaMemo';

interface AuditTrailTableProps {
  records: MemoRecord[];
  title?: string;
  subtitle?: string;
  maxRows?: number;
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  records,
  title = 'Аудит-реестр транзакций Solana Devnet',
  subtitle = 'Неизменяемый журнал SPL Memo (Program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)',
  maxRows,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (sig: string, id: string) => {
    navigator.clipboard.writeText(sig);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.text.toLowerCase().includes(search.toLowerCase()) ||
      r.signature.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const displayList = maxRows ? filtered.slice(0, maxRows) : filtered;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-[#1e2640] bg-[#0a0d1c] p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#171c33]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5ad1ff]" />
            <h3 className="text-base font-semibold text-slate-100 font-display tracking-tight">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по тексту или подписи..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#11152a] border border-[#222b4a] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4d8bff] w-48 lg:w-64"
            />
          </div>

          <div className="flex items-center bg-[#11152a] p-1 rounded-lg border border-[#222b4a] text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-[#4d8bff] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({records.length})
            </button>
            <button
              onClick={() => setSelectedCategory('DONATION')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === 'DONATION'
                  ? 'bg-[#4d8bff] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Донаты
            </button>
            <button
              onClick={() => setSelectedCategory('TRANCHE_RELEASE')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === 'TRANCHE_RELEASE'
                  ? 'bg-[#4d8bff] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Транши
            </button>
            <button
              onClick={() => setSelectedCategory('ADMIN_OVERRIDE')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === 'ADMIN_OVERRIDE'
                  ? 'bg-[#4d8bff] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Аудит
            </button>
          </div>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Записей не найдено по текущим фильтрам
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-[#1a213d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Подпись транзакции</th>
                <th className="py-2.5 px-3">Содержимое SPL Memo</th>
                <th className="py-2.5 px-3 text-right">Время</th>
                <th className="py-2.5 px-3 text-center">Статус</th>
                <th className="py-2.5 px-3 text-right">Solana Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131930]">
              {displayList.map((item) => {
                const shortSig =
                  item.signature.length > 16
                    ? `${item.signature.slice(0, 6)}...${item.signature.slice(-6)}`
                    : item.signature;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#11162d] transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#5ad1ff]">{shortSig}</span>
                        <button
                          onClick={() => handleCopy(item.signature, item.id)}
                          title="Скопировать подпись"
                          className="p-1 hover:text-white text-slate-500 rounded transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      <div className="font-mono text-xs text-slate-200 break-words leading-relaxed">
                        {item.text}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Confirmed
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <a
                        href={item.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4d8bff] hover:text-[#5ad1ff] hover:underline"
                      >
                        <span>Посмотреть запись</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
