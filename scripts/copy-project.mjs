#!/usr/bin/env node

// Scaffolds a new project from this template: copies the repo to a new
// directory, renames the "ts-template" placeholder throughout the copy,
// and initializes a fresh git repository there (no template history).
//
// Usage: node scripts/copy-project.mjs <new-name> <destination-path>
//   <new-name>          must be kebab-case, e.g. "invoice-agent"
//   <destination-path>  where the new project should be created
//
// A blind find/replace of "ts-template" is not safe: it shows up in
// several distinct roles that each need a different casing:
//   - npm scope (@ts-template/api) and docker/display names
//     (ts-template-db, ts-template-theme) -> kebab-case, since these are
//     just labels
//   - Postgres roles/db names (ts_template_admin, ts_template_app)
//     -> snake_case, since unquoted SQL identifiers can't contain hyphens
//   - the <title>Ts Template</title> in index.html -> Title Case

import { execFileSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import {
    basename,
    dirname,
    extname,
    join,
    relative,
    resolve,
    sep,
} from 'node:path';

const TEMPLATE_NAME = 'ts-template';
const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

// Directories/files excluded from the copy entirely.
const COPY_SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);
const COPY_SKIP_FILES = new Set(['pnpm-lock.yaml', 'copy-project.mjs']);

// Directories skipped when scanning the copy for text to rename.
const RENAME_SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

const TEXT_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.yml',
    '.yaml',
    '.html',
    '.sql',
    '.toml',
    '.md',
    '.css',
]);

function isValidName(name) {
    return typeof name === 'string' && NAME_PATTERN.test(name);
}

// husky writes its shim scripts into .husky/_ on `pnpm install`; it's
// generated, not part of the template, so don't copy it — the new
// project's own `pnpm install` regenerates it.
function isHuskyGenerated(path) {
    const parts = path.split(sep);
    return parts.at(-2) === '.husky' && parts.at(-1) === '_';
}

function shouldCopy(src) {
    const name = basename(src);
    if (COPY_SKIP_DIRS.has(name)) return false;
    if (COPY_SKIP_FILES.has(name)) return false;
    if (name.endsWith('.tsbuildinfo')) return false;
    if (isHuskyGenerated(src)) return false;
    return true;
}

function isEnvFile(name) {
    return name === '.env' || name.startsWith('.env.');
}

function isTargetFile(name) {
    return TEXT_EXTENSIONS.has(extname(name)) || isEnvFile(name);
}

function toTitleCase(kebab) {
    return kebab
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildReplacer(fromKebab, toKebab) {
    const from = {
        kebab: fromKebab,
        snake: fromKebab.replace(/-/g, '_'),
        title: toTitleCase(fromKebab),
    };
    const to = {
        kebab: toKebab,
        snake: toKebab.replace(/-/g, '_'),
        title: toTitleCase(toKebab),
    };

    const rules = [
        [
            new RegExp(`"name":\\s*"${escapeRegExp(from.kebab)}"`, 'g'),
            `"name": "${to.kebab}"`,
        ],
        [new RegExp(`\\b${escapeRegExp(from.kebab)}/`, 'g'), `${to.kebab}/`],
        [new RegExp(`\\b${escapeRegExp(from.snake)}_`, 'g'), `${to.snake}_`],
        [new RegExp(`\\b${escapeRegExp(from.kebab)}-`, 'g'), `${to.kebab}-`],
        [new RegExp(`\\b${escapeRegExp(from.title)}\\b`, 'g'), to.title],
        [new RegExp(`\\b${escapeRegExp(from.snake)}\\b`, 'g'), to.snake],
        [new RegExp(`\\b${escapeRegExp(from.kebab)}\\b`, 'g'), to.kebab],
    ];

    return (content) =>
        rules.reduce(
            (text, [pattern, replacement]) =>
                text.replace(pattern, replacement),
            content
        );
}

function walkTextFiles(dir, files = []) {
    for (const entry of readdirSync(dir)) {
        if (RENAME_SKIP_DIRS.has(entry)) continue;

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            walkTextFiles(fullPath, files);
        } else if (isTargetFile(entry)) {
            files.push(fullPath);
        }
    }
    return files;
}

