import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WallpaperRenderer from './WallpaperRenderer';

describe('WallpaperRenderer', () => {
  it('renders with default background gradient when no wallpaperUrl is provided', () => {
    const { container } = render(<WallpaperRenderer words={[]} />);
    const div = container.firstChild as HTMLDivElement;
    expect(div.style.background).toContain('linear-gradient');
  });

  it('renders with background color when wallpaperUrl is a color code', () => {
    const { container } = render(<WallpaperRenderer words={[]} wallpaperUrl="#ff0000" />);
    const div = container.firstChild as HTMLDivElement;
    expect(div.style.backgroundColor).toBe('rgb(255, 0, 0)'); // Jest converts hex to rgb
  });

  // Currently this test reproduces the bug: images are applied via backgroundImage.
  // We want to change this to an actual <img> tag to avoid html-to-image CORS issues
  // which result in a black canvas.
  it('renders an img tag with crossOrigin="anonymous" when wallpaperUrl is an image URL', () => {
    render(<WallpaperRenderer words={[]} wallpaperUrl="https://example.com/image.jpg" />);
    const img = screen.getByRole('img', { name: 'background' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('crossorigin', 'anonymous');
  });
});
