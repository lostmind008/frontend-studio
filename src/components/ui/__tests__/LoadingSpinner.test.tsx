import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    // The lg size class is applied to the inner SVG element, not the container
    const svgElement = spinner.querySelector('.w-8.h-8');
    expect(svgElement).toBeTruthy();
  });

  it('should render with custom label', () => {
    render(<LoadingSpinner label="Loading videos..." />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading videos...');
    // The label text is in sr-only span, so it's not visible but accessible
    expect(screen.getByText('Loading videos...')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render different variants', () => {
    render(<LoadingSpinner variant="spinner" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render in fullscreen mode', () => {
    render(<LoadingSpinner fullScreen />);
    
    const spinner = screen.getByRole('status');
    expect(spinner.closest('.fixed.inset-0')).toBeTruthy();
  });
});