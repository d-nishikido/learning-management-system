/**
 * MCP (Model Context Protocol) Client for E2E Tests
 * This client interfaces with the MCP server to manage test data
 */

interface MCPConfig {
  serverUrl: string;
  apiKey?: string;
}

interface TestDataRequest {
  entity: 'user' | 'course' | 'lesson' | 'progress';
  action: 'create' | 'update' | 'delete' | 'reset';
  data?: any;
}

export class MCPClient {
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = {
      serverUrl: config.serverUrl || process.env.MCP_SERVER_URL || 'http://localhost:3003',
      apiKey: config.apiKey || process.env.MCP_API_KEY
    };
  }

  /**
   * Send a request to the MCP server
   */
  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.serverUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create test data
   */
  async createTestData(request: TestDataRequest): Promise<any> {
    return this.request('/test-data', 'POST', request);
  }

  /**
   * Reset all test data to initial state
   */
  async resetTestData(): Promise<void> {
    await this.request('/test-data/reset', 'POST');
  }

  /**
   * Get current test data state
   */
  async getTestDataState(): Promise<any> {
    return this.request('/test-data/state');
  }

  /**
   * Create a test user with specific attributes
   */
  async createTestUser(userData: any): Promise<any> {
    return this.createTestData({
      entity: 'user',
      action: 'create',
      data: userData
    });
  }

  /**
   * Create a test course
   */
  async createTestCourse(courseData: any): Promise<any> {
    return this.createTestData({
      entity: 'course',
      action: 'create',
      data: courseData
    });
  }

  /**
   * Clean up specific test data
   */
  async cleanup(entity: string, id: number): Promise<void> {
    await this.createTestData({
      entity: entity as any,
      action: 'delete',
      data: { id }
    });
  }
}

// Export a singleton instance
export const mcpClient = new MCPClient({
  serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3003'
});