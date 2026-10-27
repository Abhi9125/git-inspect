import { SignalResult } from '@git-forensics/shared';
import { RawCommit } from '../../github/github.service';

export function analyzeFileDiversity(commits: RawCommit[]): SignalResult {
  const uniqueFiles = new Set<string>();
  const uniqueDirs = new Set<string>();

  for (const c of commits) {
    if (c.files && Array.isArray(c.files)) {
      for (const f of c.files) {
        uniqueFiles.add(f);
        const parts = f.split('/');
        uniqueDirs.add(parts.length > 1 ? parts[0] : 'root');
      }
    }
  }

  const fileCount = uniqueFiles.size;
  const dirCount = uniqueDirs.size;
  const totalCommits = commits.length;

  // Red Flag: 20+ commits only touching 1 file
  if (totalCommits >= 20 && fileCount <= 1) {
    const singleFile = Array.from(uniqueFiles)[0] || 'single file';
    return {
      id: 'file_diversity',
      name: 'File Diversity & Structural Breadth',
      status: 'ALERT',
      scorePenalty: 35,
      summary: `${totalCommits} commits exclusively touched 1 single file (${singleFile})`,
      details: {
        uniqueFiles: fileCount,
        uniqueDirectories: dirCount,
        sampleFiles: Array.from(uniqueFiles).slice(0, 5),
        singleFileDominance: true,
      },
      explanation:
        'Classic bot spoofing pattern: Real software engineering touches multiple modules, configs, and assets. A repo where tens or hundreds of commits only alter one dummy file indicates automated streak faking.',
    };
  }

  // Warning: 20+ commits only touching <= 3 files
  if (totalCommits >= 20 && fileCount <= 3) {
    return {
      id: 'file_diversity',
      name: 'File Diversity & Structural Breadth',
      status: 'WARNING',
      scorePenalty: 15,
      summary: `Low diversity: ${totalCommits} commits touched only ${fileCount} files across ${dirCount} directory`,
      details: {
        uniqueFiles: fileCount,
        uniqueDirectories: dirCount,
        sampleFiles: Array.from(uniqueFiles).slice(0, 5),
        singleFileDominance: false,
      },
      explanation:
        'Very low structural diversity detected. Commits are confined to an unusually small set of files.',
    };
  }

  // Pass: Healthy distribution
  return {
    id: 'file_diversity',
    name: 'File Diversity & Structural Breadth',
    status: 'PASS',
    scorePenalty: 0,
    summary: `${fileCount} unique files modified across ${dirCount} directories`,
    details: {
      uniqueFiles: fileCount,
      uniqueDirectories: dirCount,
      directories: Array.from(uniqueDirs).slice(0, 8),
      singleFileDominance: false,
    },
    explanation:
      'Commits touch a realistic spread of files and folders (source code, configuration, tests, documentation), confirming genuine modular project development.',
  };
}
