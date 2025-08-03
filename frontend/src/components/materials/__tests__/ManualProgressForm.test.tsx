import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualProgressForm } from '../ManualProgressForm';
import { materialApi } from '@/services/api';
import type { LearningMaterial } from '@/types';

jest.mock('@/services/api', () => ({
  materialApi: {
    updateManualProgress: jest.fn(),
  },
}));

describe('ManualProgressForm', () => {
  const mockMaterial: LearningMaterial = {
    id: 1,
    lessonId: 1,
    title: 'Test Material',
    materialType: 'MANUAL_PROGRESS',
    materialCategory: 'MAIN',
    allowManualProgress: true,
    sortOrder: 1,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    userProgress: {
      progressRate: 50,
      spentMinutes: 30,
      isCompleted: false,
      lastAccessed: new Date(),
    },
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with initial values from material', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByText('学習進捗の記録')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('updates progress rate when slider is moved', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('updates spent minutes when input changes', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    const timeInput = screen.getByLabelText('学習時間（分）');
    fireEvent.change(timeInput, { target: { value: '45' } });
    
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  it('updates notes when textarea changes', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    const notesTextarea = screen.getByLabelText('メモ（任意）');
    fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });
    
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('shows completion message when progress is 100%', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '100' } });
    
    expect(screen.getByText('素晴らしい！この教材の学習を完了しました。')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 1,
        userId: 1,
        courseId: 1,
        lessonId: 1,
        materialId: 1,
        progressType: 'MANUAL' as const,
        progressRate: 75,
        manualProgressRate: 75,
        spentMinutes: 45,
        isCompleted: false,
        lastAccessed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    
    (materialApi.updateManualProgress as jest.Mock).mockResolvedValue(mockResponse);
    
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Update form values
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    
    const timeInput = screen.getByLabelText('学習時間（分）');
    fireEvent.change(timeInput, { target: { value: '45' } });
    
    const notesTextarea = screen.getByLabelText('メモ（任意）');
    fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });
    
    // Submit form
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(materialApi.updateManualProgress).toHaveBeenCalledWith(1, {
        progressRate: 75,
        spentMinutes: 45,
        notes: 'Test notes',
      });
      
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        ...mockMaterial,
        userProgress: {
          progressRate: 75,
          manualProgressRate: 75,
          spentMinutes: 45,
          isCompleted: false,
          lastAccessed: expect.any(Date),
        },
      }));
    });
  });

  it('displays error message when submission fails', async () => {
    (materialApi.updateManualProgress as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Failed to update progress',
        },
      },
    });
    
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update progress')).toBeInTheDocument();
    });
  });

  it('disables buttons while loading', async () => {
    (materialApi.updateManualProgress as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(
      <ManualProgressForm 
        material={mockMaterial} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );
    
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeDisabled();
    });
  });
});