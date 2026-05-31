import { describe, expect, it, vi } from 'vitest';
import { registerDimensPrompts } from '../../src/mcp/prompts';
import { registerDimensResources } from '../../src/mcp/resources';
import type { McpToolFactoryContext } from '../../src/mcp/tools';

function createToolContext(): McpToolFactoryContext {
  return {
    getContext: () => ({
      baseUrl: 'https://api.example.com',
      token: 'token',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      output: 'json',
      toSafeJSON: () => ({
        baseUrl: 'https://api.example.com',
        hasToken: true,
        tokenPreview: '***',
        teamId: 'TEAM1',
        projectId: 'PROJ1',
        appUrl: undefined,
      }),
    }),
    createSDK: () => ({
      sheet: {
        structure: vi.fn().mockResolvedValue({ data: { columns: [] } }),
      },
    } as never),
  };
}

describe('MCP resources and prompts', () => {
  it('should register context and sheet structure resources', () => {
    const server = {
      registerResource: vi.fn(),
    };

    registerDimensResources(server as never, createToolContext());

    expect(server.registerResource).toHaveBeenCalledWith(
      'dimens_context',
      'dimens://context',
      expect.objectContaining({ mimeType: 'application/json' }),
      expect.any(Function)
    );
    expect(server.registerResource).toHaveBeenCalledWith(
      'dimens_sheet_structure',
      expect.anything(),
      expect.objectContaining({ mimeType: 'application/json' }),
      expect.any(Function)
    );
  });

  it('should register workflow prompts', () => {
    const server = {
      registerPrompt: vi.fn(),
    };

    registerDimensPrompts(server as never);

    expect(server.registerPrompt).toHaveBeenCalledWith(
      'dimens_design_table',
      expect.objectContaining({ description: expect.any(String) }),
      expect.any(Function)
    );
    expect(server.registerPrompt).toHaveBeenCalledWith(
      'dimens_create_project_workspace',
      expect.objectContaining({ description: expect.any(String) }),
      expect.any(Function)
    );
    expect(server.registerPrompt).toHaveBeenCalledWith(
      'dimens_import_rows',
      expect.objectContaining({ description: expect.any(String) }),
      expect.any(Function)
    );
  });
});
