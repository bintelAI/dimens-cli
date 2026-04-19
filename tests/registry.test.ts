import { describe, it, expect } from 'vitest';
import { registerTool, getTool, getAllTools, clearTools } from '../src/tools/registry';

describe('Tool Registry', () => {
  beforeEach(() => {
    clearTools();
  });

  it('should register a tool', () => {
    const tool = {
      name: 'test_tool',
      description: 'Test tool',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      handler: async () => ({ success: true }),
    };

    registerTool(tool);
    const registered = getTool('test_tool');
    
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('test_tool');
  });

  it('should get all tools', () => {
    const tool1 = {
      name: 'tool1',
      description: 'Tool 1',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      handler: async () => ({ success: true }),
    };

    const tool2 = {
      name: 'tool2',
      description: 'Tool 2',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      handler: async () => ({ success: true }),
    };

    registerTool(tool1);
    registerTool(tool2);
    
    const allTools = getAllTools();
    expect(allTools).toHaveLength(2);
  });

  it('should clear all tools', () => {
    const tool = {
      name: 'test_tool',
      description: 'Test tool',
      parameters: {
        type: 'object' as const,
        properties: {},
      },
      handler: async () => ({ success: true }),
    };

    registerTool(tool);
    clearTools();
    
    const allTools = getAllTools();
    expect(allTools).toHaveLength(0);
  });
});
