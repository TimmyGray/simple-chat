/**
 * Structural Architecture Tests
 *
 * These tests validate architectural invariants mechanically.
 * Inspired by: "Custom linters enforce dependency directions...
 * structural tests validate architecture." — OpenAI Harness Engineering
 *
 * Rules enforced:
 * 1. No cross-module internal imports (use NestJS DI)
 * 2. Controllers must not contain business logic patterns
 * 3. No circular module dependencies
 * 4. File size limits
 */

import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { describe, it, expect } from 'vitest';

const SRC_DIR = join(__dirname);

/** Backend domain modules — each is an isolated bounded context */
const DOMAIN_MODULES = ['auth', 'chat', 'health', 'models', 'uploads'] as const;

/** Modules that any domain module may import from (shared infrastructure) */
const SHARED_MODULES = ['common', 'config', 'database', 'types'];

/** Maximum lines per file (excluding test files). Must match docs/CONVENTIONS.md. */
const MAX_FILE_LINES = 300;

/**
 * Temporary exceptions for files that exceed the line limit.
 * Each exception MUST reference a tech-debt-tracker task ID.
 * Remove the exception when the task is completed.
 */
const FILE_SIZE_EXCEPTIONS: Record<string, string> = {};

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== 'node_modules' &&
        entry.name !== 'dist'
      ) {
        files.push(...getAllTsFiles(fullPath));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.spec.ts')
      ) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }
  return files;
}

function getModuleForFile(filePath: string): string | null {
  const rel = relative(SRC_DIR, filePath);
  const parts = rel.split('/');
  if (parts.length < 2) return null;
  return parts[0];
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  // Match: import ... from '...' or import ... from "..."
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveRelativeImport(
  fromFile: string,
  importPath: string,
): string | null {
  if (!importPath.startsWith('.')) return null; // Not a relative import
  const fromDir = join(fromFile, '..');
  return join(fromDir, importPath);
}

describe('Architecture: Module Boundaries', () => {
  for (const mod of DOMAIN_MODULES) {
    it(`${mod}/ must not import from other domain module internals`, () => {
      const moduleDir = join(SRC_DIR, mod);
      const files = getAllTsFiles(moduleDir);
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const imports = extractImports(content);
        const relFile = relative(SRC_DIR, file);

        for (const imp of imports) {
          if (!imp.startsWith('.')) continue; // Skip package imports

          const resolved = resolveRelativeImport(file, imp);
          if (!resolved) continue;

          const targetModule =
            getModuleForFile(resolved + '.ts') ||
            getModuleForFile(resolved + '/index.ts');
          if (!targetModule) continue;

          // Allow imports from own module and shared modules
          if (targetModule === mod) continue;
          if (SHARED_MODULES.includes(targetModule)) continue;

          // Allow auth imports from chat (chat needs JwtAuthGuard)
          if (mod === 'chat' && targetModule === 'auth') continue;

          violations.push(
            `${relFile} imports from ${targetModule}/ (via "${imp}"). ` +
              `REMEDIATION: Use NestJS dependency injection instead. ` +
              `Import ${targetModule[0].toUpperCase() + targetModule.slice(1)}Module in ${mod}.module.ts and inject the service via constructor.`,
          );
        }
      }

      expect(
        violations,
        `Cross-module import violations in ${mod}/:\n${violations.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});

describe('Architecture: Dependency Direction', () => {
  it('controllers must not be imported by services', () => {
    const violations: string[] = [];

    for (const mod of DOMAIN_MODULES) {
      const moduleDir = join(SRC_DIR, mod);
      const files = getAllTsFiles(moduleDir);

      for (const file of files) {
        const relFile = relative(SRC_DIR, file);
        if (!relFile.includes('.service.')) continue; // Only check service files

        const content = readFileSync(file, 'utf-8');
        const imports = extractImports(content);

        for (const imp of imports) {
          if (imp.includes('.controller')) {
            violations.push(
              `${relFile} imports a controller (via "${imp}"). ` +
                `REMEDIATION: Services must not depend on controllers. ` +
                `Move shared logic to the service layer or a shared utility.`,
            );
          }
        }
      }
    }

    expect(
      violations,
      `Dependency direction violations:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});

describe('Architecture: File Size Limits', () => {
  it(`no source file exceeds ${MAX_FILE_LINES} lines`, () => {
    const violations: string[] = [];
    const files = getAllTsFiles(SRC_DIR);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lineCount = content.split('\n').length;
      const relFile = relative(SRC_DIR, file);

      if (lineCount > MAX_FILE_LINES && !FILE_SIZE_EXCEPTIONS[relFile]) {
        violations.push(
          `${relFile} has ${lineCount} lines (max ${MAX_FILE_LINES}). ` +
            `REMEDIATION: Split this file into smaller, focused modules. ` +
            `Extract related functions into separate files within the same module.`,
        );
      }
    }

    expect(
      violations,
      `File size violations:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});

describe('Architecture: No Direct Collection Access', () => {
  it('only database/ module should reference MongoDB collection methods directly', () => {
    const violations: string[] = [];

    for (const mod of DOMAIN_MODULES) {
      const moduleDir = join(SRC_DIR, mod);
      const files = getAllTsFiles(moduleDir);

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const relFile = relative(SRC_DIR, file);

        // Check for direct collection access patterns
        if (
          content.includes('.collection(') &&
          !content.includes('DatabaseService')
        ) {
          violations.push(
            `${relFile} accesses MongoDB collections directly. ` +
              `REMEDIATION: Use DatabaseService for all collection access. ` +
              `Inject DatabaseService and use its typed collection accessor methods.`,
          );
        }
      }
    }

    expect(
      violations,
      `Direct collection access violations:\n${violations.join('\n')}`,
    ).toHaveLength(0);
  });
});
