const TEMPLATES = [
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'A clean, low-noise card for direct profile sharing.',
    category: 'core',
  },
  {
    key: 'editorial',
    name: 'Editorial',
    description: 'A magazine-inspired layout for creators with strong storytelling.',
    category: 'premium',
  },
  {
    key: 'creator-pro',
    name: 'Creator Pro',
    description: 'A polished creator profile with balanced links and service rates.',
    category: 'premium',
  },
  {
    key: 'rate-card',
    name: 'Rate Card',
    description: 'A service-first template for clear packages and pricing.',
    category: 'business',
  },
  {
    key: 'dark-studio',
    name: 'Dark Studio',
    description: 'A bold dark interface for artists, music creators, and visual brands.',
    category: 'premium',
  },
  {
    key: 'soft-luxury',
    name: 'Soft Luxury',
    description: 'A refined card for lifestyle, fashion, beauty, and premium services.',
    category: 'premium',
  },
  {
    key: 'portfolio',
    name: 'Portfolio',
    description: 'A flexible profile for showcasing work, links, and availability.',
    category: 'portfolio',
  },
  {
    key: 'coach-consultant',
    name: 'Coach / Consultant',
    description: 'A trust-focused template for service experts and advisors.',
    category: 'business',
  },
  {
    key: 'music-artist',
    name: 'Music Artist',
    description: 'A performance-driven template for music links, bookings, and releases.',
    category: 'creator',
  },
  {
    key: 'food-creator',
    name: 'Food Creator',
    description: 'A warm template for chefs, food bloggers, and recipe creators.',
    category: 'creator',
  },
  {
    key: 'fashion-creator',
    name: 'Fashion Creator',
    description: 'A visual-forward template for style creators and brand collaborations.',
    category: 'creator',
  },
  {
    key: 'tech-creator',
    name: 'Tech Creator',
    description: 'A crisp template for builders, educators, and technical creators.',
    category: 'creator',
  },
];

const DEFAULT_THEME = {
  primary_color: '#0f766e',
  accent_color: '#f4b860',
  background_color: '#f8faf9',
  text_color: '#111827',
  font: 'Inter',
  button_style: 'solid',
  radius: 'medium',
};

const DEFAULT_LAYOUT = {
  profile_position: 'top',
  links_style: 'buttons',
  rates_style: 'cards',
};

function enrichTemplate(template) {
  return {
    ...template,
    default_theme: { ...DEFAULT_THEME },
    default_layout: { ...DEFAULT_LAYOUT },
  };
}

function listTemplates() {
  return TEMPLATES.map(enrichTemplate);
}

function findTemplate(templateKey = 'minimal') {
  return listTemplates().find((template) => template.key === templateKey);
}

async function getTemplates() {
  return listTemplates();
}

module.exports = getTemplates;
module.exports.DEFAULT_THEME = DEFAULT_THEME;
module.exports.DEFAULT_LAYOUT = DEFAULT_LAYOUT;
module.exports.findTemplate = findTemplate;
module.exports.listTemplates = listTemplates;
