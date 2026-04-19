import { describe, expect, it } from 'vitest';
import { formatError, formatSuccess } from '../../src/core/output';

describe('Output', () => {
  it('should format success message for table mode', () => {
    const text = formatSuccess('项目创建成功', { id: 'PROJ001' }, 'table');
    expect(text).toContain('项目创建成功');
    expect(text).toContain('PROJ001');
  });

  it('should format errors for json mode', () => {
    const text = formatError('发生错误', 'json');
    expect(text).toContain('"success": false');
    expect(text).toContain('发生错误');
  });
});
