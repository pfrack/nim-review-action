import { describe, it } from 'node:test';
import assert from 'node:assert';
import { languageForFile, languageForTemplate } from './prompts.js';

describe('languageForFile', () => {
  const tests: [string, string][] = [
    ['main.go', 'go'],
    ['pkg/util.go', 'go'],
    ['app.py', 'python'],
    ['lib/module.py', 'python'],
    ['src/index.ts', 'typescript'],
    ['src/app.tsx', 'typescript'],
    ['src/utils.js', 'typescript'],
    ['src/component.jsx', 'typescript'],
    ['Main.java', 'java'],
    ['src/main.rs', 'rust'],
    ['lib/core.cpp', 'cpp'],
    ['src/header.h', 'cpp'],
    ['include/module.hpp', 'cpp'],
    ['lib/legacy.c', 'cpp'],
    ['README.md', 'generic'],
    ['config.yaml', 'generic'],
    ['data.json', 'generic'],
  ];

  for (const [fp, want] of tests) {
    it(`returns "${want}" for "${fp}"`, () => {
      assert.strictEqual(languageForFile(fp), want);
    });
  }
});

describe('languageForTemplate', () => {
  it('returns Go prompt for .go files', () => {
    const prompt = languageForTemplate('main.go');
    assert.ok(prompt.includes('Go code'));
    assert.ok(prompt.includes('Goroutine'));
  });

  it('returns Python prompt for .py files', () => {
    const prompt = languageForTemplate('app.py');
    assert.ok(prompt.includes('Python code'));
    assert.ok(prompt.includes('Mutable default'));
  });

  it('returns TypeScript prompt for .ts files', () => {
    const prompt = languageForTemplate('index.ts');
    assert.ok(prompt.includes('TypeScript'));
    assert.ok(prompt.toLowerCase().includes('async/await'));
  });

  it('returns empty string for unknown extensions', () => {
    assert.strictEqual(languageForTemplate('README.md'), '');
  });
});
