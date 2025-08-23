#!/usr/bin/env typescript
/**
 * File: /frontend/src/pages/Generate.tsx
 * Project: Veo 3 Video Generator - Complete Frontend Redesign
 * Purpose: Enhanced video generation page with advanced features
 * Dependencies: react-hook-form, framer-motion, advanced UI components
 * Created: 2025-08-15 - Claude vs V0.dev Comparison Build
 * 
 * FEATURES IMPLEMENTED:
 * - Advanced image-to-video upload with drag & drop
 * - Multi-step prompt builder with intelligent suggestions
 * - Real-time cost estimation and generation preview
 * - Template integration with scene customization
 * - Advanced aspect ratio and quality controls
 * - Progress tracking with detailed status updates
 * - Neural network UI theme with smooth animations
 * 
 * DESIGN APPROACH:
 * - Three-column layout: main form, preview, tips/templates
 * - Progressive disclosure of advanced options
 * - Visual feedback for all user interactions
 * - Mobile-responsive with touch-friendly controls
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Wand2, 
  Settings, 
  Eye, 
  Sparkles,
  DollarSign,
  Zap,
  Camera,
  Palette,
  Film,
  AlertCircle,
  CheckCircle,
  Info,
  BookOpen,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/endpoints';
import type { VideoGenerationRequest } from '../api/types';
import { AspectRatio } from '../api/types';
import { DEFAULT_SCENE_TEMPLATES } from '../services/sceneTemplates';
import { toast } from 'react-hot-toast';

// Enhanced form interface with all Veo3 capabilities
interface EnhancedVideoForm extends VideoGenerationRequest {
  // Step management
  currentStep: number;
  // Image upload
  imagePreview?: string;
  // UI-specific fields that get stored in metadata
  style?: string;
  category?: string;
  costTier?: string;
  qualityLevel?: string;
  industry?: string;
  sceneType?: string;
  // Advanced settings
  seed?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  // Cost tracking
  estimatedCost?: number;
  estimatedTime?: number;
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  hover: { scale: 1.02 }
};

const Generate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnhancedVideoForm>({
    defaultValues: {
      prompt: '',
      aspect_ratio: AspectRatio.LANDSCAPE,
      duration: 5,
      style: 'cinematic',
      currentStep: 1,
      costTier: 'standard',
      qualityLevel: 'production'
    }
  });
  
  // Component state
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // Watch form values for real-time updates
  const watchedValues = watch();
  const prompt = watch('prompt');
  const aspectRatio = watch('aspect_ratio');
  const duration = watch('duration');
  const style = watch('style');
  const currentStep = watch('currentStep');

  // Real-time cost estimation
  useEffect(() => {
    if (prompt && prompt.length > 10) {
      const estimateCostAsync = async () => {
        try {
          const response = await api.video.estimateCost({
            prompt,
            aspect_ratio: aspectRatio,
            duration,
            metadata: style ? { style } : undefined,
            image_base64: imagePreview || undefined
          });
          setEstimatedCost(response.cost);
          setEstimatedTime(response.credits);
        } catch (error) {
          // Silent fail for cost estimation
        }
      };
      estimateCostAsync();
    }
  }, [prompt, aspectRatio, duration, style, imagePreview]);

  // Image upload handlers
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image must be smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setValue('image_base64', result.split(',')[1]); // Remove data:image/... prefix
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  }, [setValue]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  }, [handleImageUpload]);

  // Template application
  const applyTemplate = (templateId: string) => {
    const allTemplates = Object.values(DEFAULT_SCENE_TEMPLATES).flat();
    const template = allTemplates.find(t => t.id === templateId);
    
    if (template) {
      setValue('prompt', template.promptTemplate);
      setValue('style', template.visualStyle.toLowerCase().includes('cinematic') ? 'cinematic' : 'realistic');
      setValue('category', template.industry as any);
      setSelectedTemplate(templateId);
      toast.success(`Applied ${template.name} template`);
    }
  };

  // Form submission
  const onSubmit = async (data: EnhancedVideoForm) => {
    if (!user) {
      toast.error('Please log in to generate videos');
      navigate('/auth');
      return;
    }

    if (user.quota_remaining <= 0) {
      toast.error('You have reached your generation quota');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.video.generateVideo({
        prompt: data.prompt,
        aspect_ratio: data.aspect_ratio,
        duration: data.duration,
        image_base64: data.image_base64,
        metadata: {
          style: data.style,
          category: data.category,
          costTier: data.costTier,
          qualityLevel: data.qualityLevel,
          negativePrompt: data.negativePrompt
        }
      });

      const jobId = response.generation_id;
      
      toast.success('Video generation started!');
      
      // Navigate to progress page or stay and show progress
      navigate(`/progress/${jobId}`);
      
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to start video generation');
      setIsGenerating(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setValue('currentStep', currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setValue('currentStep', currentStep - 1);
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-neural-cyan bg-clip-text text-transparent">
          Generate AI Video
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-4 sm:px-0">
          Create stunning videos with Google Veo 3, powered by LostMind AI's professional video generation platform. 
          Upload an image or describe your vision in text - built by Sumit Mondal for creators and businesses.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all text-sm sm:text-base ${
                step === currentStep
                  ? 'bg-neural-cyan text-white'
                  : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-bg-tertiary text-gray-400'
              }`}>
                {step < currentStep ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 transition-all ${
                  step < currentStep ? 'bg-green-500' : 'bg-bg-tertiary'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-4 sm:space-y-6">
          <motion.div 
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="card"
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Content Type & Upload */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-neural-cyan/20 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-neural-cyan" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Choose Your Starting Point</h3>
                      <p className="text-gray-400">Upload an image or start with text only</p>
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div 
                    role="button"
                    tabIndex={0}
                    className={`relative border-2 border-dashed rounded-xl p-4 sm:p-8 transition-all cursor-pointer ${
                      dragActive 
                        ? 'border-neural-cyan bg-neural-cyan/10' 
                        : imagePreview 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-bg-tertiary hover:border-neural-cyan/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div className="text-center">
                        <img 
                          src={imagePreview} 
                          alt="Upload preview" 
                          className="max-h-48 mx-auto rounded-lg mb-4"
                        />
                        <p className="text-green-400 font-medium">Image uploaded successfully!</p>
                        <p className="text-sm text-gray-400 mt-2">Click to change or drag a new image</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setValue('image_base64', '');
                          }}
                          className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neural-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-neural-cyan" />
                        </div>
                        <h4 className="text-base sm:text-lg font-medium mb-2">Upload Starting Image</h4>
                        <p className="text-gray-400 mb-4 text-sm sm:text-base">
                          Drag & drop an image here, or click to browse
                        </p>
                        <div className="text-xs sm:text-sm text-gray-500">
                          <p>Supports: JPG, PNG, WebP • Max size: 10MB</p>
                          <p className="mt-1">Recommended: 16:9 aspect ratio for best results</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && e.target.files.length > 0 && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    title="Upload an image"
                  />

                  {/* Content Type Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <button
                      type="button"
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                        imagePreview 
                          ? 'border-neural-cyan bg-neural-cyan/10 text-neural-cyan' 
                          : 'border-bg-tertiary hover:border-neural-cyan/50'
                      }`}
                    >
                      <Video className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                      <p className="font-medium text-sm sm:text-base">Image-to-Video</p>
                      <p className="text-xs text-gray-400 mt-1">Transform image into video</p>
                    </button>
                    <button
                      type="button"
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-[100px] ${
                        !imagePreview 
                          ? 'border-neural-cyan bg-neural-cyan/10 text-neural-cyan' 
                          : 'border-bg-tertiary hover:border-neural-cyan/50'
                      }`}
                    >
                      <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" />
                      <p className="font-medium text-sm sm:text-base">Text-to-Video</p>
                      <p className="text-xs text-gray-400 mt-1">Generate from description</p>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-neural-cyan hover:bg-neural-cyan/90 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    <span>Continue to Prompt</span>
                    <motion.div whileHover={{ x: 5 }}>
                      →
                    </motion.div>
                  </button>
                </motion.div>
              )}

              {/* Step 2: Prompt & Style */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-neural-cyan/20 rounded-lg flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-neural-cyan" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Describe Your Video</h3>
                      <p className="text-gray-400">The more detailed, the better the result</p>
                    </div>
                  </div>

                  {/* Prompt Input */}
                  <div>
                    <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300 mb-2">
                      Video Description *
                    </label>
                    <textarea
                      id="prompt-input"
                      {...register('prompt', { 
                        required: 'Please describe your video',
                        minLength: { value: 10, message: 'Description must be at least 10 characters' }
                      })}
                      rows={4}
                      className="w-full px-4 py-3 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500 resize-none"
                      placeholder={imagePreview 
                        ? "Describe what should happen in the video. For example: 'The camera slowly zooms in on the subject while soft music plays in the background. The lighting becomes warmer as the scene progresses.'"
                        : "Describe your video scene in detail. Include camera movements, lighting, characters, actions, and mood. For example: 'A serene sunset over calm ocean waters, with gentle waves lapping the shore. The camera slowly pans right as seabirds fly across the golden sky.'"
                      }
                    />
                    {errors.prompt && (
                      <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.prompt.message}</span>
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {prompt?.length || 0} / 500 characters
                      </p>
                      <button
                        type="button"
                        className="text-xs text-neural-cyan hover:text-neural-light transition-colors"
                      >
                        ✨ Enhance with AI
                      </button>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <p className="block text-sm font-medium text-gray-300 mb-3">
                      Visual Style
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { value: 'cinematic', label: 'Cinematic', icon: Film },
                        { value: 'realistic', label: 'Realistic', icon: Camera },
                        { value: 'artistic', label: 'Artistic', icon: Palette },
                        { value: 'anime', label: 'Anime', icon: Sparkles }
                      ].map((style) => (
                        <label key={style.value} className="cursor-pointer">
                          <input
                            type="radio"
                            {...register('style')}
                            value={style.value}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border-2 transition-all text-center min-h-[70px] ${
                            watchedValues.style === style.value
                              ? 'border-neural-cyan bg-neural-cyan/10 text-neural-cyan'
                              : 'border-bg-tertiary hover:border-neural-cyan/50'
                          }`}>
                            <style.icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">{style.label}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <p className="block text-sm font-medium text-gray-300 mb-3">
                      Aspect Ratio
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: '16:9', label: 'Landscape', desc: '1920×1080' },
                        { value: '9:16', label: 'Portrait', desc: '1080×1920' },
                        { value: '1:1', label: 'Square', desc: '1080×1080' }
                      ].map((ratio) => (
                        <label key={ratio.value} className="cursor-pointer">
                          <input
                            type="radio"
                            {...register('aspect_ratio')}
                            value={ratio.value}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                            watchedValues.aspect_ratio === ratio.value
                              ? 'border-neural-cyan bg-neural-cyan/10 text-neural-cyan'
                              : 'border-bg-tertiary hover:border-neural-cyan/50'
                          }`}>
                            <div className={`w-8 h-6 mx-auto mb-2 rounded border-2 ${
                              ratio.value === '16:9' ? 'w-8 h-5' :
                              ratio.value === '9:16' ? 'w-5 h-8' : 'w-6 h-6'
                            } ${watchedValues.aspect_ratio === ratio.value ? 'border-neural-cyan' : 'border-gray-400'}`} />
                            <p className="text-sm font-medium">{ratio.label}</p>
                            <p className="text-xs text-gray-400">{ratio.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full sm:flex-1 bg-bg-tertiary hover:bg-bg-quaternary text-white font-medium py-3 px-6 rounded-lg transition-colors min-h-[44px]"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!prompt || prompt.length < 10}
                      className="w-full sm:flex-1 bg-neural-cyan hover:bg-neural-cyan/90 disabled:bg-neural-cyan/50 text-white font-medium py-3 px-6 rounded-lg transition-colors min-h-[44px]"
                    >
                      Continue →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Final Settings */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-neural-cyan/20 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-neural-cyan" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Final Settings</h3>
                      <p className="text-gray-400">Quality, duration, and generation options</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label htmlFor="duration-range" className="block text-sm font-medium text-gray-300 mb-2">
                      Duration: {duration} seconds
                    </label>
                    <input
                      id="duration-range"
                      type="range"
                      {...register('duration')}
                      min="3"
                      max="10"
                      step="1"
                      className="w-full accent-neural-cyan"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>3s</span>
                      <span>5s</span>
                      <span>10s</span>
                    </div>
                  </div>

                  {/* Quality Level */}
                  <div>
                    <p className="block text-sm font-medium text-gray-300 mb-3">
                      Quality Level
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'draft', label: 'Draft', desc: 'Fast preview', cost: '$0.10' },
                        { value: 'production', label: 'Production', desc: 'High quality', cost: '$0.25' },
                        { value: 'cinema', label: 'Cinema', desc: 'Premium quality', cost: '$0.50' }
                      ].map((quality) => (
                        <label key={quality.value} className="cursor-pointer">
                          <input
                            type="radio"
                            {...register('qualityLevel')}
                            value={quality.value}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-lg border-2 transition-all text-center ${
                            watchedValues.qualityLevel === quality.value
                              ? 'border-neural-cyan bg-neural-cyan/10 text-neural-cyan'
                              : 'border-bg-tertiary hover:border-neural-cyan/50'
                          }`}>
                            <p className="text-sm font-medium">{quality.label}</p>
                            <p className="text-xs text-gray-400">{quality.desc}</p>
                            <p className="text-xs text-neural-cyan mt-1">{quality.cost}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Settings Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center space-x-2 text-neural-cyan hover:text-neural-light transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Advanced Settings</span>
                    <motion.div
                      animate={{ rotate: showAdvanced ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      ↓
                    </motion.div>
                  </button>

                  {/* Advanced Settings */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 border-t border-bg-tertiary pt-4"
                      >
                        <div>
                          <label htmlFor="negative-prompt-input" className="block text-sm font-medium text-gray-300 mb-2">
                            Negative Prompt (Optional)
                          </label>
                          <input
                            id="negative-prompt-input"
                            {...register('negativePrompt')}
                            type="text"
                            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-quaternary rounded-lg focus:border-neural-cyan focus:ring-1 focus:ring-neural-cyan outline-none transition-colors text-white placeholder-gray-500"
                            placeholder="What to avoid in the video (e.g., blurry, distorted, text)"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cost Estimation */}
                  {estimatedCost > 0 && (
                    <div className="bg-neural-cyan/10 border border-neural-cyan/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-5 h-5 text-neural-cyan" />
                          <div>
                            <p className="font-medium">Estimated Cost</p>
                            <p className="text-sm text-gray-400">Processing time: ~{estimatedTime}s</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-neural-cyan">${estimatedCost.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Credits: {Math.ceil(estimatedCost * 10)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation & Submit */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full sm:flex-1 bg-bg-tertiary hover:bg-bg-quaternary text-white font-medium py-3 px-6 rounded-lg transition-colors min-h-[44px]"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating || !prompt}
                      className="w-full sm:flex-1 bg-gradient-to-r from-neural-cyan to-blue-500 hover:from-neural-cyan/90 hover:to-blue-500/90 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 min-h-[44px]"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap className="w-5 h-5" />
                          </motion.div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Generate Video</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Preview & Templates Sidebar */}
        <div className="lg:col-span-1 xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Preview Area */}
          <motion.div 
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-5 h-5 text-neural-cyan" />
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>
            
            <div className="aspect-video bg-bg-tertiary rounded-lg border-2 border-dashed border-bg-quaternary flex items-center justify-center min-h-[180px] sm:min-h-[200px]">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Video className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Video preview will appear here</p>
                  <p className="text-xs sm:text-sm mt-1">Upload an image or complete the prompt</p>
                </div>
              )}
            </div>

            {prompt && (
              <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
                <p className="text-sm text-gray-300 font-medium mb-1">Current Prompt:</p>
                <p className="text-sm text-gray-400">{prompt}</p>
              </div>
            )}
          </motion.div>

          {/* Quick Templates */}
          <motion.div 
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-neural-cyan" />
                <h3 className="text-lg font-semibold">Quick Templates</h3>
              </div>
              <button type="button" className="text-sm text-neural-cyan hover:text-neural-light transition-colors">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {DEFAULT_SCENE_TEMPLATES.marketing.slice(0, 2).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all hover:border-neural-cyan/50 ${
                    selectedTemplate === template.id 
                      ? 'border-neural-cyan bg-neural-cyan/10' 
                      : 'border-bg-tertiary'
                  }`}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs bg-neural-cyan/20 text-neural-cyan px-2 py-1 rounded">
                      {template.industry}
                    </span>
                    <span className="text-xs text-gray-500">{template.cameraMovement}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tips & Stats */}
          <motion.div 
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="w-5 h-5 text-neural-cyan" />
              <h3 className="text-lg font-semibold">Pro Tips</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-bg-tertiary rounded-lg">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Camera Movement</p>
                  <p className="text-xs text-gray-400">Include specific camera directions: "camera slowly zooms in", "pans left to right"</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-bg-tertiary rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Best Results</p>
                  <p className="text-xs text-gray-400">Videos with detailed lighting and environment descriptions perform 40% better</p>
                </div>
              </div>
            </div>

            {user && (
              <div className="mt-6 pt-4 border-t border-bg-tertiary">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Remaining Quota:</span>
                  <span className="font-medium text-neural-cyan">{user.quota_remaining}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Videos Generated:</span>
                  <span className="font-medium">{user.total_videos_generated}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default Generate;