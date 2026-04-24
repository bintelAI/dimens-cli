import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { getSkill, getAllSkills, getSkillsRootPath } from '../../skills';
import { formatSuccess } from '../../core/output';
import { getContext, parseFlags, printError } from '../utils';

function requireSkillName(args: string[]): string {
  const skillName = args[0];
  if (!skillName) {
    throw new Error('缺少技能名称，请传入 skill info <name> 或 skill show <name>');
  }
  return skillName;
}

function getSkillOrThrow(name: string) {
  const skill = getSkill(name);
  if (!skill) {
    throw new Error(`未找到技能: ${name}`);
  }
  return skill;
}

function toRelativeSkillPath(filePath: string): string {
  return relative(getSkillsRootPath(), filePath) || filePath;
}

function printList(title: string, items?: string[]): void {
  console.log(`${title}:`);
  if (!items || items.length === 0) {
    console.log('  (无)');
    return;
  }
  items.forEach(item => {
    console.log(`  - ${item}`);
  });
}

function normalizeSkillForOutput(skill: ReturnType<typeof getSkillOrThrow>) {
  return {
    ...skill,
    recommendExamples: getRecommendExamples(skill.name),
    skillPath: skill.skillPath ? toRelativeSkillPath(skill.skillPath) : undefined,
    referencesDir: skill.referencesDir
      ? toRelativeSkillPath(skill.referencesDir)
      : undefined,
    references: skill.references?.map(reference => toRelativeSkillPath(reference)) ?? [],
  };
}

function printMapping(skill: ReturnType<typeof getSkillOrThrow>): void {
  printList('命令组', skill.commandGroups);
  printList('命令', skill.commands);
  printList('SDK', skill.sdkModules);
  printList('工具', skill.toolNames);
}

const SKILL_RECOMMEND_EXAMPLES: Record<string, string[]> = {
  'dimens-system-orchestrator': [
    '帮我生成一个客户管理系统',
    '帮我做一个项目管理平台',
    '生成一个审批系统',
  ],
  'dimens-manager': [
    '团队 项目 成员',
    '行级权限 公开访问 只读',
    '报表 图表 参数筛选',
    '工作流 默认模型 AI 分析',
    'api-key token 第三方鉴权',
  ],
  'dimens-sdk': [
    'Web 前端 SDK 接入',
    'BFF token refresh',
    'Node.js HTTP API 调用',
  ],
};

function getRecommendExamples(skillName: string): string[] {
  return SKILL_RECOMMEND_EXAMPLES[skillName] ?? [];
}

function getRecommendQuery(args: string[]): string {
  const queryParts: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (!current) {
      continue;
    }
    if (current.startsWith('--')) {
      const next = args[index + 1];
      if (next && !next.startsWith('--')) {
        index += 1;
      }
      continue;
    }
    queryParts.push(current);
  }

  return queryParts.join(' ').trim();
}

const SYSTEM_BUILD_VERBS = ['生成', '新建', '创建', '做', '搭建', '搭', '构建', '开发'];
const SYSTEM_BUILD_TARGETS = [
  '系统',
  '平台',
  '管理系统',
  '业务系统',
  'crm',
  '客户管理',
  '项目管理',
  '售后管理',
  '审批系统',
];

const WORKFLOW_INTENT_KEYWORDS = [
  '工作流',
  'workflow',
  'flow',
  '默认模型',
  'ai 分析',
  '审批流程',
  '自动化',
];

const AUTH_INTENT_KEYWORDS = [
  'api-key',
  'apikey',
  'api key',
  'api-secret',
  'apisecret',
  'api secret',
  'token',
  '登录',
  '鉴权',
];

const TABLE_INTENT_KEYWORDS = [
  '多维表格',
  'sheet',
  'row',
  'column',
  '字段',
  '视图',
  'table',
];

const PERMISSION_INTENT_KEYWORDS = [
  '权限',
  '行级权限',
  '列权限',
  '公开访问',
  '只读',
  'acl',
  '协同越权',
];

