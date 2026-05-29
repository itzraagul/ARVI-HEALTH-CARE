import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type FlashNews = { id: string; message: string; is_active: boolean; speed: string; theme: string; };

const themeStyles: Record<string, string> = {
  default:   'bg-[#0A3D62] text-white border-[#0F9FA8]',
  emergency: 'bg-red-600 text-white border-red-400',
  info:      'bg-[#0F9FA8] text-white border-teal-300',
  success:   'bg-green-600 text-white border-green-400',
};

const speedDuration: Record<string, string> = {
  slow: '40s', normal: '25s', fast: '12s',
};

export default function FlashTicker() {
  const [news, setNews] = useState<FlashNews | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('flash_news').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).single();
      if (data) { setNews(data); setDismissed(false); }
      else setNews(null);
    };
    fetch();
    // Poll every 30s for live updates
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!news || !news.is_active || !news.message.trim() || dismissed) return null;

  const theme = themeStyles[news.theme] || themeStyles.default;
  const duration = speedDuration[news.speed] || speedDuration.normal;

  return (
    <div className={`w-full border-b-2 ${theme} flex items-center overflow-hidden`} style={{ minHeight: '36px' }}>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-text {
          display: inline-block;
          white-space: nowrap;
          animation: ticker ${duration} linear infinite;
          padding-right: 80px;
        }
        .ticker-text:hover { animation-play-state: paused; }
      `}</style>

      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 border-r border-white/20 z-10" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <Megaphone size={14} />
        <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">Flash News</span>
      </div>

      {/* Scrolling message */}
      <div className="flex-1 overflow-hidden relative">
        <span className="ticker-text text-sm font-medium py-1.5">
          📢 {news.message}
        </span>
      </div>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 hover:bg-white/20 transition-colors mx-1 rounded">
        <X size={14} />
      </button>
    </div>
  );
}
