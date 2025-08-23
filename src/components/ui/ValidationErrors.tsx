/**
 * Validation Errors Component
 * Form field error display with real-time feedback and neural theme
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorDetails, ErrorType } from '../../utils/errors';

// === Types ===

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  type?: 'required' | 'format' | 'length' | 'range' | 'custom';
}

export interface ValidationErrorsProps {
  errors: ValidationError[];
  showIcons?: boolean;
  showInstantly?: boolean;
  className?: string;
  fieldClassName?: string;
  animate?: boolean;
}

export interface FieldErrorProps {
  error?: string | ValidationError | ValidationError[];
  touched?: boolean;
  showInstantly?: boolean;
  className?: string;
  showIcon?: boolean;
  animate?: boolean;
}

export interface InlineErrorProps {
  message: string;
  type?: ValidationError['type'];
  className?: string;
  showIcon?: boolean;
  animate?: boolean;
}

// === Validation Errors Component ===

export function ValidationErrors({
  errors,
  showIcons = true,
  showInstantly = false,
  className = '',
  fieldClassName = '',
  animate = true
}: ValidationErrorsProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`} role="alert" aria-live="polite">
      <AnimatePresence>
        {errors.map((error, index) => (
          <ValidationErrorItem
            key={`${error.field}-${index}`}
            error={error}
            showIcon={showIcons}
            showInstantly={showInstantly}
            className={fieldClassName}
            animate={animate}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// === Individual Error Item ===

interface ValidationErrorItemProps {
  error: ValidationError;
  showIcon: boolean;
  showInstantly: boolean;
  className: string;
  animate: boolean;
}

function ValidationErrorItem({
  error,
  showIcon,
  showInstantly,
  className,
  animate
}: ValidationErrorItemProps) {
  const getErrorIcon = (type?: ValidationError['type']): string => {
    switch (type) {
      case 'required':
        return '⚠️';
      case 'format':
        return '🔤';
      case 'length':
        return '📏';
      case 'range':
        return '📊';
      default:
        return '❌';
    }
  };

  const content = (
    <div 
      className={`
        flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 
        rounded-lg text-sm text-red-400 ${className}
      `}
    >
      {showIcon && (
        <span className="flex-shrink-0 text-base" aria-hidden="true">
          {getErrorIcon(error.type)}
        </span>
      )}
      <div className="flex-1">
        <div className="font-medium">{error.field}</div>
        <div className="text-red-300">{error.message}</div>
        {error.code && (
          <div className="text-xs text-red-400 mt-1 font-mono">
            Code: {error.code}
          </div>
        )}
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        duration: showInstantly ? 0.1 : 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {content}
    </motion.div>
  );
}

// === Field Error Component ===

export function FieldError({
  error,
  touched = true,
  showInstantly = false,
  className = '',
  showIcon = true,
  animate = true
}: FieldErrorProps) {
  // Normalize error to ValidationError format
  const normalizedErrors = React.useMemo(() => {
    if (!error) return [];
    if (typeof error === 'string') {
      return [{ field: '', message: error, type: 'custom' as const }];
    }
    if (Array.isArray(error)) {
      return error;
    }
    return [error];
  }, [error]);

  // Don't show error if field hasn't been touched (unless showInstantly is true)
  if (!error || (!touched && !showInstantly)) return null;

  return (
    <div className={`mt-1 ${className}`}>
      <AnimatePresence>
        {normalizedErrors.map((err, index) => (
          <InlineError
            key={index}
            message={err.message}
            type={err.type}
            showIcon={showIcon}
            animate={animate}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// === Inline Error Component ===

export function InlineError({
  message,
  type = 'custom',
  className = '',
  showIcon = true,
  animate = true
}: InlineErrorProps) {
  const getErrorIcon = (errorType: ValidationError['type']): string => {
    switch (errorType) {
      case 'required':
        return '⚠️';
      case 'format':
        return '🔤';
      case 'length':
        return '📏';
      case 'range':
        return '📊';
      default:
        return '❌';
    }
  };

  const content = (
    <div 
      className={`flex items-center gap-2 text-sm text-red-400 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <span className="flex-shrink-0 text-xs" aria-hidden="true">
          {getErrorIcon(type)}
        </span>
      )}
      <span>{message}</span>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {content}
    </motion.div>
  );
}

// === Form Summary Error Component ===

export interface FormErrorSummaryProps {
  errors: ValidationError[];
  title?: string;
  className?: string;
  onFieldClick?: (field: string) => void;
  showCount?: boolean;
}

export function FormErrorSummary({
  errors,
  title = 'Please fix the following errors:',
  className = '',
  onFieldClick,
  showCount = true
}: FormErrorSummaryProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg 
            className="w-5 h-5 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-400 mb-2">
            {title}
            {showCount && ` (${errors.length})`}
          </h3>
          
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-300">
                {onFieldClick && error.field ? (
                  <button
                    onClick={() => onFieldClick(error.field)}
                    className="text-left hover:text-red-200 focus:outline-none focus:underline"
                  >
                    <strong>{error.field}:</strong> {error.message}
                  </button>
                ) : (
                  <>
                    {error.field && <strong>{error.field}:</strong>} {error.message}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// === Hook for Form Validation ===

export interface UseValidationOptions {
  showInstantly?: boolean;
  debounceMs?: number;
  touchOnChange?: boolean;
}

export function useValidation(
  initialErrors: ValidationError[] = [],
  options: UseValidationOptions = {}
) {
  const [errors, setErrors] = React.useState<ValidationError[]>(initialErrors);
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = React.useState(false);

  const {
    showInstantly = false,
    debounceMs = 300,
    touchOnChange = true
  } = options;

  // Debounced validation
  const debouncedSetErrors = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (newErrors: ValidationError[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setErrors(newErrors);
        setIsValidating(false);
      }, debounceMs);
    };
  }, [debounceMs]);

  const addError = React.useCallback((error: ValidationError) => {
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== error.field);
      return [...filtered, error];
    });
  }, []);

  const removeError = React.useCallback((field: string) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const clearErrors = React.useCallback((fields?: string[]) => {
    if (fields) {
      setErrors(prev => prev.filter(e => !fields.includes(e.field)));
    } else {
      setErrors([]);
    }
  }, []);

  const touchField = React.useCallback((field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
  }, []);

  const touchFields = React.useCallback((fields: string[]) => {
    setTouchedFields(prev => new Set([...prev, ...fields]));
  }, []);

  const untouchField = React.useCallback((field: string) => {
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  }, []);

  const isFieldTouched = React.useCallback((field: string) => {
    return touchedFields.has(field);
  }, [touchedFields]);

  const getFieldError = React.useCallback((field: string): ValidationError | undefined => {
    return errors.find(e => e.field === field);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasVisibleErrors = showInstantly ? hasErrors : 
    errors.some(error => touchedFields.has(error.field));

  const validateField = React.useCallback((
    field: string,
    value: any,
    validator: (value: any) => string | ValidationError | null
  ) => {
    setIsValidating(true);
    
    if (touchOnChange) {
      touchField(field);
    }

    const result = validator(value);
    
    if (result) {
      const error = typeof result === 'string' 
        ? { field, message: result, type: 'custom' as const }
        : result;
      
      setErrors((prev: ValidationError[]) => {
        const filtered = prev.filter((e: ValidationError) => e.field !== field);
        return [...filtered, error];
      });
    } else {
      removeError(field);
      setIsValidating(false);
    }
  }, [touchOnChange, touchField, debouncedSetErrors, removeError]);

  return {
    errors,
    touchedFields: Array.from(touchedFields),
    isValidating,
    hasErrors,
    hasVisibleErrors,
    addError,
    removeError,
    clearErrors,
    touchField,
    touchFields,
    untouchField,
    isFieldTouched,
    getFieldError,
    validateField,
    setErrors: debouncedSetErrors
  };
}

// === Utility Functions ===

export function errorsFromApiError(apiError: ErrorDetails): ValidationError[] {
  if (apiError.type === ErrorType.VALIDATION && apiError.details) {
    // Handle FastAPI validation errors
    if (Array.isArray(apiError.details)) {
      return apiError.details.map((detail: any) => ({
        field: detail.loc ? detail.loc.join('.') : 'unknown',
        message: detail.msg || detail.message || 'Validation error',
        code: detail.type,
        type: 'format' as const
      }));
    }
  }

  // Fallback to generic error
  return [{
    field: 'general',
    message: apiError.userMessage,
    type: 'custom' as const
  }];
}

export default ValidationErrors;