function renameInDir(dir, fromName, toName) {
    const replace = buildReplacer(fromName, toName);
    const files = walkTextFiles(dir);
    const changed = [];

    for (const file of files) {
        const original = readFileSync(file, 'utf-8');
        const updated = replace(original);

        if (updated !== original) {
            writeFileSync(file, updated);
            changed.push(relative(dir, file));
        }
    }

    return changed;
}

// The root package.json's "copy" script points at this file, which is
// deliberately excluded from the copy — so the new project would be left
// with a script referencing a file that doesn't exist. Strip it.
function stripCopyScript(destination) {
    const pkgPath = join(destination, 'package.json');
    if (!existsSync(pkgPath)) return;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.scripts && 'copy' in pkg.scripts) {
        delete pkg.scripts.copy;
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`);
    }
}

// Renaming can push lines past biome's line-width limit (e.g. a longer
// project name in a JSX attribute), so reformat before the initial commit —
// otherwise the scaffolded project can fail its own lint check immediately.
function formatCopy(source, destination) {
    const biomeBin = join(source, 'node_modules', '.bin', 'biome');
    if (!existsSync(biomeBin)) return;

    try {
        execFileSync(biomeBin, ['check', '--write', '.'], {
            cwd: destination,
            stdio: 'ignore',
        });
    } catch {
        // Non-fatal: only cosmetic formatting is at stake here.
    }
}

function initGit(destination) {
    try {
        execFileSync('git', ['init'], { cwd: destination, stdio: 'ignore' });
        execFileSync('git', ['add', '-A'], {
            cwd: destination,
            stdio: 'ignore',
        });
        execFileSync(
            'git',
            ['commit', '-m', `Initial commit from ${TEMPLATE_NAME}`],
            { cwd: destination, stdio: 'ignore' }
        );
        return true;
    } catch (err) {
        console.warn(
            `Warning: git init/commit failed, you can run this manually: ${err.message}`
        );
        return false;
    }
}

function main() {
    const [, , newName, destArg] = process.argv;

    if (!isValidName(newName) || !destArg) {
        console.error(
            'Usage: node scripts/copy-project.mjs <new-name> <destination-path>'
        );
        console.error(
            'Error: <new-name> must be kebab-case (lowercase letters, digits, hyphens), e.g. "invoice-agent"'
        );
        console.error(
            '       <destination-path> is where the new project will be created, e.g. "../invoice-agent"'
        );
        process.exit(1);
    }

    const source = process.cwd();
    const destination = resolve(destArg);

    if (existsSync(destination)) {
        console.error(`Error: destination already exists: ${destination}`);
        console.error(
            'Refusing to copy into an existing path — choose a new location.'
        );
        process.exit(1);
    }

    mkdirSync(dirname(destination), { recursive: true });

    console.log(`Copying ${source} -> ${destination} ...`);
    cpSync(source, destination, { recursive: true, filter: shouldCopy });

    console.log(`Renaming "${TEMPLATE_NAME}" -> "${newName}" in the copy...`);
    const changed = renameInDir(destination, TEMPLATE_NAME, newName);
    console.log(`  updated ${changed.length} file(s)`);

    stripCopyScript(destination);
    formatCopy(source, destination);

    console.log('Initializing a fresh git repository...');
    const gitOk = initGit(destination);

    console.log(`\nDone. New project created at ${destination}`);
    if (!gitOk) {
        console.log('(git init/commit was skipped — see warning above)');
    }
    console.log('Next steps:');
    console.log(`  cd ${destArg}`);
    console.log('  pnpm install');
    console.log('  pnpm local:up   # start local Postgres + Redis');
}

main();
