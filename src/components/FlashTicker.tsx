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
  const [tickerKey, setTickerKey] = useState(0);

  const loadNews = async () => {
    try {
      // Use maybeSingle() — never throws when 0 rows found
      const { data, error } = await supabase
        .from('flash_news')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) { console.warn('FlashTicker fetch error:', error.message); return; }

      if (data && data.message?.trim()) {
        setNews(prev => {
          // If content changed, reset dismissed and restart animation
          if (!prev || prev.id !== data.id || prev.message !== data.message || !prev.is_active) {
            setDismissed(false);
            setTickerKey(k => k + 1);
          }
          return data;
        });
      } else {
        setNews(null);
      }
    } catch (e) {
      console.warn('FlashTicker error:', e);
    }
  };

  useEffect(() => {
    loadNews();

    // Real-time subscription — updates instantly when admin broadcasts
    const channel = supabase
      .channel('flash_news_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_news' }, () => {
        loadNews();
      })
      .subscribe();

    // Fallback poll every 15 seconds
    const interval = setInterval(loadNews, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (!news || !news.is_active || !news.message.trim() || dismissed) return null;

  const theme = themeStyles[news.theme] || themeStyles.default;
  const duration = speedDuration[news.speed] || speedDuration.normal;

  return (
    <div key={tickerKey} className={`w-full border-b-2 ${theme} flex items-center overflow-hidden`} style={{ minHeight: '36px' }}>
      <style>{`
        @keyframes arvi-ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .arvi-ticker-text {
          display: inline-block;
          white-space: nowrap;
          animation: arvi-ticker ${duration} linear infinite;
          padding-right: 80px;
        }
        .arvi-ticker-text:hover { animation-play-state: paused; }
      `}</style>

      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 border-r border-white/20 z-10"
        style={{ background: 'rgba(0,0,0,0.15)' }}>
        <Megaphone size={14} />
        <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">Flash News</span>
      </div>

      {/* Scrolling message */}
      <div className="flex-1 overflow-hidden relative">
        <span className="arvi-ticker-text text-sm font-medium py-1.5">
          {news.message}
        </span>
      </div>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 hover:bg-white/20 transition-colors mx-1 rounded"
        aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
