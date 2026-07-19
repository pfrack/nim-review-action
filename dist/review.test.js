import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseDiff, shouldExclude, resolveSystemPrompt } from './review.js';
describe('parseDiff', () => {
    it('splits multi-file diffs', () => {
        const raw = `diff --git a/main.go b/main.go
index 1234567..abcdefg 100644
--- a/main.go
+++ b/main.go
@@ -1,3 +1,4 @@
 package main

+// Added comment
 func main() {}
diff --git a/config.yaml b/config.yaml
new file mode 100644
--- /dev/null
+++ b/config.yaml
@@ -0,0 +1,2 @@
+key: value
`;
        const files = parseDiff(raw);
        assert.strictEqual(Object.keys(files).length, 2);
        assert.ok('main.go' in files);
        assert.ok('config.yaml' in files);
    });
    it('returns empty for empty input', () => {
        const files = parseDiff('');
        assert.strictEqual(Object.keys(files).length, 0);
    });
});
describe('shouldExclude', () => {
    const tests = [
        { name: 'exact match', filepath: 'go.sum', patterns: ['go.sum', '*.lock'], want: true },
        { name: 'wildcard match via basename', filepath: 'vendor/github.com/foo/bar.go', patterns: ['*.go'], want: true },
        { name: 'basename match', filepath: 'deep/nested/path/go.sum', patterns: ['*.sum'], want: true },
        { name: 'no match', filepath: 'main.go', patterns: ['*.lock', '*.md'], want: false },
        { name: 'empty patterns', filepath: 'anything.go', patterns: [], want: false },
        { name: 'image file', filepath: 'assets/logo.png', patterns: ['*.png', '*.svg'], want: true },
        { name: 'markdown file', filepath: 'README.md', patterns: ['*.md'], want: true },
    ];
    for (const tt of tests) {
        it(tt.name, () => {
            assert.strictEqual(shouldExclude(tt.filepath, tt.patterns), tt.want);
        });
    }
});
describe('resolveSystemPrompt', () => {
    const baseConfig = {
        baseURL: '',
        apiKey: '',
        models: [],
        maxFiles: 15,
        excludePatterns: [],
        systemPrompt: '',
        promptMode: 'append',
    };
    it('returns base prompt when no env and no lang match', () => {
        const prompt = resolveSystemPrompt('config.yaml', baseConfig);
        assert.ok(prompt.includes('code review'));
        assert.ok(prompt.includes('Severity'));
    });
    it('returns lang prompt when no env and lang matches', () => {
        const prompt = resolveSystemPrompt('main.go', baseConfig);
        assert.ok(prompt.includes('Go code'));
        assert.ok(prompt.includes('Goroutine'));
    });
    it('returns env prompt in replace mode', () => {
        const prompt = resolveSystemPrompt('main.go', {
            ...baseConfig,
            systemPrompt: 'You are a security auditor.',
            promptMode: 'replace',
        });
        assert.strictEqual(prompt, 'You are a security auditor.');
    });
    it('appends env prompt to lang template in append mode', () => {
        const prompt = resolveSystemPrompt('app.py', {
            ...baseConfig,
            systemPrompt: 'Focus on security.',
            promptMode: 'append',
        });
        assert.ok(prompt.includes('Focus on security.'));
        assert.ok(prompt.includes('Python code'));
        assert.ok(prompt.includes('Mutable default'));
    });
    it('appends env prompt to base when no lang match', () => {
        const prompt = resolveSystemPrompt('config.yaml', {
            ...baseConfig,
            systemPrompt: 'Focus on security.',
            promptMode: 'append',
        });
        assert.ok(prompt.includes('Focus on security.'));
        assert.ok(prompt.includes('code review'));
    });
});
