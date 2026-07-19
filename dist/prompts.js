import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const promptDir = join(__dirname, 'prompts');
const languagePrompts = {
    go: readFileSync(join(promptDir, 'go.txt'), 'utf8'),
    python: readFileSync(join(promptDir, 'python.txt'), 'utf8'),
    typescript: readFileSync(join(promptDir, 'typescript.txt'), 'utf8'),
    java: readFileSync(join(promptDir, 'java.txt'), 'utf8'),
    rust: readFileSync(join(promptDir, 'rust.txt'), 'utf8'),
    cpp: readFileSync(join(promptDir, 'cpp.txt'), 'utf8'),
};
export function languageForFile(filePath) {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case '.go': return 'go';
        case '.py': return 'python';
        case '.ts':
        case '.tsx':
        case '.js':
        case '.jsx': return 'typescript';
        case '.java': return 'java';
        case '.rs': return 'rust';
        case '.cpp':
        case '.c':
        case '.h':
        case '.hpp': return 'cpp';
        default: return 'generic';
    }
}
export function languageForTemplate(filePath) {
    const lang = languageForFile(filePath);
    return languagePrompts[lang] ?? '';
}
