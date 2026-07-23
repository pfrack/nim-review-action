import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatFindingComment, shouldUseInlineComments } from './github-review.js';
import type { ReviewFinding } from './review-schema.js';

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    file: 'src/main.ts',
    severity: 'Warning',
    issue: 'Potential null dereference',
    critical_action: 'not applicable',
    warning_action: 'Add null check',
    suggestion_action: 'not applicable',
    ...overrides,
  };
}

describe('formatFindingComment', () => {
  it('formats warning finding with emoji', () => {
    const finding = makeFinding();
    const comment = formatFindingComment(finding);
    assert.ok(comment.includes('⚠️'));
    assert.ok(comment.includes('Warning'));
    assert.ok(comment.includes('Potential null dereference'));
  });

  it('formats critical finding with emoji', () => {
    const finding = makeFinding({ severity: 'Critical', critical_action: 'Fix immediately' });
    const comment = formatFindingComment(finding);
    assert.ok(comment.includes('🚨'));
    assert.ok(comment.includes('Critical'));
    assert.ok(comment.includes('Fix immediately'));
  });

  it('formats suggestion finding with emoji', () => {
    const finding = makeFinding({ severity: 'Suggestion', suggestion_action: 'Consider renaming' });
    const comment = formatFindingComment(finding);
    assert.ok(comment.includes('💡'));
    assert.ok(comment.includes('Suggestion'));
  });

  it('includes suggestion when present', () => {
    const finding = makeFinding({ suggestion: 'Use optional chaining' });
    const comment = formatFindingComment(finding);
    assert.ok(comment.includes('Use optional chaining'));
  });

  it('excludes "not applicable" action', () => {
    const finding = makeFinding();
    const comment = formatFindingComment(finding);
    assert.ok(!comment.includes('not applicable'));
  });

  it('includes non-placeholder action', () => {
    const finding = makeFinding({ warning_action: 'Investigate race condition' });
    const comment = formatFindingComment(finding);
    assert.ok(comment.includes('Investigate race condition'));
  });
});

describe('shouldUseInlineComments', () => {
  it('returns true for few line-level findings', () => {
    const findings = [
      makeFinding({ line_start: 10 }),
      makeFinding({ line_start: 20 }),
    ];
    assert.strictEqual(shouldUseInlineComments(findings), true);
  });

  it('returns false for many line-level findings', () => {
    const findings = Array.from({ length: 60 }, (_, i) =>
      makeFinding({ line_start: i + 1 })
    );
    assert.strictEqual(shouldUseInlineComments(findings), false);
  });

  it('counts only line-level findings', () => {
    const findings = [
      ...Array.from({ length: 40 }, (_, i) => makeFinding({ line_start: i + 1 })),
      ...Array.from({ length: 30 }, () => makeFinding({ line_start: undefined })),
    ];
    assert.strictEqual(shouldUseInlineComments(findings), true);
  });
});
