import React, { useState, useEffect } from 'react';
import { SCENE_CATEGORIES, DEFAULT_SCENE_TEMPLATES, type SceneTemplate } from '../../services/api';
import { Sparkles, Eye, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SceneSelectorProps {
  selectedCategory?: string;
  selectedScene?: string;
  onCategoryChange: (category: string) => void;
  onSceneChange: (scene: SceneTemplate | null) => void;
  onScenePreview?: (scene: SceneTemplate) => void;
}

type CategoryKey = keyof typeof SCENE_CATEGORIES;

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  onSceneChange,
  onScenePreview
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory || null);
  const [selectedTemplate, setSelectedTemplate] = useState<SceneTemplate | null>(null);

  useEffect(() => {
    if (selectedCategory && !expandedCategory) {
      setExpandedCategory(selectedCategory);
    }
  }, [selectedCategory, expandedCategory]);

  const handleCategorySelect = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
    onCategoryChange(categoryKey);
  };

  const handleSceneSelect = (template: SceneTemplate) => {
    setSelectedTemplate(template);
    onSceneChange(template);
  };

  const renderSceneCard = (template: SceneTemplate) => (
    <motion.div
      key={template.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        selectedTemplate?.id === template.id
          ? 'border-neural-cyan bg-neural-cyan/10'
          : 'border-bg-tertiary bg-bg-secondary hover:border-neural-cyan/50 hover:bg-bg-tertiary'
      }`}
      onClick={() => handleSceneSelect(template)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white">{template.name}</h4>
        <div className="flex space-x-2">
          {onScenePreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onScenePreview(template);
              }}
              className="p-1 rounded-full bg-bg-tertiary hover:bg-neural-cyan/20 transition-colors"
              title="Preview scene"
            >
              <Eye className="w-4 h-4 text-neural-cyan" />
            </button>
          )}
          <div className="p-1 rounded-full bg-bg-tertiary">
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3 h-3 text-neural-cyan" />
          <span className="text-xs text-gray-300">Style: {template.visualStyle}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-neural-purple" />
          <span className="text-xs text-gray-300">Camera: {template.cameraMovement}</span>
        </div>
      </div>
      
      {template.variables.length > 0 && (
        <div className="mt-3 pt-3 border-t border-bg-tertiary">
          <p className="text-xs text-gray-400 mb-1">Customisable variables:</p>
          <div className="flex flex-wrap gap-1">
            {template.variables.map((variable) => (
              <span
                key={variable}
                className="px-2 py-1 text-xs bg-neural-cyan/20 text-neural-cyan rounded-full"
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Scene Categories</h3>
        <p className="text-sm text-gray-400 mb-4">
          Choose from professional scene templates designed for different industries and use cases.
        </p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(SCENE_CATEGORIES).map(([key, category]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCategorySelect(key)}
            className={`p-4 rounded-lg border text-left transition-all duration-200 ${
              expandedCategory === key
                ? 'border-neural-cyan bg-neural-cyan/10'
                : 'border-bg-tertiary bg-bg-secondary hover:border-neural-cyan/50'
            }`}
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <h4 className="font-medium text-white mb-1">{category.name}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {category.description}
            </p>
            <div className="mt-2 text-xs text-neural-cyan">
              {category.scenes.length} templates
            </div>
          </motion.button>
        ))}
      </div>

      {/* Scene Templates */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{SCENE_CATEGORIES[expandedCategory as CategoryKey].icon}</span>
              <h4 className="text-lg font-medium text-white">
                {SCENE_CATEGORIES[expandedCategory as CategoryKey].name} Scenes
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_SCENE_TEMPLATES[expandedCategory as CategoryKey]?.map((template) =>
                renderSceneCard(template)
              )}
            </div>

            {(!DEFAULT_SCENE_TEMPLATES[expandedCategory as CategoryKey] || 
              DEFAULT_SCENE_TEMPLATES[expandedCategory as CategoryKey].length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>More {SCENE_CATEGORIES[expandedCategory as CategoryKey].name.toLowerCase()} templates coming soon!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-neural-cyan/10 border border-neural-cyan rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-neural-cyan" />
            <h4 className="font-medium text-white">Selected: {selectedTemplate.name}</h4>
          </div>
          <p className="text-sm text-gray-300 mb-3">{selectedTemplate.description}</p>
          <div className="text-xs text-gray-400">
            <strong>Template:</strong> {selectedTemplate.promptTemplate}
          </div>
        </motion.div>
      )}
    </div>
  );
};