const REPORT_INTENT_KEYWORDS = [
  '报表',
  '图表',
  'dashboard',
  '参数筛选',
  '数据源',
  '统计',
  '看板',
];

const PROJECT_INTENT_KEYWORDS = [
  '项目初始化',
  '项目搭建',
  'project',
  'project create',
  '建项目',
  '创建项目',
  '默认视图',
  '初始化',
];

const SDK_INTENT_KEYWORDS = [
  'sdk',
  'http',
  'api 调用',
  'web 接入',
  '前端接入',
  '移动端',
  'app',
  '小程序',
  'bff',
  'node',
  'node.js',
  '集成',
  '对接开发',
];

function getSystemOrchestratorBonus(
  skill: ReturnType<typeof getSkillOrThrow>,
  normalizedQuery: string
): number {
  if (skill.name !== 'dimens-system-orchestrator') {
    return 0;
  }

  const hasBuildVerb = SYSTEM_BUILD_VERBS.some(keyword =>
    normalizedQuery.includes(keyword)
  );
  const matchedTargets = SYSTEM_BUILD_TARGETS.filter(keyword =>
    normalizedQuery.includes(keyword)
  );

  let score = 0;
  if (hasBuildVerb && matchedTargets.length > 0) {
    score += 10;
  }

  score += matchedTargets.length * 4;
  return score;
}

function hasIntentKeyword(
  normalizedQuery: string,
  keywords: string[]
): boolean {
  return keywords.some(keyword => normalizedQuery.includes(keyword));
}

function getSkillMatchSignals(
  skill: ReturnType<typeof getSkillOrThrow>,
  query: string
): { score: number; matchedBy: string[]; reason: string } {
  const normalizedQuery = query.toLowerCase();
  const haystacks = [
    skill.name,
    skill.description,
    ...(skill.tags ?? []),
    ...(skill.commandGroups ?? []),
    ...(skill.commands ?? []),
    ...(skill.sdkModules ?? []),
    ...(skill.toolNames ?? []),
  ]
    .join('\n')
    .toLowerCase();

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const keywords = normalizedQuery
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean);

  let keywordScore = 0;
  const matchedBy: string[] = [];

  keywords.forEach(keyword => {
    if (!keyword) {
      return;
    }
    if (skill.name.toLowerCase().includes(keyword)) {
      keywordScore += 4;
      if (!matchedBy.includes('name-keyword')) {
        matchedBy.push('name-keyword');
      }
      return;
    }
    if (haystacks.includes(keyword)) {
      keywordScore += 1;
      if (!matchedBy.includes('context-keyword')) {
        matchedBy.push('context-keyword');
      }
    }
  });

  let phraseScore = 0;
  if (compactQuery && compactQuery !== normalizedQuery && haystacks.includes(compactQuery)) {
    phraseScore += 2;
  }
  if (compactQuery && haystacks.includes(compactQuery)) {
    phraseScore += 2;
  }
  if (phraseScore > 0 && !matchedBy.includes('compact-phrase')) {
    matchedBy.push('compact-phrase');
  }

  const systemBonus = getSystemOrchestratorBonus(skill, normalizedQuery);
  if (systemBonus > 0) {
    matchedBy.push('system-build-intent');
  }

  if (skill.name === 'dimens-manager') {
    if (hasIntentKeyword(normalizedQuery, PROJECT_INTENT_KEYWORDS)) {
      matchedBy.push('project-intent');
      keywordScore += 3;
    }
    if (hasIntentKeyword(normalizedQuery, WORKFLOW_INTENT_KEYWORDS)) {
      matchedBy.push('workflow-intent');
      keywordScore += 3;
    }
    if (hasIntentKeyword(normalizedQuery, AUTH_INTENT_KEYWORDS)) {
      matchedBy.push('auth-intent');
      keywordScore += 3;
    }
    if (hasIntentKeyword(normalizedQuery, TABLE_INTENT_KEYWORDS)) {
      matchedBy.push('table-intent');
      keywordScore += 3;
    }
    if (hasIntentKeyword(normalizedQuery, PERMISSION_INTENT_KEYWORDS)) {
      matchedBy.push('permission-intent');
      keywordScore += 3;
    }
    if (hasIntentKeyword(normalizedQuery, REPORT_INTENT_KEYWORDS)) {
      matchedBy.push('report-intent');
      keywordScore += 3;
    }
  }

  if (skill.name === 'dimens-sdk' && hasIntentKeyword(normalizedQuery, SDK_INTENT_KEYWORDS)) {
    matchedBy.push('sdk-intent');
    keywordScore += 4;
  }

  const score = keywordScore + phraseScore + systemBonus;
  const reasonParts: string[] = [];

  if (systemBonus > 0) {
    reasonParts.push('命中系统建设意图');
  }
  if (matchedBy.includes('project-intent')) {
    reasonParts.push('命中项目初始化意图');
  }
  if (matchedBy.includes('workflow-intent')) {
    reasonParts.push('命中工作流意图');
  }
  if (matchedBy.includes('auth-intent')) {
    reasonParts.push('命中鉴权接入意图');
  }
  if (matchedBy.includes('table-intent')) {
    reasonParts.push('命中多维表格意图');
  }
  if (matchedBy.includes('permission-intent')) {
    reasonParts.push('命中权限意图');
  }
  if (matchedBy.includes('report-intent')) {
    reasonParts.push('命中报表意图');
  }
  if (matchedBy.includes('sdk-intent')) {
    reasonParts.push('命中 SDK / 接入开发意图');
  }
  if (matchedBy.includes('name-keyword')) {
    reasonParts.push('匹配到技能名关键词');
  }
  if (matchedBy.includes('context-keyword')) {
    reasonParts.push('匹配到描述或映射关键词');
  }
  if (matchedBy.includes('compact-phrase')) {
    reasonParts.push('匹配到紧凑短语');
  }

  return {
    score,
    matchedBy,
    reason: reasonParts.join('；') || '基于关键词相关性匹配',
  };
}

