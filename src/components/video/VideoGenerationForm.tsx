import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { api, type VideoGenerationRequest, type EnhancedVideoGenerationFormData } from '../../services/api';
import { Loader, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const VideoGenerationForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<EnhancedVideoGenerationFormData>();

  const onSubmit = async (data: EnhancedVideoGenerationFormData) => {
    setIsGenerating(true);
    try {
      // Extract UI-specific fields and put in metadata
      const { style, category, costTier, qualityLevel, industry, sceneType, ...coreData } = data;
      const requestData: VideoGenerationRequest = {
        ...coreData,
        metadata: {
          style,
          category,
          costTier,
          qualityLevel,
          industry,
          sceneType
        }
      };
      await api.generateVideo(requestData);
      toast.success('Video generation started!');
      navigate('/history');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video Prompt
        </label>
        <textarea
          {...register('prompt', { 
            required: 'Prompt is required',
            minLength: { value: 10, message: 'Prompt must be at least 10 characters' }
          })}
          className="input-primary min-h-[120px]"
          rows={4}
          placeholder="Describe your video in detail... (e.g., A serene sunset over mountains with gentle clouds moving across the sky)"
        />
        {errors.prompt && (
          <p className="mt-1 text-sm text-red-400">{errors.prompt.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Aspect Ratio
          </label>
          <select
            {...register('aspect_ratio')}
            className="input-primary"
            defaultValue="16:9"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Classic)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Duration (seconds)
          </label>
          <input
            type="number"
            {...register('duration', { 
              min: { value: 1, message: 'Minimum 1 second' },
              max: { value: 10, message: 'Maximum 10 seconds' }
            })}
            className="input-primary"
            defaultValue={8}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Visual Style
        </label>
        <select
          {...register('style')}
          className="input-primary"
          defaultValue="realistic"
        >
          <option value="realistic">Realistic</option>
          <option value="animated">Animated</option>
          <option value="artistic">Artistic</option>
          <option value="cinematic">Cinematic</option>
          <option value="abstract">Abstract</option>
        </select>
      </div>

      <div className="bg-bg-primary rounded-lg p-4 border border-bg-tertiary">
        <div className="flex items-start space-x-2">
          <Sparkles className="w-5 h-5 text-neural-cyan mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-neural-cyan mb-1">AI Enhancement</p>
            <p className="text-gray-400">
              Your prompt will be automatically enhanced by our AI to produce better results.
              The system will add technical details, lighting, and composition improvements.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {isGenerating ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Video</span>
          </>
        )}
      </button>
    </form>
  );
};