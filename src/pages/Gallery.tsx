import { useState, useEffect } from 'react';
import { X, Play, Film, Heart, ChevronRight, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type GalleryItem = {
  id: string; title: string; category: string;
  media_url: string; media_type: 'image' | 'video';
  thumbnail_url?: string; is_published?: boolean;
};

type StoryMedia = {
  id: string; story_id: string; media_url: string;
  media_type: string; caption?: string; sort_order: number;
};

type PatientStory = {
  id: string; patient_name: string; treatment: string;
  description?: string; is_published: boolean; created_at: string;
  media?: StoryMedia[];
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

type Lightbox = { url: string; type: string; title: string };

export default function Gallery() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'stories'>('gallery');
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const [dbItems, setDbItems] = useState<GalleryItem[]>([]);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<PatientStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('gallery_items').select('*').eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setDbItems(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (activeTab !== 'stories') return;
    setStoriesLoading(true);
    supabase.from('patient_stories').select('*, patient_story_media(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setStories(data.map((s: any) => ({
            ...s,
            media: (s.patient_story_media || []).sort((a: StoryMedia, b: StoryMedia) => a.sort_order - b.sort_order)
          })));
        }
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
  const isDoc = (url: string) => url.toLowerCase().includes('.doc');

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Our Clinic</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Gallery & Patient Stories</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            A glimpse into our state-of-the-art facilities and the lives we've helped transform.
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

          {/* ── GALLERY TAB ── */}
          {activeTab === 'gallery' && (
            <>
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#0F9FA8]/80 text-white mt-1 inline-block">{item.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!loading && visible.length === 0 && (
                <div className="text-center py-16 text-gray-400">No items in this category yet.</div>
              )}
            </>
          )}

          {/* ── PATIENT STORIES TAB ── */}
          {activeTab === 'stories' && (
            <div className="space-y-6">
              {storiesLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#0F9FA8]/30 border-t-[#0F9FA8] rounded-full animate-spin" />
                </div>
              )}

              {!storiesLoading && stories.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No patient stories yet.</p>
                  <p className="text-sm mt-1">Stories will appear here once added by the clinic.</p>
                </div>
              )}

              {stories.map(story => (
                <div key={story.id} className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
                  {/* Story Header */}
                  <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F9FA8] to-[#0A3D62] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {story.patient_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0A3D62] text-lg">{story.patient_name}</h3>
                        <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#0F9FA8]/10 text-[#0F9FA8] text-xs font-semibold">
                          {story.treatment}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {story.media?.length || 0} file{(story.media?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <ChevronRight size={20} className={`text-gray-400 transition-transform duration-300 ${expandedStory === story.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Story Content — expanded */}
                  {expandedStory === story.id && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {story.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-5">{story.description}</p>
                      )}

                      {story.media && story.media.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {story.media.map(m => (
                            <div key={m.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                              {isPdf(m.media_url) || isDoc(m.media_url) ? (
                                // Document file
                                <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                                  className="flex flex-col items-center justify-center p-6 hover:bg-[#0F9FA8]/5 transition-colors group">
                                  <FileText size={40} className="text-[#0A3D62] group-hover:text-[#0F9FA8] transition-colors mb-2" />
                                  <span className="text-xs font-semibold text-[#0A3D62] text-center group-hover:text-[#0F9FA8] transition-colors">
                                    {m.caption || (isPdf(m.media_url) ? 'View PDF' : 'View Document')}
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1 uppercase">
                                    {isPdf(m.media_url) ? 'PDF' : 'DOC'}
                                  </span>
                                </a>
                              ) : m.media_type === 'video' ? (
                                // Video
                                <div className="cursor-pointer" onClick={() => setLightbox({ url: m.media_url, type: 'video', title: m.caption || story.patient_name })}>
                                  <div className="relative aspect-video bg-gradient-to-br from-[#0A3D62] to-[#0F9FA8] flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center hover:bg-white/40 transition-all">
                                      <Play size={20} className="text-white ml-1" fill="white" />
                                    </div>
                                  </div>
                                  {m.caption && <p className="text-xs text-gray-500 p-2 text-center">{m.caption}</p>}
                                </div>
                              ) : (
                                // Image
                                <div className="cursor-pointer" onClick={() => setLightbox({ url: m.media_url, type: 'image', title: m.caption || story.patient_name })}>
                                  <img src={m.media_url} alt={m.caption || story.patient_name}
                                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                                    style={{ maxHeight: '200px' }}
                                    loading="lazy" />
                                  {m.caption && <p className="text-xs text-gray-500 p-2 text-center">{m.caption}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-4 italic">No media uploaded for this story yet.</p>
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