export function registerSkillCommands(): void {
  createCommandGroup('skill', '技能查看与提示语文档');

  registerGroupCommand(
    'skill',
    createCommand(
      'list',
      '列出所有已发现的技能',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const skills = getAllSkills();
          if (context.output === 'json') {
            console.log(
              formatSuccess(
                '技能列表获取成功',
                skills.map(skill => normalizeSkillForOutput(skill)),
                context.output
              )
            );
            return;
          }

          console.log('\n已发现技能:\n');
          skills.forEach(skill => {
            console.log(`- ${skill.name}`);
            console.log(`  ${skill.description.split('\n')[0] ?? skill.description}`);
          });
          console.log('');
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'skill list',
        examples: ['dimens-cli skill list'],
      }
    )
  );

  registerGroupCommand(
    'skill',
    createCommand(
      'info',
      '查看技能元信息',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const skillName = requireSkillName(args);
          const skill = getSkillOrThrow(skillName);
          const normalizedSkill = normalizeSkillForOutput(skill);

          if (context.output === 'json') {
            console.log(
              formatSuccess('技能信息获取成功', normalizedSkill, context.output)
            );
            return;
          }

          console.log(`\n技能: ${skill.name}`);
          console.log(`描述: ${skill.description.split('\n')[0] ?? skill.description}`);
          if (skill.skillPath) {
            console.log(`主文件: ${toRelativeSkillPath(skill.skillPath)}`);
          }
          if (skill.referencesDir) {
            console.log(`参考目录: ${toRelativeSkillPath(skill.referencesDir)}`);
          }
          printMapping(skill);
          printList('推荐关键词示例', getRecommendExamples(skill.name));
          printList(
            'references',
            skill.references?.map(reference => toRelativeSkillPath(reference))
          );
          console.log('');
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'skill info <name>',
        examples: ['dimens-cli skill info dimens-manager'],
      }
    )
  );

  registerGroupCommand(
    'skill',
    createCommand(
      'recommend',
      '根据文本或关键词推荐相关技能',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const query = getRecommendQuery(args);
          if (!query) {
            throw new Error('缺少推荐文本，请传入 skill recommend <text>');
          }

          const rankedSkills = getAllSkills()
            .map(skill => ({
              skill,
              ...getSkillMatchSignals(skill, query),
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name, 'zh-CN'));

          if (context.output === 'json') {
            console.log(
              formatSuccess(
                '技能推荐完成',
                rankedSkills.map(item => ({
                  score: item.score,
                  matchedBy: item.matchedBy,
                  reason: item.reason,
                  skill: normalizeSkillForOutput(item.skill),
                })),
                context.output
              )
            );
            return;
          }

          console.log(`\n推荐 Skill（query: ${query}）:\n`);
          if (rankedSkills.length === 0) {
            console.log('(无匹配结果)\n');
            return;
          }

          rankedSkills.forEach(item => {
            console.log(`- ${item.skill.name} (score: ${item.score})`);
            console.log(`  ${item.skill.description.split('\n')[0] ?? item.skill.description}`);
          });
          console.log('');
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'skill recommend <text>',
        examples: [
          'dimens-cli skill recommend 工作流 默认模型 AI 分析',
          'dimens-cli skill recommend api-key token --output json',
        ],
      }
    )
  );

  registerGroupCommand(
    'skill',
    createCommand(
      'show',
      '显示技能文档内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const positionalArgs = args.filter(arg => !arg.startsWith('--'));
          const skillName = requireSkillName(positionalArgs);
          const skill = getSkillOrThrow(skillName);
          const normalizedSkill = normalizeSkillForOutput(skill);

          if (!skill.skillPath) {
            throw new Error(`技能 ${skillName} 缺少主文件路径`);
          }

          const mainOnly = flags['main-only'] === 'true';
          const referencesOnly = flags['references-only'] === 'true';
          const mappingOnly = flags['mapping-only'] === 'true';
          const includeReferences = flags.references === 'true' || referencesOnly;

          if (context.output === 'json') {
            const payload: Record<string, unknown> = {
              skill: normalizedSkill,
            };
            if (!referencesOnly && !mappingOnly) {
              payload.main = readFileSync(skill.skillPath, 'utf8');
            }
            if (!mainOnly && !mappingOnly && skill.references && skill.references.length > 0) {
              payload.references = skill.references.map(reference => ({
                path: toRelativeSkillPath(reference),
                content: readFileSync(reference, 'utf8'),
              }));
            }
            if (!mainOnly && !referencesOnly) {
              payload.mapping = {
                commandGroups: skill.commandGroups ?? [],
                commands: skill.commands ?? [],
                sdkModules: skill.sdkModules ?? [],
                toolNames: skill.toolNames ?? [],
              };
            }

            console.log(formatSuccess('技能文档获取成功', payload, context.output));
            return;
          }

          if (!referencesOnly && !mappingOnly) {
            console.log(`\n===== ${skill.name} / ${toRelativeSkillPath(skill.skillPath)} =====\n`);
            console.log(readFileSync(skill.skillPath, 'utf8'));
          }

          if (!mainOnly && !referencesOnly) {
            console.log(`\n===== ${skill.name} / mapping =====\n`);
            printMapping(skill);
          }

          if (
            !mainOnly &&
            !mappingOnly &&
            includeReferences &&
            skill.references &&
            skill.references.length > 0
          ) {
            skill.references.forEach(reference => {
              console.log(`\n===== ${toRelativeSkillPath(reference)} =====\n`);
              console.log(readFileSync(reference, 'utf8'));
            });
          }

          console.log('');
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'skill show <name> [--references] [--main-only] [--references-only] [--mapping-only]',
        examples: [
          'dimens-cli skill show dimens-manager',
          'dimens-cli skill show dimens-manager --references',
          'dimens-cli skill show dimens-manager --mapping-only',
          'dimens-cli skill show dimens-manager --output json',
        ],
      }
    )
  );
}
