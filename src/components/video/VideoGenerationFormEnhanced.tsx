import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { api, type VideoGenerationRequest, type EnhancedVideoGenerationFormData, type SceneTemplate, AspectRatio } from '../../services/api';
import { Loader, Sparkles, DollarSign, Clock, Zap, Upload, X, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SceneSelector } from './SceneSelector';
import { ProgressTracker } from './ProgressTracker';

export const VideoGenerationFormEnhanced = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedScene, setSelectedScene] = useState<SceneTemplate | null>(null);
  const [costEstimate, setCostEstimate] = useState<number | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EnhancedVideoGenerationFormData>({
    defaultValues: {
      aspect_ratio: AspectRatio.LANDSCAPE,
      duration: 8,
      style: 'realistic',
      category: 'marketing',
      costTier: 'standard',
      qualityLevel: 'production'
    }
  });

  const watchedValues = watch();

  // Image upload handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be smaller than 10MB');
        return;
      }
      
      setUploadedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      
      toast.success('Image uploaded successfully');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // Convert image to base64 for API
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (formData: EnhancedVideoGenerationFormData) => {
    // Convert enhanced form data to basic VideoGenerationRequest
    const data: VideoGenerationRequest = {
      prompt: formData.prompt,
      model: formData.model,
      duration: formData.duration,
      aspect_ratio: formData.aspect_ratio,
      enhance_prompt: formData.enhance_prompt,
      image_base64: formData.image_base64,
      webhook_url: formData.webhook_url,
      // Store UI-specific fields in metadata
      metadata: {
        style: formData.style,
        category: formData.category,
        costTier: formData.costTier,
        qualityLevel: formData.qualityLevel,
        industry: formData.industry,
        sceneType: formData.sceneType,
        negative_prompt: formData.negative_prompt,
        cameraMovement: formData.cameraMovement,
        characterDNA: formData.characterDNA
      }
    };
    setIsGenerating(true);
    try {
      // Enhance prompt with scene template if selected
      let enhancedPrompt = data.prompt;
      if (selectedScene) {
        enhancedPrompt = selectedScene.promptTemplate.replace(/{\\w+}/g, (match) => {
          const variable = match.slice(1, -1);
          return data.prompt || `[${variable}]`;
        });
      }

      // Convert image to base64 if uploaded
      let imageBase64 = undefined;
      if (uploadedImage) {
        try {
          imageBase64 = await imageToBase64(uploadedImage);
        } catch (error) {
          toast.error('Failed to process image');
          setIsGenerating(false);
          return;
        }
      }

      const requestData = {
        ...data,
        prompt: enhancedPrompt,
        category: selectedCategory as 'marketing' | 'educational' | 'corporate' | 'entertainment',
        sceneType: selectedScene?.name,
        industry: selectedScene?.industry,
        image_base64: imageBase64
      };

      const response = await api.generateVideo(requestData);
      const jobId = response.data.generation_id;
      
      setActiveJobId(jobId);
      toast.success('Video generation started!');
      
      // Don't navigate immediately, show progress tracker
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to start video generation');
      setIsGenerating(false);
    }
  };

  const handleSceneChange = (scene: SceneTemplate | null) => {
    setSelectedScene(scene);
    if (scene) {
      setValue('industry', scene.industry);
      setValue('sceneType', scene.name);
      // Auto-fill some prompt context if empty
      if (!watchedValues.prompt) {
        setValue('prompt', `A ${scene.description.toLowerCase()}`);
      }
    }
  };

  const handleCostEstimation = async () => {
    try {
      // Note: cost estimation endpoint may not be implemented yet
      // Future: const response = await api.video.estimateCost(watchedValues);
      const response = { data: { estimated_cost: 0.05, processing_time: 60 } }; // Fallback
      setCostEstimate(response.data.estimated_cost);
    } catch (error) {
      console.error('Cost estimation failed:', error);
      // Set mock estimate for demo
      const mockCost = (watchedValues.duration || 8) * 0.75 + 
                      (watchedValues.qualityLevel === 'cinema' ? 3 : 
                       watchedValues.qualityLevel === 'production' ? 1.5 : 0.5);
      setCostEstimate(mockCost);
    }
  };

  const handleJobComplete = () => {
    setIsGenerating(false);
    setActiveJobId(null);
    toast.success('Video generated successfully!');
    navigate('/history');
  };

  const handleJobError = (error: string) => {
    setIsGenerating(false);
    setActiveJobId(null);
    toast.error(error);
  };

  // Show progress tracker if job is active
  if (activeJobId) {
    return (
      <div className="space-y-6">
        <ProgressTracker
          jobId={activeJobId}
          onComplete={handleJobComplete}
          onError={handleJobError}
        />
        <button
          onClick={() => {
            setActiveJobId(null);
            setIsGenerating(false);
          }}
          className="btn-secondary w-full"
        >
          Generate Another Video
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Scene Selection */}
      <SceneSelector
        selectedCategory={selectedCategory}
        selectedScene={selectedScene?.id}
        onCategoryChange={setSelectedCategory}
        onSceneChange={handleSceneChange}
      />

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

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Image className="w-4 h-4 inline mr-2" />
            Image-to-Video (Optional)
          </label>
          <p className="text-sm text-gray-400 mb-3">
            Upload an image to generate a video starting from or ending with this image (Veo3 feature)
          </p>
          
          {!uploadedImage ? (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-neural-cyan transition-colors"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Click to upload or drag image here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center space-x-4 p-4 bg-bg-secondary rounded-lg border border-neural-cyan/30">
                <img
                  src={imagePreviewUrl!}
                  alt="Uploaded preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neural-cyan">
                    Image uploaded successfully
                  </p>
                  <p className="text-xs text-gray-400">
                    {uploadedImage.name} ({(uploadedImage.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This image will be used as starting/ending point for video generation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <select
              {...register('aspect_ratio')}
              className="input-primary"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Classic)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
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
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quality Level
            </label>
            <select
              {...register('qualityLevel')}
              className="input-primary"
            >
              <option value="draft">Draft (Fast)</option>
              <option value="production">Production (Balanced)</option>
              <option value="cinema">Cinema (Best Quality)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visual Style
            </label>
            <select
              {...register('style')}
              className="input-primary"
            >
              <option value="realistic">Realistic</option>
              <option value="animated">Animated</option>
              <option value="artistic">Artistic</option>
              <option value="cinematic">Cinematic</option>
              <option value="abstract">Abstract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cost Tier
            </label>
            <select
              {...register('costTier')}
              className="input-primary"
            >
              <option value="economy">Economy ($2-5)</option>
              <option value="standard">Standard ($5-10)</option>
              <option value="premium">Premium ($10-20)</option>
            </select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-neural-cyan hover:text-neural-purple transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>Advanced Options</span>
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Negative Prompt (Optional)
              </label>
              <textarea
                {...register('negative_prompt')}
                className="input-primary min-h-[80px]"
                rows={3}
                placeholder="Describe what you DON'T want in your video (e.g., blurry, low quality, distorted faces)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Camera Movement
                </label>
                <select
                  {...register('cameraMovement')}
                  className="input-primary"
                >
                  <option value="">Auto-Select</option>
                  <option value="static">Static (No Movement)</option>
                  <option value="pan">Pan (Left/Right)</option>
                  <option value="tilt">Tilt (Up/Down)</option>
                  <option value="zoom">Zoom (In/Out)</option>
                  <option value="dolly">Dolly (Forward/Back)</option>
                  <option value="orbit">Orbit (Around Subject)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Character DNA (Optional)
                </label>
                <input
                  type="text"
                  {...register('characterDNA')}
                  className="input-primary"
                  placeholder="e.g., confident, friendly, professional"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cost Estimation */}
        <div className="bg-bg-primary rounded-lg p-4 border border-bg-tertiary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-neural-cyan" />
              <span className="font-medium text-neural-cyan">Cost Estimation</span>
            </div>
            <button
              type="button"
              onClick={handleCostEstimation}
              className="text-sm text-neural-cyan hover:text-neural-purple transition-colors"
            >
              Calculate Cost
            </button>
          </div>
          
          {costEstimate ? (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Estimated cost:</span>
              <span className="text-neural-cyan font-medium">${costEstimate.toFixed(2)} AUD</span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Click "Calculate Cost" to estimate the generation cost based on your settings.
            </p>
          )}
        </div>

        <div className="bg-bg-primary rounded-lg p-4 border border-bg-tertiary">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-5 h-5 text-neural-cyan mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-neural-cyan mb-1">AI Enhancement</p>
              <p className="text-gray-400">
                Your prompt will be automatically enhanced by our AI to produce better results.
                {selectedScene && ' The selected scene template will also optimise your video generation.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isGenerating || !watchedValues.prompt}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
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
          
          {costEstimate && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-neural-cyan/10 rounded-lg border border-neural-cyan">
              <Clock className="w-4 h-4 text-neural-cyan" />
              <span className="text-sm text-neural-cyan">~{Math.ceil((watchedValues.duration || 8) * 60 / 8)} min</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};