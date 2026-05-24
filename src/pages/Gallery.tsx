import { useState, useEffect } from 'react';
import { X, Play, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GalleryItem = {
  id: string;
  title: string;
  category: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  is_published?: boolean;
};

const categories = ['All', 'Clinic', 'Doctors', 'Promotions', 'Google Images', 'Videos'];

const staticItems: GalleryItem[] = [
  { id: 's1', title: 'Consultation Room',  category: 'Clinic',     media_url: '/images/Clinic_Pictures_(2).jpg', media_type: 'image' },
  { id: 's2', title: 'Treatment Area',      category: 'Clinic',     media_url: '/images/Clinic_Pictures_(3).jpg', media_type: 'image' },
  { id: 's3', title: 'Physiotherapy Unit',  category: 'Clinic',     media_url: '/images/Clinic_Pictures_(6).PNG', media_type: 'image' },
  { id: 's4', title: 'Medical Bay',         category: 'Clinic',     media_url: '/images/Clinic_Pictures_(7).jpg', media_type: 'image' },
  { id: 's5', title: 'Professional Setup',  category: 'Clinic',     media_url: '/images/Clinic_Pictures_(8).jpg', media_type: 'image' },
  { id: 's6', title: 'Surgical Care',       category: 'Clinic',     media_url: '/images/Surgery.PNG',             media_type: 'image' },
  { id: 's7', title: 'Dr. Aravindasamy M',  category: 'Doctors',    media_url: '/images/Aravind.PNG',             media_type: 'image' },
  { id: 's8', title: 'Dr. Vishali G',       category: 'Doctors',    media_url: '/images/vishali.PNG',             media_type: 'image' },
  { id: 's9', title: 'Clinic Banner',       category: 'Promotions', media_url: '/images/Logo-banner.png',         media_type: 'image' },
];

type Lightbox = { url: string; type: 'image' | 'video'; title: string };

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [dbItems, setDbItems] = useState<GalleryItem[]>([]);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('gallery_items')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setDbItems(data);
        setLoading(false);
      });
  }, []);

  // Merge static + DB, deduplicate by media_url
  const seenUrls = new Set<string>();
  const allItems: GalleryItem[] = [];
  for (const item of [...staticItems, ...dbItems]) {
    if (!seenUrls.has(item.media_url)) {
      seenUrls.add(item.media_url);
      allItems.push(item);
    }
  }

  const filtered =
    activeCategory === 'All'    ? allItems :
    activeCategory === 'Videos' ? allItems.filter(i => i.media_type === 'video') :
    allItems.filter(i => i.category === activeCategory);

  const visible = filtered.filter(i => !brokenIds.has(i.id));

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Clinic</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Photo & Video Gallery</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            A glimpse into our state-of-the-art facilities and dedicated medical team.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeCategory === c ? 'bg-[#0F9FA8] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8]'
                }`}>
                {c === 'Videos' && <Film size={13} />}{c}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" />
            </div>
          )}

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {visible.map(item => (
              <div key={item.id}
                className="break-inside-avoid rounded-2xl overflow-hidden shadow-card cursor-pointer group card-hover"
                onClick={() => setLightbox({ url: item.media_url, type: item.media_type, title: item.title })}>
                <div className="relative overflow-hidden">
                  {item.media_type === 'video' ? (
                    <div className="relative aspect-video bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8] flex items-center justify-center">
                      {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                      <div className="relative z-10 w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center group-hover:bg-white/40 transition-all">
                        <Play size={24} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                  ) : (
                    <img src={item.media_url} alt={item.title}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={() => setBrokenIds(prev => new Set([...prev, item.id]))} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0F9FA8]/80 text-white">{item.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loading && visible.length === 0 && (
            <div className="text-center py-16 text-gray-400">No items in this category yet.</div>
          )}
        </div>
      </section>

      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
            onClick={() => setLightbox(null)}><X size={20} /></button>
          {lightbox.type === 'video'
            ? <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl" onClick={e => e.stopPropagation()} />
            : <img src={lightbox.url} alt={lightbox.title} className="max-w-full max-h-[90vh] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
          }
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">{lightbox.title}</p>
        </div>
      )}
    </div>
  );
}
