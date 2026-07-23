export interface FileBatch {
  files: string[];
  diffs: Record<string, string>;
}

export function batchFiles(
  filesDiff: Record<string, string>,
  batchSize: number = 50,
): FileBatch[] {
  const sortedFiles = Object.keys(filesDiff).sort();
  const batches: FileBatch[] = [];

  for (let i = 0; i < sortedFiles.length; i += batchSize) {
    const batchFiles = sortedFiles.slice(i, i + batchSize);
    const batchDiffs: Record<string, string> = {};
    for (const file of batchFiles) {
      batchDiffs[file] = filesDiff[file];
    }
    batches.push({ files: batchFiles, diffs: batchDiffs });
  }

  return batches;
}

export function mergeFindings(
  batchResults: Array<{ findings: Array<{ file: string; line_start?: number | null; [key: string]: unknown }>; summary?: string | null }>,
): { findings: Array<{ file: string; line_start?: number | null; [key: string]: unknown }>; summary?: string | null } {
  const seen = new Set<string>();
  const merged: Array<{ file: string; line_start?: number | null; [key: string]: unknown }> = [];
  let summary: string | null = null;

  for (const result of batchResults) {
    if (result.summary && !summary) {
      summary = result.summary;
    }
    for (const finding of result.findings) {
      const key = `${finding.file}:${finding.line_start ?? 'file'}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(finding);
      }
    }
  }

  return { findings: merged, summary };
}
