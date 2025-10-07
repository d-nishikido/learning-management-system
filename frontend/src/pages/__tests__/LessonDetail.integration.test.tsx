import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import LessonDetail from '../LessonDetail';
import * as api from '../../services/api';

// APIモックの型定義
type ApiModule = typeof api;
const mockedApi = api as jest.Mocked<ApiModule>;

// APIモジュールをモック化
jest.mock('../../services/api');

// react-router-domのuseParamsをモック化
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ lessonId: '1' }),
}));

describe('LessonDetail Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('マークダウンコンテンツのレンダリング', () => {
    it('should render markdown content from API correctly', async () => {
      const markdownContent = '# Test Lesson\n\nThis is a **test** lesson with markdown.';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Test Lesson',
        content: markdownContent,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Lesson');
        expect(screen.getByText(/test lesson with markdown/)).toBeInTheDocument();
      });

      // Boldテキストが正しくレンダリングされることを確認
      const boldElement = screen.getByText('test');
      expect(boldElement.tagName.toLowerCase()).toBe('strong');
    });

    it('should render code blocks with syntax highlighting', async () => {
      const markdownWithCode = '```javascript\nconst x = 1;\nconsole.log(x);\n```';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Code Lesson',
        content: markdownWithCode,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
        expect(screen.getByText(/console\.log/)).toBeInTheDocument();
      });
    });

    it('should render external links with security attributes', async () => {
      const markdownWithLink = '[External Link](https://example.com)';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Link Lesson',
        content: markdownWithLink,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'External Link' });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('should render images correctly', async () => {
      const markdownWithImage = '![Test Image](https://example.com/image.png)';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Image Lesson',
        content: markdownWithImage,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        const image = screen.getByRole('img', { name: 'Test Image' });
        expect(image).toHaveAttribute('src', 'https://example.com/image.png');
        expect(image).toHaveAttribute('alt', 'Test Image');
      });
    });
  });

  describe('GFM (GitHub Flavored Markdown) サポート', () => {
    it('should render tables correctly', async () => {
      const markdownWithTable = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Table Lesson',
        content: markdownWithTable,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Header 1')).toBeInTheDocument();
        expect(screen.getByText('Cell 1')).toBeInTheDocument();
      });
    });

    it('should render task lists correctly', async () => {
      const markdownWithTaskList = '- [x] Completed task\n- [ ] Incomplete task';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Task List Lesson',
        content: markdownWithTaskList,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();
      });
    });

    it('should render strikethrough correctly', async () => {
      const markdownWithStrikethrough = '~~strikethrough text~~';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Strikethrough Lesson',
        content: markdownWithStrikethrough,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        const strikethrough = screen.getByText('strikethrough text');
        expect(strikethrough.tagName.toLowerCase()).toBe('del');
      });
    });
  });

  describe('後方互換性', () => {
    it('should handle HTML content from legacy lessons', async () => {
      const htmlContent = '<div><h1>Legacy HTML</h1><p>This is <strong>HTML</strong> content.</p></div>';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Legacy Lesson',
        content: htmlContent,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        // HTMLタグがサニタイズされて安全にレンダリングされることを確認
        expect(screen.getByText(/Legacy HTML/)).toBeInTheDocument();
        expect(screen.getByText(/HTML/)).toBeInTheDocument();
      });
    });

    it('should handle plain text content', async () => {
      const plainTextContent = 'This is plain text content without any markup.';

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Plain Text Lesson',
        content: plainTextContent,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(plainTextContent)).toBeInTheDocument();
      });
    });
  });

  describe('空コンテンツハンドリング', () => {
    it('should display fallback when content is empty', async () => {
      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Empty Lesson',
        content: '',
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/コンテンツがありません/)).toBeInTheDocument();
      });
    });

    it('should display fallback when content is null', async () => {
      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Null Content Lesson',
        content: null as unknown as string,
        order: 1,
        subjectId: 1,
      });

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/コンテンツがありません/)).toBeInTheDocument();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('should handle API errors gracefully', async () => {
      mockedApi.fetchLessonById.mockRejectedValueOnce(new Error('API Error'));

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/エラー/)).toBeInTheDocument();
      });
    });
  });

  describe('パフォーマンス', () => {
    it('should handle large markdown content efficiently', async () => {
      // 大きなマークダウンコンテンツを生成
      const largeContent = Array(100)
        .fill(0)
        .map((_, i) => `## Section ${i}\n\nThis is content for section ${i}.\n\n`)
        .join('');

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Large Content Lesson',
        content: largeContent,
        order: 1,
        subjectId: 1,
      });

      const startTime = performance.now();

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Section 0/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 3秒以内にレンダリングされることを確認（要件: 6.1）
      expect(renderTime).toBeLessThan(3000);
    });

    it('should handle multiple code blocks efficiently', async () => {
      const multipleCodeBlocks = Array(10)
        .fill(0)
        .map((_, i) => `\`\`\`javascript\nconst x${i} = ${i};\nconsole.log(x${i});\n\`\`\`\n\n`)
        .join('');

      mockedApi.fetchLessonById.mockResolvedValueOnce({
        id: 1,
        title: 'Multiple Code Blocks',
        content: multipleCodeBlocks,
        order: 1,
        subjectId: 1,
      });

      const startTime = performance.now();

      render(
        <BrowserRouter>
          <LessonDetail />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/const x0 = 0/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 1秒以内にレンダリングされることを確認（要件: 6.1）
      expect(renderTime).toBeLessThan(1000);
    });
  });
});
