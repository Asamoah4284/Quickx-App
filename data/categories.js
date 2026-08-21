export const categories = [
  { id: 'forex', label: 'Forex', icon: 'line-chart' },
  { id: 'coding', label: 'Coding', icon: 'code' },
  { id: 'marketing', label: 'Digital Marketing', icon: 'bullhorn' },
  { id: 'design', label: 'Graphic Design', icon: 'paint-brush' },
  { id: 'ai', label: 'AI', icon: 'lightbulb-o' },
  { id: 'agribusiness', label: 'Agribusiness', icon: 'leaf' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'crypto', label: 'Crypto', icon: 'money' },
];

export const hubTiles = [
  { id: 'courses', label: 'Courses', icon: 'graduation-cap', href: '/(tabs)/learn' },
  { id: 'tutors', label: 'Tutors', icon: 'users', href: '/tutors' },
  { id: 'books', label: 'Books', icon: 'book', href: '/(tabs)/books' },
  { id: 'mentorship', label: 'Mentorship', icon: 'handshake-o', href: '/(tabs)/mentorship' },
  { id: 'live', label: 'Live Classes', icon: 'video-camera', href: '/live' },
  { id: 'forex', label: 'Finance/Forex', icon: 'line-chart', href: '/(tabs)/learn?category=forex' },
  { id: 'trading', label: 'AI Trading', icon: 'rocket', href: '/trading' },
  { id: 'ai', label: 'QuickX AI', icon: 'magic', href: '/ai' },
  { id: 'offers', label: 'Offers', icon: 'tags', href: '/(tabs)/learn' },
];

export const levels = ['Beginner', 'Intermediate', 'Advanced'];

export const priceFilters = [
  { id: 'all', label: 'All prices' },
  { id: 'free', label: 'Free' },
  { id: 'under100', label: 'Under ₵100' },
  { id: 'under300', label: 'Under ₵300' },
  { id: 'premium', label: '₵300+' },
];
