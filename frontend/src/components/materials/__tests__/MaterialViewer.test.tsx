import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaterialViewer } from '../MaterialViewer';
import { materialApi } from '@/services/api';
import type { LearningMaterial } from '@/types';

// Mock the API
jest.mock('@/services/api', () => ({
  materialApi: {
    download: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('MaterialViewer', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();

  const baseMaterial: LearningMaterial = {
    id: 1,
    lessonId: 1,
    title: 'Test Material',
    description: 'Test Description',
    materialType: 'URL',
    materialCategory: 'LECTURE',
    allowManualProgress: false,
    sortOrder: 1,
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => 'mock-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('YouTube Embedding', () => {
    it('should embed YouTube video with standard URL', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(iframe).toHaveAttribute('allowFullScreen');
      expect(iframe).toHaveClass('w-full h-[500px] border-0');
    });

    it('should embed YouTube video with short URL', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        externalUrl: 'https://youtu.be/dQw4w9WgXcQ',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should embed YouTube video with URL containing parameters', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should have correct iframe attributes for YouTube videos', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
      expect(iframe).toHaveAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      expect(iframe).toHaveAttribute('allowFullScreen');
    });

    it('should show regular iframe for non-YouTube URLs', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        externalUrl: 'https://example.com',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Should show warning message for external content
      expect(screen.getByText(/外部コンテンツが埋め込まれています/)).toBeInTheDocument();
      
      const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://example.com/');
      expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
      
      // Should have link to open in new tab
      const externalLink = screen.getByText('新しいタブで開く').closest('a');
      expect(externalLink).toHaveAttribute('href', 'https://example.com');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should handle various YouTube URL formats', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expectedId: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be',
          expectedId: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ?t=10',
          expectedId: 'dQw4w9WgXcQ',
        },
      ];

      testCases.forEach(({ url, expectedId }) => {
        const { unmount } = render(
          <MaterialViewer
            material={{ ...baseMaterial, externalUrl: url }}
            courseId={1}
            lessonId={1}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        );

        const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
        expect(iframe.src).toBe(`https://www.youtube.com/embed/${expectedId}`);
        unmount();
      });
    });
  });

  describe('File Content Rendering', () => {
    it('should render video files', async () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        materialType: 'FILE',
        filePath: '/videos/test.mp4',
        fileType: 'video/mp4',
      };

      // Mock fetch to return a blob
      const mockBlob = new Blob(['video content'], { type: 'video/mp4' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        const video = screen.getByText(/お使いのブラウザは動画再生に対応していません/).closest('video');
        expect(video).toBeInTheDocument();
        expect(video).toHaveAttribute('controls');
        expect(video).toHaveClass('w-full max-h-[500px]');
      });
    });

    it('should render PDF files', async () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        materialType: 'FILE',
        filePath: '/docs/test.pdf',
        fileType: 'application/pdf',
      };

      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        const iframe = screen.getByTitle('Test Material') as HTMLIFrameElement;
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveClass('w-full h-[600px] border-0');
      });
    });
  });

  describe('Manual Progress Content', () => {
    it('should render manual progress content', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        materialType: 'MANUAL_PROGRESS',
        description: 'Please complete the external course',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('外部学習教材')).toBeInTheDocument();
      expect(screen.getByText(/この教材は外部での学習を想定しています/)).toBeInTheDocument();
      expect(screen.getByText('Please complete the external course')).toBeInTheDocument();
      expect(screen.getByText('進捗を記録する')).toBeInTheDocument();
    });

    it('should show progress form when button is clicked', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        materialType: 'MANUAL_PROGRESS',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const progressButton = screen.getByText('進捗を記録する');
      fireEvent.click(progressButton);

      // Should show the ManualProgressForm component
      expect(screen.queryByText('進捗を記録する')).not.toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', () => {
      render(
        <MaterialViewer
          material={baseMaterial}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const closeButton = screen.getByRole('button', { name: /閉じる/ });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when clicking outside', () => {
      render(
        <MaterialViewer
          material={baseMaterial}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const backdrop = document.querySelector('.bg-gray-500.opacity-75');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display material title and description', () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        title: 'Advanced React Tutorial',
        description: 'Learn advanced React patterns and best practices',
      };

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('Advanced React Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Learn advanced React patterns and best practices')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should handle file download', async () => {
      const material: LearningMaterial = {
        ...baseMaterial,
        materialType: 'FILE',
        filePath: '/files/document.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      const mockBlob = new Blob(['file content']);
      (materialApi.download as jest.Mock).mockResolvedValueOnce(mockBlob);
      
      // Mock URL.createObjectURL and URL.revokeObjectURL
      const mockUrl = 'blob:http://localhost:3000/123';
      global.URL.createObjectURL = jest.fn(() => mockUrl);
      global.URL.revokeObjectURL = jest.fn();

      // Mock document methods
      const mockAnchor = document.createElement('a');
      const clickSpy = jest.spyOn(mockAnchor, 'click');
      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);

      render(
        <MaterialViewer
          material={material}
          courseId={1}
          lessonId={1}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Wait for the file to load (showing download button for non-viewable files)
      await waitFor(() => {
        expect(screen.getByText('このファイルはブラウザで直接表示できません')).toBeInTheDocument();
      });

      const downloadButton = screen.getAllByText('ファイルをダウンロード')[0];
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(materialApi.download).toHaveBeenCalledWith(1, 1, 1);
        expect(clickSpy).toHaveBeenCalled();
        expect(mockAnchor.download).toBe('Test Material.document');
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
      });
    });
  });
});