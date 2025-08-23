/**
 * UNIFIED API EXPORT - Re-exports all API services
 * This file serves as the single entry point for all API interactions.
 * It re-exports the unified `api` object from `../api/endpoints`.
 */

export { api } from '../api/endpoints';
export * from '../api/types';

// Export scene templates and categories
export type { 
  SceneTemplate, 
  IndustryTemplates 
} from './sceneTemplates';

export { 
  SCENE_CATEGORIES, 
  DEFAULT_SCENE_TEMPLATES
} from './sceneTemplates';

// Type alias for backward compatibility
export type { VideoStatusResponse as VideoJob } from '../api/types';


