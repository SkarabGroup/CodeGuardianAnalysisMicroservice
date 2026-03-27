import { BranchName } from '../../../src/domain/value-objects/branch-name.vo';

describe('BranchName Value Objects', () => {
  describe('Success Cases', () => {
    it('Should create a valid BranchName instance', () => {
      expect(BranchName.create('develop').getValue()).toBe('develop');
      expect(BranchName.create('feature/feature-name').getValue()).toBe('feature/feature-name');
    });

    it('Should trim whitespaces from the input', () => {
      expect(BranchName.create('     ' + 'feature/fixing/v1/final' + '     ').getValue()).toBe(
        'feature/fixing/v1/final',
      );
    });
  });

  describe('Failure Cases', () => {
    it('Should fail for being an empty string', () => {
      expect(() => BranchName.create('')).toThrow('Must be passed a string');
      expect(() => BranchName.create('   ')).toThrow('Must be passed a string');
    });

    it('Should fail for containing an invalid / and /.../', () => {
      expect(() => BranchName.create('/develop')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('master/')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('/fix/feature/')).toThrow('Invalid branch name format');
    });

    it('Should fail for containing ..', () => {
      expect(() => BranchName.create('dev..elop')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('..master')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('fix/..')).toThrow('Invalid branch name format');
    });

    it('Should fail for containing forbidden special characters', () => {
      expect(() => BranchName.create('fix^')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('?main?')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('~main')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('fix:feature')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('***')).toThrow('Invalid branch name format');
      expect(() => BranchName.create('[branch]')).toThrow('Invalid branch name format');
    });
  });

  describe('Equality', () => {
    it('Should return true if two BranchNames have the same value', () => {
      expect(BranchName.create('main').equals(BranchName.create('main'))).toBeTruthy();
    });

    it('Should return false if two BranchName have different value', () => {
      expect(BranchName.create('develop').equals(BranchName.create('main'))).toBeFalsy();
    });

    it('Should return false if compared with a different type', () => {
      expect(
        BranchName.create('develop').equals({ _value: 'develop' } as unknown as BranchName),
      ).toBeFalsy();
    });
  });
});
