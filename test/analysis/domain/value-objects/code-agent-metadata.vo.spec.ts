import { CodeAgentMetadata } from '../../../../src/analysis/domain/value-objects/code-agent-metadata.vo';

describe('CodeAgentMetadata VO', () => {
  it('should create a valid instance', () => {
    const vo = CodeAgentMetadata.create('typescript', 'success');
    expect(vo.language).toBe('typescript');
    expect(vo.status).toBe('success');
  });

  it('should trim input strings', () => {
    const vo = CodeAgentMetadata.create('  javascript  ', '  success  ');
    expect(vo.language).toBe('javascript');
    expect(vo.status).toBe('success');
  });

  it('should throw if status is empty', () => {
    expect(() => CodeAgentMetadata.create('ts', '   ')).toThrow('Status cannot be empty');
  });
});
