import { render, screen, fireEvent } from '@testing-library/react';
import { MaterialCard } from '../MaterialCard';
import type { LearningMaterial } from '@/types';

describe('MaterialCard', () => {
  const mockMaterial: LearningMaterial = {
    id: 1,
    lessonId: 1,
    title: 'Test Material',
    description: 'Test description',
    materialType: 'FILE',
    materialCategory: 'MAIN',
    fileType: 'application/pdf',
    fileSize: 1048576, // 1MB
    allowManualProgress: false,
    sortOrder: 1,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnView = jest.fn();

  beforeEach(() => {
    mockOnView.mockClear();
  });

  it('renders material information correctly', () => {
    render(<MaterialCard material={mockMaterial} onView={mockOnView} />);
    
    expect(screen.getByText('Test Material')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  it('displays correct icon for PDF file', () => {
    render(<MaterialCard material={mockMaterial} onView={mockOnView} />);
    
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });

  it('displays video icon for video files', () => {
    const videoMaterial = { ...mockMaterial, fileType: 'video/mp4' };
    render(<MaterialCard material={videoMaterial} onView={mockOnView} />);
    
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });

  it('displays URL icon for URL materials', () => {
    const urlMaterial = { ...mockMaterial, materialType: 'URL' as const };
    render(<MaterialCard material={urlMaterial} onView={mockOnView} />);
    
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });

  it('displays manual progress icon for manual progress materials', () => {
    const manualMaterial = { ...mockMaterial, materialType: 'MANUAL_PROGRESS' as const };
    render(<MaterialCard material={manualMaterial} onView={mockOnView} />);
    
    const svgElement = screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });

  it('displays duration when available', () => {
    const materialWithDuration = { ...mockMaterial, durationMinutes: 30 };
    render(<MaterialCard material={materialWithDuration} onView={mockOnView} />);
    
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays supplementary badge for supplementary materials', () => {
    const supplementaryMaterial = { ...mockMaterial, materialCategory: 'SUPPLEMENTARY' as const };
    render(<MaterialCard material={supplementaryMaterial} onView={mockOnView} />);
    
    expect(screen.getByText('補足教材')).toBeInTheDocument();
  });

  it('displays draft badge for unpublished materials', () => {
    const draftMaterial = { ...mockMaterial, isPublished: false };
    render(<MaterialCard material={draftMaterial} onView={mockOnView} />);
    
    expect(screen.getByText('下書き')).toBeInTheDocument();
  });

  it('displays progress bar when user progress exists', () => {
    const materialWithProgress = {
      ...mockMaterial,
      userProgress: {
        progressRate: 75,
        spentMinutes: 20,
        isCompleted: false,
        lastAccessed: new Date(),
      },
    };
    render(<MaterialCard material={materialWithProgress} onView={mockOnView} />);
    
    expect(screen.getByText('進捗率')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays completed status when material is completed', () => {
    const completedMaterial = {
      ...mockMaterial,
      userProgress: {
        progressRate: 100,
        spentMinutes: 30,
        isCompleted: true,
        lastAccessed: new Date(),
      },
    };
    render(<MaterialCard material={completedMaterial} onView={mockOnView} />);
    
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  it('calls onView when clicked', () => {
    render(<MaterialCard material={mockMaterial} onView={mockOnView} />);
    
    fireEvent.click(screen.getByText('Test Material'));
    expect(mockOnView).toHaveBeenCalledWith(mockMaterial);
  });

  it('formats file sizes correctly', () => {
    const testCases = [
      { size: 1024, expected: '1 KB' },
      { size: 1048576, expected: '1 MB' },
      { size: 1073741824, expected: '1 GB' },
    ];

    testCases.forEach(({ size, expected }) => {
      const { rerender } = render(
        <MaterialCard 
          material={{ ...mockMaterial, fileSize: size }} 
          onView={mockOnView} 
        />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<></>);
    });
  });
});