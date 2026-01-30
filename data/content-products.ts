export interface ContentProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  benefit: string;
  badge?: string;
  image: string;
}

export const contentProducts: ContentProduct[] = [
  {
    id: 'lighting-kit',
    name: 'Creator Glow Lighting Kit',
    description: 'Portable RGB light bars with app presets for reels and shorts.',
    price: '₹8,499',
    category: 'Gear',
    benefit: 'Level up talking-head clarity in any room.',
    badge: 'Most loved',
    image: 'https://www.harlowe.com/cdn/shop/files/harlowe-pro-spectra-led-studio-light.jpg?v=1766593789&width=1440'
  },
  {
    id: 'mic-pack',
    name: 'Dual Wireless Mic Pack',
    description: 'Clip-on mics with real-time noise lift for interviews & vlogs.',
    price: '₹6,299',
    category: 'Audio',
    benefit: 'Deliver studio-grade audio on the go.',
    badge: 'Back in stock',
    image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'preset-pack',
    name: 'Cinematic LUT & Preset Bundle',
    description: '30 drag-and-drop looks for Instagram & YouTube color grading.',
    price: '₹1,899',
    category: 'Digital',
    benefit: 'Match your brand palette across every platform.',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'notion-kit',
    name: 'Content OS (Notion)',
    description: 'Plan shoots, scripts, deliverables, and sponsors from one HQ.',
    price: '₹999',
    category: 'Productivity',
    benefit: 'Ship faster with AI-ready templates.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'caption-pack',
    name: '400 Hooks & Caption Prompts',
    description: 'High-performing intros and CTAs curated for IG + YT.',
    price: '₹699',
    category: 'Digital',
    benefit: 'Never stare at a blank caption again.',
    image: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'tripod',
    name: 'Hybrid Travel Tripod',
    description: 'Aluminum + carbon mini tripod with 360° fluid head.',
    price: '₹5,799',
    category: 'Gear',
    benefit: 'Keep shots steady during collab shoots.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThdegscoh28tqrCtQXrVwCThEFJQurY0G5Bw&s'
  }
];
