import React, { useEffect, useRef } from 'react';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  FileCheck2,
  Cpu,
  Layers,
  CheckCircle2,
  Building2,
  Truck,
  UserCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../app/AppLayout';

interface LandingPageProps {
  onLaunchApp: (initialRole?: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Canvas dynamic particle / mesh animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;
    }> = [];

    const colors = ['#4d8bff', '#5ad1ff', '#8b6bff'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(77, 139, 255, ${0.15 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05060d] text-slate-100 overflow-hidden font-sans">
      {/* Dynamic 3D/Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
      />

      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#4d8bff]/15 via-[#8b6bff]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Navbar */}
      <header className="relative z-10 border-b border-[#141a33] bg-[#05060d]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4d8bff] via-[#5ad1ff] to-[#8b6bff] p-0.5 shadow-lg shadow-[#4d8bff]/20">
              <div className="w-full h-full bg-[#05060d] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#5ad1ff]" />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white">AidChain</span>
              <span className="ml-1.5 text-[10px] font-mono text-[#8b6bff] bg-[#8b6bff]/10 border border-[#8b6bff]/20 px-1.5 py-0.2 rounded">
                ClearGrant
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Архитектура эскроу
            </a>
            <a href="#ai-oracle" className="hover:text-white transition-colors">
              AI-Оракул &amp; OCR
            </a>
            <a href="#solana" className="hover:text-white transition-colors">
              Solana Devnet
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Роли платформы
            </a>
          </div>

          <button
            onClick={() => onLaunchApp('donor')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#8b6bff] hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-[#4d8bff]/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Запустить dApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111936] border border-[#233566] text-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Подключено к</span>
          <span className="font-mono text-[#5ad1ff] font-semibold">Solana Devnet</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-[11px] text-slate-400">SPL Memo v2</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-white leading-tight">
          Децентрализованная благотворительность с{' '}
          <span className="bg-gradient-to-r from-[#4d8bff] via-[#5ad1ff] to-[#8b6bff] bg-clip-text text-transparent">
            траншевым эскроу
          </span>{' '}
          и AI-валидацией чеков
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          AidChain (ClearGrant) устраняет недоверие к благотворительным фондам: пожертвования не выплачиваются разом, а блокируются в смарт-эскроу на Solana и размораживаются поэтапно только после сверки фискальных чеков оракулом.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onLaunchApp('donor')}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#4d8bff] to-[#5ad1ff] hover:opacity-95 text-white text-sm font-semibold shadow-xl shadow-[#4d8bff]/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Войти в dApp (Кабинет Донора)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onLaunchApp('foundation')}
            className="px-6 py-3.5 rounded-xl bg-[#0a0d1c] hover:bg-[#121833] border border-[#252f55] text-slate-200 text-sm font-medium transition-colors cursor-pointer"
          >
            <span>Кабинет Фонда / Организатора</span>
          </button>
        </div>

        {/* Quantitative Proof Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#0a0d1c]/80 border border-[#1a213d] backdrop-blur-sm">
            <div className="text-xs text-slate-400">Собрано в эскроу:</div>
            <div className="text-xl font-bold font-mono text-white mt-1">65.7 SOL</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">В сети Solana Devnet</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0d1c]/80 border border-[#1a213d] backdrop-blur-sm">
            <div className="text-xs text-slate-400">Прозрачность расходов:</div>
            <div className="text-xl font-bold font-mono text-[#5ad1ff] mt-1">100%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Фискальные чеки SHA-256</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0d1c]/80 border border-[#1a213d] backdrop-blur-sm">
            <div className="text-xs text-slate-400">AI Oracle точность:</div>
            <div className="text-xl font-bold font-mono text-[#8b6bff] mt-1">94.8%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">OCR + HITL арбитраж</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0d1c]/80 border border-[#1a213d] backdrop-blur-sm">
            <div className="text-xs text-slate-400">Гарантия возврата:</div>
            <div className="text-xl font-bold font-mono text-[#ff5c7a] mt-1">Smart Refund</div>
            <div className="text-[10px] text-slate-400 mt-0.5">При срыве дедлайнов</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / ESCROW ARCHITECTURE */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-[#141a33]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-[#5ad1ff] uppercase tracking-wider font-semibold">
            Zero-Trust Escrow Protocol
          </span>
          <h2 className="text-3xl font-bold font-display text-white mt-2">
            Как AidChain защищает каждый SOL от нецелевых трат
          </h2>
          <p className="text-xs text-slate-400 mt-3">
            Четыре автоматических барьера между средствами благотворителя и счетами подрядчиков
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#4d8bff]/10 border border-[#4d8bff]/20 flex items-center justify-center text-[#4d8bff] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">1. Взнос в эскроу</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Донор отправляет взнос через Phantom Wallet. Транзакция маркируется в SPL Memo, средства замораживаются в смарт-эскроу.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#141b36] text-[11px] font-mono text-[#5ad1ff]">
              Devnet Escrow
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#5ad1ff]/10 border border-[#5ad1ff]/20 flex items-center justify-center text-[#5ad1ff] mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">2. Поэтапный отчет</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Фонд выполняет этап (напр. закупка плит) и загружает фискальный чек или ЭСФ. Хеш SHA-256 вычисляется локально в браузере.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#141b36] text-[11px] font-mono text-[#5ad1ff]">
              SHA-256 Fingerprint
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#8b6bff]/10 border border-[#8b6bff]/20 flex items-center justify-center text-[#8b6bff] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">3. AI-Оракул + HITL</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                OCR распознает БИН, сумму и позиции сметы. При скоре доверия &gt; 80% транш одобряется; при сомнениях подключается админ (HITL).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#141b36] text-[11px] font-mono text-[#8b6bff]">
              Oracle Confidence
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] relative flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">4. Прямая выплата</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Средства переводятся напрямую на верифицированный кошелек поставщика (Whitelist). Фонд не может снять деньги бесконтрольно.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#141b36] text-[11px] font-mono text-emerald-400">
              Direct Whitelist Pay
            </div>
          </div>
        </div>
      </section>

      {/* ROLE CABINET SELECTOR */}
      <section id="roles" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#141a33]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold font-display text-white">
            Интерфейсы для всех участников процесса
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Выберите роль для входа в специализированный личный кабинет платформы
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onLaunchApp('donor')}
            className="p-5 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] hover:border-[#4d8bff] text-left transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#4d8bff]/15 text-[#5ad1ff] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">Кабинет Донора</h4>
            <p className="text-xs text-slate-400 mt-1">
              Каталог сборов, донаты через Memo, лента чеков и возврат средств.
            </p>
            <div className="mt-4 text-xs font-medium text-[#5ad1ff] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Войти</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onLaunchApp('foundation')}
            className="p-5 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] hover:border-[#4d8bff] text-left transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#5ad1ff]/15 text-[#5ad1ff] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">Кабинет Фонда</h4>
            <p className="text-xs text-slate-400 mt-1">
              Создание сборов, drag-and-drop загрузка чеков с SHA-256 и запрос траншей.
            </p>
            <div className="mt-4 text-xs font-medium text-[#5ad1ff] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Войти</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onLaunchApp('vendor')}
            className="p-5 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] hover:border-[#4d8bff] text-left transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8b6bff]/15 text-[#8b6bff] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">Кабинет Поставщика</h4>
            <p className="text-xs text-slate-400 mt-1">
              Статус в Whitelist, учет закрывающих актов и зачисление выплат.
            </p>
            <div className="mt-4 text-xs font-medium text-[#8b6bff] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Войти</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onLaunchApp('admin')}
            className="p-5 rounded-2xl bg-[#0a0d1c] border border-[#1b2344] hover:border-[#4d8bff] text-left transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#ff5c7a]/15 text-[#ff5c7a] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">Кабинет Администратора</h4>
            <p className="text-xs text-slate-400 mt-1">
              HITL-очередь сомнительных чеков, side-by-side инспектор и модерация Whitelist.
            </p>
            <div className="mt-4 text-xs font-medium text-[#ff5c7a] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Войти</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#141a33] bg-[#05060d] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-400">AidChain ClearGrant</span>
            <span>·</span>
            <span>Solana Devnet Memo Program</span>
          </div>
          <div>
            <span>© 2026 AidChain. Децентрализованная прозрачность благотворительности.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
