import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Play, Film, Heart, ChevronRight, FileText, Image as ImageIcon, Pin } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GalleryItem = {
  id: string; title: string; category: string;
  media_url: string; media_type: 'image' | 'video';
  thumbnail_url?: string; is_published?: boolean;
  is_pinned?: boolean; created_at?: string;
};

type StoryMedia = {
  id: string; story_id: string; media_url: string;
  media_type: string; caption?: string; file_name?: string;
  sort_order: number; is_pinned?: boolean; created_at?: string;
};

type PatientStory = {
  id: string; patient_name: string; treatment: string;
  description?: string; is_published: boolean; created_at: string;
  media?: StoryMedia[];
};

const CATEGORIES = ['All', 'Clinic', 'Doctors', 'Promotions', 'Google Images', 'Videos'];

const staticItems: GalleryItem[] = [
  { id: 's1', title: 'Consultation Room',  category: 'Clinic',     media_url: '/images/Clinic_Pictures_(2).jpg', media_type: 'image' },
  { id: 's2', title: 'Treatment Area',     category: 'Clinic',     media_url: '/images/Clinic_Pictures_(3).jpg', media_type: 'image' },
  { id: 's3', title: 'Physiotherapy Unit', category: 'Clinic',     media_url: '/images/Clinic_Pictures_(6).PNG', media_type: 'image' },
  { id: 's4', title: 'Medical Bay',        category: 'Clinic',     media_url: '/images/Clinic_Pictures_(7).jpg', media_type: 'image' },
  { id: 's5', title: 'Professional Setup', category: 'Clinic',     media_url: '/images/Clinic_Pictures_(8).jpg', media_type: 'image' },
  { id: 's6', title: 'Surgical Care',      category: 'Clinic',     media_url: '/images/Surgery.PNG',             media_type: 'image' },
  { id: 's7', title: 'Dr. Aravindasamy M', category: 'Doctors',    media_url: '/images/Aravind.PNG',             media_type: 'image' },
  { id: 's8', title: 'Dr. Vishali G',      category: 'Doctors',    media_url: '/images/vishali.PNG',             media_type: 'image' },
  { id: 's9', title: 'Clinic Banner',      category: 'Promotions', media_url: '/images/Logo-banner.png',         media_type: 'image' },
];

type Lightbox = { url: string; type: string; title: string };

