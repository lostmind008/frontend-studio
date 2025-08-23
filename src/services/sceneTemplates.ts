/**
 * Scene templates and categories - Extracted from legacy api.ts for modularity
 * These provide UI data for scene selection and prompting features
 */

export interface SceneTemplate {
  id: string;
  industry: string;
  name: string;
  description: string;
  promptTemplate: string;
  variables: string[];
  visualStyle: string;
  cameraMovement: string;
  lighting: string;
}

export interface IndustryTemplates {
  [key: string]: SceneTemplate[];
}

// Scene categories for the UI
export const SCENE_CATEGORIES = {
  marketing: {
    name: 'Marketing',
    icon: '🎯',
    scenes: [
      'Product Demo',
      'Customer Testimonial',
      'Brand Showcase',
      'Social Media Ad',
      'Promotional Video'
    ],
    description: 'Professional marketing content for brands and products'
  },
  educational: {
    name: 'Educational',
    icon: '📚',
    scenes: [
      'Instructor-Led Tutorial',
      'Step-by-Step Explanation',
      'Concept Visualization',
      'Training Module',
      'Academic Presentation'
    ],
    description: 'Learning and educational content for various audiences'
  },
  corporate: {
    name: 'Corporate',
    icon: '🏢',
    scenes: [
      'Company Announcement',
      'Executive Presentation',
      'Team Introduction',
      'Office Tour',
      'Meeting Highlight'
    ],
    description: 'Professional corporate communications and presentations'
  },
  entertainment: {
    name: 'Entertainment',
    icon: '🎭',
    scenes: [
      'Dramatic Scene',
      'Action Sequence',
      'Comedy Sketch',
      'Musical Performance',
      'Storytelling'
    ],
    description: 'Creative and entertaining content for audiences'
  }
};

// Default scene templates
export const DEFAULT_SCENE_TEMPLATES: IndustryTemplates = {
  marketing: [
    {
      id: 'product-demo-1',
      industry: 'marketing',
      name: 'Product Demo - Clean Studio',
      description: 'Professional product demonstration in a clean studio environment',
      promptTemplate: 'A professional product demonstration of {product} in a clean, well-lit studio with soft shadows and modern aesthetic. The camera slowly rotates around the product showcasing its key features.',
      variables: ['product'],
      visualStyle: 'Clean, professional, well-lit',
      cameraMovement: 'Slow rotation, close-up details',
      lighting: 'Soft studio lighting with subtle shadows'
    },
    {
      id: 'brand-showcase-1',
      industry: 'marketing',
      name: 'Brand Showcase - Lifestyle',
      description: 'Lifestyle brand showcase with real people using products',
      promptTemplate: 'A lifestyle scene showing {people} authentically using {product} in {environment}. Natural lighting, genuine expressions, and smooth camera movements that follow the action.',
      variables: ['people', 'product', 'environment'],
      visualStyle: 'Natural, authentic, lifestyle-focused',
      cameraMovement: 'Following action, dynamic but smooth',
      lighting: 'Natural lighting with warm tones'
    }
  ],
  educational: [
    {
      id: 'tutorial-1',
      industry: 'educational',
      name: 'Step-by-Step Tutorial',
      description: 'Clear instructional content with close-up details',
      promptTemplate: 'A clear, educational demonstration of {process} with close-up camera work showing detailed steps. Clean background, professional lighting, and steady camera movements that focus on the key actions.',
      variables: ['process'],
      visualStyle: 'Clean, educational, detailed',
      cameraMovement: 'Close-up focus, steady shots',
      lighting: 'Bright, even lighting for clarity'
    }
  ],
  corporate: [
    {
      id: 'announcement-1',
      industry: 'corporate',
      name: 'Executive Announcement',
      description: 'Professional executive speaking to camera',
      promptTemplate: 'A professional executive in {setting} delivering {message} directly to camera. Confident posture, professional attire, with subtle camera movements and corporate lighting.',
      variables: ['setting', 'message'],
      visualStyle: 'Professional, corporate, authoritative',
      cameraMovement: 'Subtle zoom, steady framing',
      lighting: 'Professional corporate lighting'
    }
  ],
  entertainment: [
    {
      id: 'dramatic-1',
      industry: 'entertainment',
      name: 'Dramatic Scene',
      description: 'Cinematic dramatic content with emotional depth',
      promptTemplate: 'A cinematic dramatic scene featuring {characters} in {situation}. Dynamic lighting, emotional expressions, and sophisticated camera work with depth of field effects.',
      variables: ['characters', 'situation'],
      visualStyle: 'Cinematic, dramatic, high production value',
      cameraMovement: 'Dynamic, cinematic techniques',
      lighting: 'Dramatic, mood-setting lighting'
    }
  ]
};