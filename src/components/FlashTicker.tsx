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
  const [key, setKey] = useState(0); // force re-render when news changes

  const fetchNews = async () => {
    const { data } = await supabase
      .from('flash_news')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data && data.message?.trim()) {
      setNews(prev => {
        // If message changed, reset dismissed state and force re-render
        if (prev?.id !== data.id || prev?.message !== data.message || prev?.is_active !== data.is_active) {
          setDismissed(false);
          setKey(k => k + 1);
        }
        return data;
      });
    } else {
      setNews(null);
    }
  };

  useEffect(() => {
    fetchNews();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel('flash_news_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flash_news',
      }, () => {
        fetchNews();
      })
      .subscribe();

    // Fallback polling every 10s in case real-time is unavailable
    const interval = setInterval(fetchNews, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (!news || !news.is_active || !news.message.trim() || dismissed) return null;

  const theme = themeStyles[news.theme] || themeStyles.default;
  const duration = speedDuration[news.speed] || speedDuration.normal;

  return (
    <div key={key} className={`w-full border-b-2 ${theme} flex items-center overflow-hidden`} style={{ minHeight: '38px' }}>
      <style>{`
        @keyframes flash-ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .flash-ticker-text {
          display: inline-block;
          white-space: nowrap;
          animation: flash-ticker ${duration} linear infinite;
          padding-right: 100px;
        }
        .flash-ticker-text:hover { animation-play-state: paused; }
      `}</style>

      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0 border-r border-white/20 z-10" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <Megaphone size={14} />
        <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">Flash News</span>
      </div>

      {/* Scrolling message */}
      <div className="flex-1 overflow-hidden relative">
        <span className="flash-ticker-text text-sm font-medium py-2">
          📢 {news.message}
        </span>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 hover:bg-white/20 transition-colors mx-1 rounded"
        aria-label="Dismiss flash news"
      >
        <X size={14} />
      </button>
    </div>
  );
}
