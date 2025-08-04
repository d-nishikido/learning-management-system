import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MaterialForm } from '../MaterialForm';
import type { LearningMaterial } from '@/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('MaterialForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    courseId: 1,
    lessonId: 1,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders create form correctly', () => {
    render(<MaterialForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/material:fields.title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/material:fields.description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/material:fields.materialType/)).toBeInTheDocument();
    expect(screen.getByText(/common:create/)).toBeInTheDocument();
  });

  it('renders edit form correctly with existing material', () => {
    const material: LearningMaterial = {
      id: 1,
      lessonId: 1,
      title: 'Test Material',
      description: 'Test description',
      materialType: 'URL',
      materialCategory: 'MAIN',
      externalUrl: 'https://example.com',
      durationMinutes: 30,
      allowManualProgress: true,
      sortOrder: 1,
      isPublished: true,
      filePath: null,
      fileSize: null,
      fileType: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<MaterialForm {...defaultProps} material={material} />);
    
    expect(screen.getByDisplayValue('Test Material')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByText(/common:update/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<MaterialForm {...defaultProps} />);
    
    const submitButton = screen.getByText(/common:create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('material:validation.titleRequired')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows file upload field for FILE type', () => {
    render(<MaterialForm {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/material:fields.materialType/);
    fireEvent.change(typeSelect, { target: { value: 'FILE' } });

    expect(screen.getByText(/material:upload.dragDropOrClick/)).toBeInTheDocument();
  });

  it('shows URL field for URL type', () => {
    render(<MaterialForm {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/material:fields.materialType/);
    fireEvent.change(typeSelect, { target: { value: 'URL' } });

    expect(screen.getByLabelText(/material:fields.externalUrl/)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<MaterialForm {...defaultProps} />);
    
    const cancelButton = screen.getByText(/common:cancel/);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<MaterialForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/material:fields.title/);
    fireEvent.change(titleInput, { target: { value: 'Test Material' } });

    const submitButton = screen.getByText(/common:create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Material',
          materialType: 'FILE',
          materialCategory: 'MAIN',
        }),
        undefined
      );
    });
  });
});