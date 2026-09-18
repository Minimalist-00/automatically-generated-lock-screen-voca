import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TagInput from './TagInput';

describe('TagInput', () => {
  const defaultProps = {
    tags: ['react', 'nextjs'],
    onChange: jest.fn(),
    availableTags: ['react', 'nextjs', 'typescript', 'tailwind'],
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders existing tags', () => {
    render(<TagInput {...defaultProps} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('nextjs')).toBeInTheDocument();
  });

  it('adds a new tag on Enter key', () => {
    render(<TagInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'vue' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(defaultProps.onChange).toHaveBeenCalledWith(['react', 'nextjs', 'vue']);
  });

  it('removes a tag when delete icon is clicked', () => {
    render(<TagInput {...defaultProps} />);
    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);

    expect(defaultProps.onChange).toHaveBeenCalledWith(['nextjs']);
  });

  it('removes last tag on Backspace when input is empty', () => {
    render(<TagInput {...defaultProps} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });
    expect(defaultProps.onChange).toHaveBeenCalledWith(['react']);
  });

  it('shows suggestions on focus', () => {
    render(<TagInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('tailwind')).toBeInTheDocument();
  });

  it('adds tag when clicking a suggestion', () => {
    render(<TagInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    const suggestion = screen.getByText('typescript');
    fireEvent.mouseDown(suggestion);

    expect(defaultProps.onChange).toHaveBeenCalledWith(['react', 'nextjs', 'typescript']);
  });
});
