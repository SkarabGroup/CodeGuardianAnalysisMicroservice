import { MissingFile } from '../../../../src/analysis/domain/value-objects/missing-file.vo';
import { PathFinding } from '../../../../src/analysis/domain/value-objects/path-finding.vo';
import { DescriptionFinding } from '../../../../src/analysis/domain/value-objects/description-finding.vo';
import { StatusMissing } from '../../../../src/analysis/domain/enums/status-missing.enum';

describe('MissingFile (Value Object)', () => {
  const VALID_REFERENCED_PATH = PathFinding.create('src/images/logo.png');
  const VALID_REFERENCED_IN = PathFinding.create('src/components/Header.tsx');
  const VALID_DESCRIPTION = DescriptionFinding.create(
    'File referenced in component but not found on disk',
  );
  const VALID_STATUS = StatusMissing.NOT_FOUND;

  describe('Success cases', () => {
    it('should create a valid MissingFile instance', () => {
      const missingFile = MissingFile.create(
        VALID_REFERENCED_PATH,
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );

      expect(missingFile).toBeDefined();
      expect(missingFile).toBeInstanceOf(MissingFile);
    });

    it('should return true for equal objects', () => {
      const m1 = MissingFile.create(
        VALID_REFERENCED_PATH,
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );
      const m2 = MissingFile.create(
        PathFinding.create('src/images/logo.png'),
        PathFinding.create('src/components/Header.tsx'),
        StatusMissing.NOT_FOUND,
        DescriptionFinding.create('File referenced in component but not found on disk'),
      );

      expect(m1.equals(m2)).toBe(true);
    });

    it('should return correct values from getters', () => {
      const missingFile = MissingFile.create(
        VALID_REFERENCED_PATH,
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );

      expect(missingFile.getReferencedPath()).toBe(VALID_REFERENCED_PATH);
      expect(missingFile.getReferencedIn()).toBe(VALID_REFERENCED_IN);
      expect(missingFile.getStatusMissing()).toBe(VALID_STATUS);
      expect(missingFile.getDescriptionFinding()).toBe(VALID_DESCRIPTION);
    });
  });

  describe('Failure cases', () => {
    it('should throw if referencedPath is invalid', () => {
      expect(() =>
        MissingFile.create(
          {} as unknown as PathFinding,
          VALID_REFERENCED_IN,
          VALID_STATUS,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if referencedIn is invalid', () => {
      expect(() =>
        MissingFile.create(
          VALID_REFERENCED_PATH,
          {} as unknown as PathFinding,
          VALID_STATUS,
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid PathFinding');
    });

    it('should throw if description is invalid', () => {
      expect(() =>
        MissingFile.create(
          VALID_REFERENCED_PATH,
          VALID_REFERENCED_IN,
          VALID_STATUS,
          {} as unknown as DescriptionFinding,
        ),
      ).toThrow('Invalid DescriptionFinding');
    });

    it('should return false for different objects', () => {
      const m1 = MissingFile.create(
        VALID_REFERENCED_PATH,
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );

      const m2 = MissingFile.create(
        PathFinding.create('other/path.png'), // Percorso diverso
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );

      expect(m1.equals(m2)).toBe(false);
    });

    it('should throw when comparing with invalid object', () => {
      const m = MissingFile.create(
        VALID_REFERENCED_PATH,
        VALID_REFERENCED_IN,
        VALID_STATUS,
        VALID_DESCRIPTION,
      );

      expect(() => m.equals(null)).toThrow('Invalid argument');
      expect(() => m.equals({})).toThrow('Invalid argument');
    });

    it('should throw if status is not a valid StatusMissing enum value', () => {
      expect(() =>
        MissingFile.create(
          VALID_REFERENCED_PATH,
          VALID_REFERENCED_IN,
          'INVALID_STATUS',
          VALID_DESCRIPTION,
        ),
      ).toThrow('Invalid status missing');
    });
  });
});
