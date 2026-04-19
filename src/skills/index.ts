/**
 * 技能发现与读取
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Skill } from '../types';
import { getSkillMapping } from './mappings';

interface FrontmatterData {
  name?: string;
  description?: string;
}

function getPackageRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(currentDir, '../'),
    resolve(currentDir, '../../'),
  ];

  const packageRoot = candidates.find(candidate =>
    existsSync(join(candidate, 'package.json')) && existsSync(join(candidate, 'skills'))
  );

  return packageRoot ?? resolve(currentDir, '../../');
}

function getSkillsRoot(): string {
  return join(getPackageRoot(), 'skills');
}

function parseFrontmatter(content: string): FrontmatterData {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') {
    return {};
  }

  let i = 1;
  const data: FrontmatterData = {};

  while (i < lines.length) {
    const line = lines[i];
    if (line?.trim() === '---') {
      break;
    }

    if (line?.startsWith('name:')) {
      data.name = line.slice('name:'.length).trim();
      i += 1;
      continue;
    }

    if (line?.startsWith('description:')) {
      const inline = line.slice('description:'.length).trim();
      if (inline && inline !== '|') {
        data.description = inline;
        i += 1;
        continue;
      }

      i += 1;
      const block: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        if (!next) {
          block.push('');
          i += 1;
          continue;
        }
        if (!next.startsWith('  ')) {
          break;
        }
        block.push(next.slice(2));
        i += 1;
      }
      data.description = block.join('\n').trim();
      continue;
    }

    i += 1;
  }

  return data;
}

function listReferenceFiles(referencesDir: string): string[] {
  if (!existsSync(referencesDir)) {
    return [];
  }

  return readdirSync(referencesDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(file => join(referencesDir, file));
}

function loadSkillFromDirectory(skillDir: string): Skill | undefined {
  const skillPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillPath) || !statSync(skillPath).isFile()) {
    return undefined;
  }

  const raw = readFileSync(skillPath, 'utf8');
  const frontmatter = parseFrontmatter(raw);
  const name = frontmatter.name?.trim();
  const description = frontmatter.description?.trim();

  if (!name || !description) {
    return undefined;
  }

  const referencesDir = join(skillDir, 'references');
  const mapping = getSkillMapping(name);
  const skill: Skill = {
    name,
    description,
    skillPath,
    references: listReferenceFiles(referencesDir),
    ...mapping,
  };

  if (existsSync(referencesDir)) {
    skill.referencesDir = referencesDir;
  }

  return skill;
}

function discoverSkills(): Skill[] {
  const skillsRoot = getSkillsRoot();
  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot)
    .map(entry => join(skillsRoot, entry))
    .filter(entryPath => statSync(entryPath).isDirectory())
    .map(loadSkillFromDirectory)
    .filter((skill): skill is Skill => Boolean(skill))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

export const SKILLS: Skill[] = discoverSkills();

export function getSkill(name: string): Skill | undefined {
  return SKILLS.find(skill => skill.name === name);
}

export function getAllSkills(): Skill[] {
  return [...SKILLS];
}

export function getSkillsRootPath(): string {
  return getSkillsRoot();
}
