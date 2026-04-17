import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { ToolError } from '../../../../src/analysis/domain/value-objects/tool-error.vo';

describe('ToolError (Value Object)', () => {
  const VALID_DESCRIPTION = DescriptionFinding.create('Test tool error description');
  const VALID_TOOL_NAME = 'eslint';

  describe('Success cases', () => {
    it('should create a valid ToolError instance', () => {
      const toolError = ToolError.create(VALID_TOOL_NAME, VALID_DESCRIPTION);

      expect(toolError).toBeDefined();
    });

    it('should return true for equal objects', () => {
      const t1 = ToolError.create(VALID_TOOL_NAME, VALID_DESCRIPTION);
      const t2 = ToolError.create(
        'eslint',
        DescriptionFinding.create('Test tool error description'),
      );

      expect(t1.equals(t2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const toolError = ToolError.create(VALID_TOOL_NAME, VALID_DESCRIPTION);

      expect(toolError.getToolName()).toBe(VALID_TOOL_NAME);
      expect(toolError.getDescriptionFinding()).toBe(VALID_DESCRIPTION);
    });

    it('should trim string fields when creating an instance', () => {
      const toolError = ToolError.create('   prettier   ', VALID_DESCRIPTION);

      expect(toolError.getToolName()).toBe('prettier');
    });
  });

  describe('Failure cases', () => {
    it('should throw if tool name is empty', () => {
      expect(() => ToolError.create('', VALID_DESCRIPTION)).toThrow(
        'Tool name must be a non-empty string',
      );

      expect(() => ToolError.create('   ', VALID_DESCRIPTION)).toThrow(
        'Tool name must be a non-empty string',
      );
    });

    it('should throw if tool name is not a string', () => {
      expect(() => ToolError.create({} as unknown as string, VALID_DESCRIPTION)).toThrow(
        'Tool name must be a non-empty string',
      );

      expect(() => ToolError.create(null as unknown as string, VALID_DESCRIPTION)).toThrow(
        'Tool name must be a non-empty string',
      );
    });

    it('should throw if description is invalid', () => {
      expect(() => ToolError.create(VALID_TOOL_NAME, {} as unknown as DescriptionFinding)).toThrow(
        'Invalid DescriptionFinding',
      );

      expect(() =>
        ToolError.create(VALID_TOOL_NAME, null as unknown as DescriptionFinding),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should return false for different objects', () => {
      const t1 = ToolError.create(VALID_TOOL_NAME, VALID_DESCRIPTION);

      const t2 = ToolError.create('other-tool', VALID_DESCRIPTION);

      const t3 = ToolError.create(
        VALID_TOOL_NAME,
        DescriptionFinding.create('Different description'),
      );

      expect(t1.equals(t2)).toBe(false);
      expect(t1.equals(t3)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const toolError = ToolError.create(VALID_TOOL_NAME, VALID_DESCRIPTION);

      expect(() => toolError.equals(null)).toThrow('Invalid argument');
      expect(() => toolError.equals({})).toThrow('Invalid argument');
    });
  });
});
