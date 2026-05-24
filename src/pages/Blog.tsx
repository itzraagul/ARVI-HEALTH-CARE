import { useEffect, useState } from 'react';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  cover_image?: string;
  author?: string;
  is_published?: boolean;
  reading_time?: number;
  created_at?: string;
};

const categories = ['All', 'Orthopaedic', 'Child Care', 'Health Tips', 'Vaccination', 'Physiotherapy'];

const samplePosts: BlogPost[] = [
  { id: '1', title: '5 Signs You Should See an Orthopaedic Doctor', slug: 'signs-see-orthopaedic-doctor',
    excerpt: 'Persistent joint pain, limited mobility, or recent injury — here are the key signs that you should consult an orthopaedic specialist without delay.',
    category: 'Orthopaedic', cover_image: 'https://images.pexels.com/photos/7285015/pexels-photo-7285015.jpeg?w=600',
    author: 'Dr. Aravindasamy M', reading_time: 5, is_published: true, created_at: '2025-04-15T10:00:00Z' },
  { id: '2', title: 'Complete Vaccination Guide for Your Child (0–5 Years)', slug: 'complete-vaccination-guide-child',
    excerpt: 'A comprehensive overview of the vaccines your child needs in the first five years of life, including timing and what each vaccine protects against.',
    category: 'Vaccination', cover_image: 'https://images.pexels.com/photos/3912364/pexels-photo-3912364.jpeg?w=600',
    author: 'Dr. Vishali G', reading_time: 8, is_published: true, created_at: '2025-04-10T10:00:00Z' },
  { id: '3', title: 'Managing Back Pain: When to Rest, When to Exercise', slug: 'managing-back-pain-rest-exercise',
    excerpt: 'Back pain is one of the most common complaints worldwide. Learn the right balance between rest and exercise for different types of back pain.',
    category: 'Orthopaedic', cover_image: 'https://images.pexels.com/photos/5765827/pexels-photo-5765827.jpeg?w=600',
    author: 'Dr. Aravindasamy M', reading_time: 6, is_published: true, created_at: '2025-04-05T10:00:00Z' },
  { id: '4', title: "Your Child's Growth Milestones: What to Expect", slug: 'child-growth-milestones',
    excerpt: 'Understanding normal developmental milestones helps you identify potential concerns early. Here is a guide for parents from birth to 5 years.',
    category: 'Child Care', cover_image: 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?w=600',
    author: 'Dr. Vishali G', reading_time: 7, is_published: true, created_at: '2025-03-28T10:00:00Z' },
  { id: '5', title: 'Physiotherapy After Knee Surgery: A Complete Recovery Guide', slug: 'physiotherapy-after-knee-surgery',
    excerpt: 'Post-surgical rehabilitation is crucial for a complete recovery. This guide walks you through the phases of knee surgery recovery.',
    category: 'Physiotherapy', cover_image: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?w=600',
    author: 'Dr. Aravindasamy M', reading_time: 10, is_published: true, created_at: '2025-03-20T10:00:00Z' },
  { id: '6', title: 'Nutrition Tips for Strong Bones and Healthy Joints', slug: 'nutrition-tips-strong-bones',
    excerpt: 'What you eat significantly affects your bone and joint health. Discover the key nutrients and foods for maintaining strong, healthy bones.',
    category: 'Health Tips', cover_image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=600',
    author: 'Dr. Aravindasamy M', reading_time: 5, is_published: true, created_at: '2025-03-15T10:00:00Z' },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>(samplePosts);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data?.length) setPosts(data); });
  }, []);

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="pt-20">
      <section className="py-16 bg-gradient-to-br from-[#e8f8f9] to-[#f0f9ff]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-[#0F9FA8] text-sm font-semibold tracking-widest uppercase">Medical Blog</span>
          <h1 className="mt-3 text-4xl font-bold text-[#0A3D62] font-heading">Health Insights & Tips</h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Expert medical articles from our doctors to help you make informed decisions about your health.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">

          {/* Search + Filter — icon fixed with pointer-events-none */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 items-start">
            <div className="relative w-full md:w-80 flex-shrink-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#0F9FA8] focus:ring-2 focus:ring-[#0F9FA8]/10 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setActiveCategory(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === c ? 'bg-[#0F9FA8] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#0F9FA8]/10 hover:text-[#0F9FA8]'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Featured */}
          {featured && (
            <div className="mb-12 bg-white rounded-3xl shadow-card overflow-hidden group card-hover">
              <div className="grid md:grid-cols-2">
                <div className="relative overflow-hidden h-64 md:h-auto">
                  <img src={featured.cover_image} alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-[#0F9FA8] text-white text-xs font-semibold">Featured</span>
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <span className="text-[#0F9FA8] text-xs font-semibold tracking-wider uppercase">{featured.category}</span>
                  <h2 className="mt-2 text-2xl font-bold text-[#0A3D62] font-heading leading-tight">{featured.title}</h2>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">{featured.excerpt}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span>{featured.author}</span><span>•</span>
                    <span className="flex items-center gap-1"><Clock size={12}/>{featured.reading_time} min read</span>
                    <span>•</span><span>{formatDate(featured.created_at)}</span>
                  </div>
                  <button className="mt-6 flex items-center gap-2 text-[#0F9FA8] font-semibold text-sm hover:gap-3 transition-all w-fit">
                    Read Article <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-card overflow-hidden group card-hover cursor-pointer border border-gray-100">
                <div className="relative overflow-hidden h-48">
                  <img src={post.cover_image} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#0F9FA8] text-xs font-semibold">{post.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-[#0A3D62] font-heading leading-tight mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={11}/>{post.reading_time} min</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[#0F9FA8] text-sm font-semibold">
                    Read More <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No articles found matching your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
