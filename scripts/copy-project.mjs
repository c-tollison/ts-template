#!/usr/bin/env node

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
    isAbsolute,
    join,
    relative,
    resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE_NAME = 'ts-template';
const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const COPY_SKIP = new Set([
    'scripts/copy-project.mjs',
    'LICENSE',
    'pnpm-lock.yaml',
]);

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

function isEnvFile(name) {
    return name === '.env' || name.startsWith('.env.');
}

function isTargetFile(name) {
    return TEXT_EXTENSIONS.has(extname(name)) || isEnvFile(name);
}

function listTemplateFiles(source) {
    const gitList = (args) =>
        execFileSync('git', ['-C', source, 'ls-files', '-z', ...args], {
            encoding: 'utf-8',
        })
            .split('\0')
            .filter(Boolean);

    const files = gitList(['--cached', '--others', '--exclude-standard']);
    const envFiles = gitList([
        '--others',
        '--ignored',
        '--exclude-standard',
        '--directory',
    ]).filter((file) => isEnvFile(basename(file)));

    return [...new Set([...files, ...envFiles])].filter(
        (file) => !COPY_SKIP.has(file) && existsSync(join(source, file))
    );
}

function copyTemplate(source, destination) {
    const files = listTemplateFiles(source);
    for (const file of files) {
        const dest = join(destination, file);
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(join(source, file), dest);
    }
    return files.length;
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

function stripCopyScript(destination) {
    const pkgPath = join(destination, 'package.json');
    if (!existsSync(pkgPath)) return;

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.scripts && 'copy' in pkg.scripts) {
        delete pkg.scripts.copy;
        writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`);
    }
}

function formatCopy(source, destination) {
    const biomeBin = join(source, 'node_modules', '.bin', 'biome');
    if (!existsSync(biomeBin)) return;

    try {
        execFileSync(biomeBin, ['check', '--write', '.'], {
            cwd: destination,
            stdio: 'ignore',
        });
    } catch {}
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
            'Error: <new-name> must be kebab-case (lowercase letters, digits, hyphens), e.g. "mimic"'
        );
        console.error(
            '       <destination-path> is where the new project will be created, e.g. "../mimic"'
        );
        process.exit(1);
    }

    const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const destination = resolve(destArg);

    if (existsSync(destination)) {
        console.error(`Error: destination already exists: ${destination}`);
        console.error(
            'Refusing to copy into an existing path — choose a new location.'
        );
        process.exit(1);
    }

    const fromSource = relative(source, destination);
    if (
        fromSource === '' ||
        (!fromSource.startsWith('..') && !isAbsolute(fromSource))
    ) {
        console.error(
            `Error: destination is inside the template repo: ${destination}`
        );
        console.error('Choose a path outside this repository.');
        process.exit(1);
    }

    mkdirSync(dirname(destination), { recursive: true });

    console.log(`Copying ${source} -> ${destination} ...`);
    const copied = copyTemplate(source, destination);
    console.log(`  copied ${copied} file(s)`);

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
    console.log('  pnpm local:up   # start local Postgres');
}

main();