export default function Gallery() {
  const location = useLocation();

  // ── Media Protection ─────────────────────────────────────────────────────
  useEffect(() => {
    // Block right-click context menu on entire page
    const blockContext = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'IMG' || t.tagName === 'VIDEO' || t.closest('.protected-media')) {
        e.preventDefault();
        return false;
      }
    };
    // Block keyboard shortcuts: Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I, Ctrl+Shift+J
    const blockKeys = (e: KeyboardEvent) => {
      const blocked = (
        (e.ctrlKey && ['s','u','p'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' || e.key === 'PrintScreen'
      );
      if (blocked) { e.preventDefault(); e.stopPropagation(); return false; }
    };
    // Block drag-and-drop of images
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
    };
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('dragstart', blockDrag);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('dragstart', blockDrag);
    };
  }, []);

  const getTabFromUrl = () => new URLSearchParams(location.search).get('tab') === 'stories' ? 'stories' : 'gallery';

  const [activeTab, setActiveTab] = useState<'gallery' | 'stories'>(getTabFromUrl);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [dbItems, setDbItems] = useState<GalleryItem[]>([]);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<PatientStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  // React to URL changes (when navigating from Navbar or hero ribbon)
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.search]);

  useEffect(() => {
    supabase.from('gallery_items').select('*').eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          // Pinned first, then newest
          const sorted = [
            ...data.filter((i: GalleryItem) => i.is_pinned),
            ...data.filter((i: GalleryItem) => !i.is_pinned),
          ];
          setDbItems(sorted);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (activeTab !== 'stories') return;
    setStoriesLoading(true);
    supabase.from('patient_stories').select('*, patient_story_media(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setStories(data.map((s: any) => {
          const raw: StoryMedia[] = (s.patient_story_media || []).sort((a: StoryMedia, b: StoryMedia) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
          return { ...s, media: [...raw.filter(m => m.is_pinned), ...raw.filter(m => !m.is_pinned)] };
        }));
        setStoriesLoading(false);
      });
  }, [activeTab]);

  const seenUrls = new Set<string>();
  const allItems: GalleryItem[] = [];
  for (const item of [...staticItems, ...dbItems]) {
    if (!seenUrls.has(item.media_url)) { seenUrls.add(item.media_url); allItems.push(item); }
  }

  const filtered =
    activeCategory === 'All'    ? allItems :
    activeCategory === 'Videos' ? allItems.filter(i => i.media_type === 'video') :
    allItems.filter(i => i.category === activeCategory);

  const visible = filtered.filter(i => !brokenIds.has(i.id));
  const isPdf = (url: string) => url.toLowerCase().includes('.pdf');

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Clinic</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Gallery & Patient Stories</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            A glimpse into our state-of-the-art facilities and the lives we have helped transform.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">

          {/* Main Tabs */}
          <div className="flex justify-center gap-4 mb-10">
            <button onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'gallery' ? 'bg-[#0A3D62] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <ImageIcon size={16} /> Photo & Video Gallery
            </button>
            <button onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all ${activeTab === 'stories' ? 'bg-[#0F9FA8] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Heart size={16} /> Patient Stories
            </button>
          </div>

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      activeCategory === c ? 'bg-[#0F9FA8] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8]'
                    }`}>
                    {c === 'Videos' && <Film size={13} />}{c}
                  </button>
                ))}
              </div>

              {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" /></div>}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {visible.map(item => (
                  <div key={item.id} className="flex flex-col cursor-pointer group"
                    onClick={() => setLightbox({ url: item.media_url, type: item.media_type, title: item.title })}>
                    <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm group-hover:shadow-lg transition-all protected-media"
                      onContextMenu={e => e.preventDefault()}>
                      <div className="absolute inset-0 z-[5]" onContextMenu={e => e.preventDefault()} style={{WebkitUserSelect:'none',userSelect:'none'}} />
                      {item.is_pinned && (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                          <Pin size={8} /> Pinned
                        </span>
                      )}
                      {item.media_type === 'video' ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8]">
                          {item.thumbnail_url && (
                            <img src={item.thumbnail_url} alt={item.title}
                              className="w-full h-full object-cover opacity-80 select-none"
                              draggable={false} onContextMenu={e => e.preventDefault()} />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/30 border border-white/50 flex items-center justify-center group-hover:bg-white/50 transition-all">
                              <Play size={18} className="text-white ml-0.5" fill="white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img src={item.media_url} alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                          loading="lazy" draggable={false}
                          onContextMenu={e => e.preventDefault()}
                          onError={() => setBrokenIds(prev => new Set([...prev, item.id]))} />
                      )}
                    </div>
                    <div className="mt-2 px-0.5">
                      <p className="text-xs font-semibold text-[#0A3D62] truncate group-hover:text-[#0F9FA8] transition-colors" title={item.title}>{item.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 uppercase">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!loading && visible.length === 0 && <div className="text-center py-16 text-gray-400">No items in this category yet.</div>}
            </>
          )}

          {/* PATIENT STORIES TAB */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              {storiesLoading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" /></div>}

              {!storiesLoading && stories.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No patient stories yet.</p>
                </div>
              )}

              {stories.map(story => (
                <div key={story.id} className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
                  <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F9FA8] to-[#0A3D62] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {story.patient_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0A3D62] text-lg">{story.patient_name}</h3>
                        <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#0F9FA8]/10 text-[#0F9FA8] text-xs font-semibold">{story.treatment}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 hidden sm:block">{story.media?.length || 0} file{(story.media?.length || 0) !== 1 ? 's' : ''}</span>
                      <ChevronRight size={20} className={`text-gray-400 transition-transform duration-300 ${expandedStory === story.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {expandedStory === story.id && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {story.description && <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-5">{story.description}</p>}
                      {story.media && story.media.length > 0 ? (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            {story.media.length} file{story.media.length !== 1 ? 's' : ''}
                            {story.media.some(m => m.is_pinned) && <span className="ml-2 text-amber-500">· 📌 pinned first</span>}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {story.media.map(m => (
                              <div key={m.id} className="flex flex-col group cursor-pointer">
                                <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm group-hover:shadow-md transition-all"
                                  onContextMenu={e => e.preventDefault()}>
                                  {m.is_pinned && (
                                    <span className="absolute top-1.5 left-1.5 z-10 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">📌</span>
                                  )}
                                  {m.media_type === 'image' ? (
                                    <div className="w-full h-full" onClick={() => setLightbox({ url: m.media_url, type: 'image', title: m.file_name || story.patient_name })}>
                                      <img src={m.media_url} alt={m.file_name || 'image'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                                        draggable={false} onContextMenu={e => e.preventDefault()} loading="lazy" />
                                    </div>
                                  ) : m.media_type === 'video' ? (
                                    <div className="w-full h-full bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8]"
                                      onClick={() => setLightbox({ url: m.media_url, type: 'video', title: m.file_name || story.patient_name })}>
                                      {m.thumbnail_url && (
                                        <img src={m.thumbnail_url} alt="thumb"
                                          className="w-full h-full object-cover opacity-80 select-none"
                                          draggable={false} onContextMenu={e => e.preventDefault()} loading="lazy" />
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/30 border border-white/50 flex items-center justify-center group-hover:bg-white/50 transition-all">
                                          <Play size={18} className="text-white ml-0.5" fill="white" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : m.media_type === 'pdf' ? (
                                    <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                                      className="w-full h-full flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 transition-colors">
                                      <FileText size={36} className="text-red-400 mb-1" />
                                      <span className="text-[10px] font-bold text-red-400 uppercase">PDF</span>
                                    </a>
                                  ) : (
                                    <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                                      className="w-full h-full flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors">
                                      <FileText size={36} className="text-blue-400 mb-1" />
                                      <span className="text-[10px] font-bold text-blue-400 uppercase">DOC</span>
                                    </a>
                                  )}
                                </div>
                                <div className="mt-2 px-0.5">
                                  <p className="text-xs font-semibold text-[#0A3D62] truncate group-hover:text-[#0F9FA8] transition-colors"
                                    title={m.file_name || 'File'}>{m.file_name || 'File'}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase">{m.media_type}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-4 italic">No files uploaded for this story yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          onContextMenu={e => e.preventDefault()}
          style={{WebkitUserSelect:'none', userSelect:'none'}}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10" onClick={() => setLightbox(null)}>
            <X size={20} />
          </button>
          {lightbox.type === 'video' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              controlsList="nodownload nofullscreen"
              disablePictureInPicture
              className="max-w-full max-h-[85vh] rounded-2xl"
              onClick={e => e.stopPropagation()}
              onContextMenu={e => e.preventDefault()}
            />
          ) : (
            <div className="relative" onClick={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()}>
              <img
                src={lightbox.url}
                alt={lightbox.title}
                className="max-w-full max-h-[90vh] rounded-2xl object-contain select-none"
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                style={{WebkitUserSelect:'none', userSelect:'none', pointerEvents:'none'}}
              />
              {/* Invisible overlay prevents right-click on image */}
              <div
                className="absolute inset-0 rounded-2xl"
                onContextMenu={e => e.preventDefault()}
                style={{background:'transparent', zIndex:10}}
              />
            </div>
          )}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none">{lightbox.title}</p>
        </div>
      )}
    </div>
  );
}
