import { useState, useEffect, useRef } from 'react';
import { Megaphone, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type FlashNews = {
  id: string; message: string; is_active: boolean;
  speed: string; theme: string; font_size: string;
};

const themeStyles: Record<string, string> = {
  default:   'bg-[#0A3D62] text-white',
  emergency: 'bg-red-600 text-white',
  info:      'bg-[#0F9FA8] text-white',
  success:   'bg-green-600 text-white',
};

const speedDuration: Record<string, string> = {
  slow: '40s', normal: '25s', fast: '12s',
};

const fontSizeClass: Record<string, string> = {
  normal: 'text-sm',
  medium: 'text-base',
  large:  'text-lg',
};

export default function FlashTicker() {
  const [news, setNews] = useState<FlashNews | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [tickerKey, setTickerKey] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Notify App.tsx about ticker visibility so it can adjust page top padding
  const notifyHeight = (visible: boolean, el?: HTMLDivElement | null) => {
    const h = visible && el ? el.offsetHeight : 0;
    window.dispatchEvent(new CustomEvent('ticker-resize', { detail: { height: h } }));
  };

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('flash_news')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) { console.warn('FlashTicker:', error.message); return; }
      if (data && data.message?.trim()) {
        setNews(prev => {
          if (!prev || prev.id !== data.id || prev.message !== data.message || !prev.is_active) {
            setDismissed(false);
            setTickerKey(k => k + 1);
          }
          return data;
        });
      } else {
        setNews(null);
        notifyHeight(false);
      }
    } catch (e) { console.warn('FlashTicker error:', e); }
  };

  useEffect(() => {
    loadNews();
    const channel = supabase
      .channel('flash_ticker_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_news' }, loadNews)
      .subscribe();
    const interval = setInterval(loadNews, 15000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, []);

  // When visibility changes, notify App.tsx with our height
  useEffect(() => {
    const visible = !!(news && news.is_active && news.message?.trim() && !dismissed);
    if (visible) {
      // Small delay to let DOM settle
      setTimeout(() => notifyHeight(true, tickerRef.current), 50);
    } else {
      notifyHeight(false);
    }
  }, [news, dismissed]);

  if (!news || !news.is_active || !news.message.trim() || dismissed) return null;

  const theme    = themeStyles[news.theme]     || themeStyles.default;
  const duration = speedDuration[news.speed]   || speedDuration.normal;
  const fontSize = fontSizeClass[news.font_size] || fontSizeClass.normal;

  return (
    <div ref={tickerRef} key={tickerKey}
      className={`w-full flex items-center overflow-hidden border-b border-white/20 ${theme}`}
      style={{ minHeight: '36px' }}>
      <style>{`
        @keyframes arvi-scroll {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .arvi-scroll {
          display: inline-block;
          white-space: nowrap;
          animation: arvi-scroll ${duration} linear infinite;
          padding-right: 80px;
        }
        .arvi-scroll:hover { animation-play-state: paused; }
      `}</style>

      {/* Label */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 border-r border-white/20"
        style={{ background: 'rgba(0,0,0,0.15)', minWidth: 'fit-content' }}>
        <Megaphone size={13} />
        <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">Flash News</span>
      </div>

      {/* Scrolling message */}
      <div className="flex-1 overflow-hidden">
        <span className={`arvi-scroll font-medium py-1.5 ${fontSize}`}>
          {news.message}
        </span>
      </div>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded transition-colors mx-1"
        aria-label="Dismiss flash news">
        <X size={13} />
      </button>
    </div>
  );
}
