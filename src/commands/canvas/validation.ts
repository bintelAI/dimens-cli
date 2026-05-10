import type { CanvasGraphValue } from '../../sdk/canvas';

const SUPPORTED_NODE_TYPES = new Set([
  'RECTANGLE',
  'CIRCLE',
  'TRIANGLE',
  'DIAMOND',
  'PARALLELOGRAM',
  'HEXAGON',
  'CYLINDER',
  'CLOUD',
  'DOCUMENT',
  'TEXT',
  'STICKY_NOTE',
  'GROUP',
  'SECTION',
  'MINDMAP',
  'IMAGE',
  'VIDEO',
  'CUSTOM_AGENT',
  'MARKDOWN',
  'CLOCK',
  'SVG',
  'INFOGRAPHIC',
  'EMBEDDED_SHEET',
]);

const SUPPORTED_EDGE_TYPES = new Set(['default', 'smoothstep']);
const VALID_ALIGN_VALUES = new Set(['left', 'center', 'right']);
const VALID_VERTICAL_ALIGN_VALUES = new Set(['top', 'center', 'bottom']);
const MIN_BACKGROUND_LIGHTNESS = 0.78;
const MIN_BACKGROUND_LUMINANCE = 0.72;

export interface CanvasValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  nodeCount: number;
  edgeCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseHexColor(value: string): { r: number; g: number; b: number } | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized.startsWith('#')) {
    return undefined;
  }
  const hex = normalized.slice(1);
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/.test(hex)) {
    return undefined;
  }
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : hex;
  return {
    r: Number.parseInt(fullHex.slice(0, 2), 16),
    g: Number.parseInt(fullHex.slice(2, 4), 16),
    b: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

function getRelativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLinear = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getHslLightness({ r, g, b }: { r: number; g: number; b: number }): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return (max + min) / 2;
}

function isAllowedLightBackgroundColor(value: unknown): boolean {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transparent') {
    return true;
  }
  const rgb = parseHexColor(normalized);
  if (!rgb) {
    return false;
  }
  return (
    getHslLightness(rgb) >= MIN_BACKGROUND_LIGHTNESS &&
    getRelativeLuminance(rgb) >= MIN_BACKGROUND_LUMINANCE
  );
}

function ensureCanvasGraph(data: CanvasGraphValue): void {
  if (!Array.isArray(data.nodes)) {
    throw new Error('画布数据缺少 nodes 数组');
  }
  if (!Array.isArray(data.edges)) {
    throw new Error('画布数据缺少 edges 数组');
  }
}

function pushMissingNodeField(
  errors: string[],
  nodeId: string,
  field: string,
  condition: boolean
): void {
  if (!condition) {
    errors.push(`节点 ${nodeId} 缺少或非法字段：${field}`);
  }
}

function validateNodeBasics(
  node: Record<string, unknown>,
  nodeLabel: string,
  nodeIds: Set<string>,
  errors: string[],
  warnings: string[],
  sectionBounds: Map<string, { width: number; height: number }>,
  allNodes: unknown[]
): void {
  const id = isNonEmptyString(node.id) ? node.id : nodeLabel;
  if (!isNonEmptyString(node.id)) {
    errors.push(`节点 ${nodeLabel} 缺少 id`);
  } else if (nodeIds.has(node.id)) {
    errors.push(`节点 ${node.id} 的 id 重复`);
  } else {
    nodeIds.add(node.id);
  }

  const type = node.type;
  pushMissingNodeField(errors, id, 'type', isNonEmptyString(type));
  if (isNonEmptyString(type) && !SUPPORTED_NODE_TYPES.has(type)) {
    errors.push(`节点 ${id} 使用了前端无法识别的 type：${type}`);
  }

  const position = node.position;
  const positionAbsolute = node.positionAbsolute;
  const style = node.style;
  const dataValue = node.data;
  const width = node.width;
  const height = node.height;

  pushMissingNodeField(errors, id, 'position.x', isRecord(position) && isFiniteNumber(position.x));
  pushMissingNodeField(errors, id, 'position.y', isRecord(position) && isFiniteNumber(position.y));
  pushMissingNodeField(
    errors,
    id,
    'positionAbsolute.x',
    isRecord(positionAbsolute) && isFiniteNumber(positionAbsolute.x)
  );
  pushMissingNodeField(
    errors,
    id,
    'positionAbsolute.y',
    isRecord(positionAbsolute) && isFiniteNumber(positionAbsolute.y)
  );
  pushMissingNodeField(errors, id, 'width', isFiniteNumber(width) && width > 0);
  pushMissingNodeField(errors, id, 'height', isFiniteNumber(height) && height > 0);
  pushMissingNodeField(
    errors,
    id,
    'style.width',
    isRecord(style) && isFiniteNumber(style.width) && style.width > 0
  );
  pushMissingNodeField(
    errors,
    id,
    'style.height',
    isRecord(style) && isFiniteNumber(style.height) && style.height > 0
  );
  pushMissingNodeField(errors, id, 'selected', typeof node.selected === 'boolean');
  pushMissingNodeField(errors, id, 'dragging', typeof node.dragging === 'boolean');
  pushMissingNodeField(errors, id, 'data', isRecord(dataValue));

  if (isRecord(style) && isFiniteNumber(width) && isFiniteNumber(style.width) && width !== style.width) {
    errors.push(`节点 ${id} 的 width 与 style.width 不一致`);
  }
  if (isRecord(style) && isFiniteNumber(height) && isFiniteNumber(style.height) && height !== style.height) {
    errors.push(`节点 ${id} 的 height 与 style.height 不一致`);
  }

  validateNodeData(node, id, errors, warnings);

  if (type === 'SECTION' && isNonEmptyString(node.id) && isFiniteNumber(width) && isFiniteNumber(height)) {
    sectionBounds.set(node.id, { width, height });
  }

  if (isNonEmptyString(node.parentNode)) {
    validateParentNode(node, id, errors, sectionBounds, allNodes);
  }
}

function validateNodeData(
  node: Record<string, unknown>,
  id: string,
  errors: string[],
  warnings: string[]
): void {
  const dataValue = node.data;
  if (!isRecord(dataValue)) {
    return;
  }

  const type = node.type;
  const width = node.width;
  const height = node.height;

  pushMissingNodeField(errors, id, 'data.label', isNonEmptyString(dataValue.label));
  pushMissingNodeField(
    errors,
    id,
    'data.backgroundColor',
    isAllowedLightBackgroundColor(dataValue.backgroundColor)
  );
  pushMissingNodeField(errors, id, 'data.width', isFiniteNumber(dataValue.width) && dataValue.width > 0);
  pushMissingNodeField(errors, id, 'data.height', isFiniteNumber(dataValue.height) && dataValue.height > 0);
  pushMissingNodeField(
    errors,
    id,
    'data.align',
    isNonEmptyString(dataValue.align) && VALID_ALIGN_VALUES.has(dataValue.align)
  );
  pushMissingNodeField(
    errors,
    id,
    'data.verticalAlign',
    isNonEmptyString(dataValue.verticalAlign) &&
      VALID_VERTICAL_ALIGN_VALUES.has(dataValue.verticalAlign)
  );
  if (isFiniteNumber(width) && isFiniteNumber(dataValue.width) && width !== dataValue.width) {
    errors.push(`节点 ${id} 的 width 与 data.width 不一致`);
  }
  if (isFiniteNumber(height) && isFiniteNumber(dataValue.height) && height !== dataValue.height) {
    errors.push(`节点 ${id} 的 height 与 data.height 不一致`);
  }
  if (type === 'INFOGRAPHIC') {
    if (!isNonEmptyString(dataValue.infographicSyntax)) {
      errors.push(`INFOGRAPHIC 节点 ${id} 缺少 data.infographicSyntax`);
    } else if (!dataValue.infographicSyntax.trimStart().startsWith('infographic ')) {
      errors.push(
        `INFOGRAPHIC 节点 ${id} 的 data.infographicSyntax 必须以 "infographic <template-name>" 开头`
      );
    }
  }
  if (type === 'MARKDOWN' && !isNonEmptyString(dataValue.markdownContent)) {
    warnings.push(`MARKDOWN 节点 ${id} 建议提供 data.markdownContent`);
  }
  if (type === 'EMBEDDED_SHEET') {
    const embeddedSheet = dataValue.embeddedSheet;
    if (
      !isRecord(embeddedSheet) ||
      !isNonEmptyString(embeddedSheet.sheetId) ||
      !isNonEmptyString(embeddedSheet.viewId)
    ) {
      errors.push(`EMBEDDED_SHEET 节点 ${id} 必须提供 data.embeddedSheet.sheetId/viewId`);
    }
  }
}

function validateParentNode(
  node: Record<string, unknown>,
  id: string,
  errors: string[],
  sectionBounds: Map<string, { width: number; height: number }>,
  allNodes: unknown[]
): void {
  if (!isNonEmptyString(node.parentNode)) {
    return;
  }

  const parentExists = allNodes.some(
    candidate => isRecord(candidate) && candidate.id === node.parentNode
  );
  if (!parentExists) {
    errors.push(`节点 ${id} 的 parentNode 不存在：${node.parentNode}`);
    return;
  }

  const parentBounds = sectionBounds.get(node.parentNode);
  const position = node.position;
  if (
    parentBounds &&
    isRecord(position) &&
    isFiniteNumber(position.x) &&
    isFiniteNumber(position.y) &&
    isFiniteNumber(node.width) &&
    isFiniteNumber(node.height) &&
    (position.x < 0 ||
      position.y < 0 ||
      position.x + node.width > parentBounds.width ||
      position.y + node.height > parentBounds.height)
  ) {
    errors.push(`节点 ${id} 超出父级 SECTION ${node.parentNode} 范围`);
  }
}

function validateEdges(
  data: CanvasGraphValue,
  nodeIds: Set<string>,
  errors: string[]
): Map<string, Array<Record<string, unknown>>> {
  const outgoingByNode = new Map<string, Array<Record<string, unknown>>>();

  data.edges.forEach((edge, index) => {
    const edgeLabel = `#${index + 1}`;
    if (!isRecord(edge)) {
      errors.push(`边 ${edgeLabel} 必须是对象`);
      return;
    }
    const id = isNonEmptyString(edge.id) ? edge.id : edgeLabel;
    if (!isNonEmptyString(edge.id)) {
      errors.push(`边 ${edgeLabel} 缺少 id`);
    }
    if (!isNonEmptyString(edge.source)) {
      errors.push(`边 ${id} 缺少 source`);
    } else if (!nodeIds.has(edge.source)) {
      errors.push(`边 ${id} 的 source 不存在：${edge.source}`);
    }
    if (!isNonEmptyString(edge.target)) {
      errors.push(`边 ${id} 缺少 target`);
    } else if (!nodeIds.has(edge.target)) {
      errors.push(`边 ${id} 的 target 不存在：${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`边 ${id} 不能连接到自身`);
    }
    if (!isNonEmptyString(edge.sourceHandle)) {
      errors.push(`边 ${id} 缺少 sourceHandle`);
    }
    if (!isNonEmptyString(edge.targetHandle)) {
      errors.push(`边 ${id} 缺少 targetHandle`);
    }
    if (!isNonEmptyString(edge.type) || !SUPPORTED_EDGE_TYPES.has(edge.type)) {
      errors.push(`边 ${id} 的 type 只能是 default 或 smoothstep`);
    }
    if (typeof edge.animated !== 'boolean') {
      errors.push(`边 ${id} 缺少 animated 布尔值`);
    }
    if (typeof edge.selected !== 'boolean') {
      errors.push(`边 ${id} 缺少 selected 布尔值`);
    }
    if (!isFiniteNumber(edge.zIndex)) {
      errors.push(`边 ${id} 缺少 zIndex 数值`);
    }
    const markerEnd = edge.markerEnd;
    if (!isRecord(markerEnd) || markerEnd.type !== 'arrowclosed') {
      errors.push(`边 ${id} 必须包含 markerEnd.type=arrowclosed`);
    }
    const style = edge.style;
    if (
      !isRecord(style) ||
      !isNonEmptyString(style.stroke) ||
      !isFiniteNumber(style.strokeWidth) ||
      style.strokeWidth <= 0
    ) {
      errors.push(`边 ${id} 必须包含 style.stroke 和正数 style.strokeWidth`);
    }
    if (isNonEmptyString(edge.source)) {
      const edges = outgoingByNode.get(edge.source) ?? [];
      edges.push(edge);
      outgoingByNode.set(edge.source, edges);
    }
  });

  return outgoingByNode;
}

function validateDiamondBranches(
  data: CanvasGraphValue,
  outgoingByNode: Map<string, Array<Record<string, unknown>>>,
  errors: string[]
): void {
  data.nodes.forEach(node => {
    if (!isRecord(node) || node.type !== 'DIAMOND' || !isNonEmptyString(node.id)) {
      return;
    }
    const outgoing = outgoingByNode.get(node.id) ?? [];
    if (outgoing.length < 2) {
      errors.push(`判断节点 ${node.id} 至少需要两条出边`);
      return;
    }
    const missingLabel = outgoing.filter(edge => !isNonEmptyString(edge.label));
    if (missingLabel.length > 0) {
      errors.push(`判断节点 ${node.id} 的所有出边都必须提供分支 label`);
    }
  });
}

function collectEndpointWarnings(data: CanvasGraphValue, warnings: string[]): void {
  if (data.nodes.length === 0 || data.edges.length === 0) {
    return;
  }

  const targets = new Set(
    data.edges
      .filter(isRecord)
      .map(edge => edge.target)
      .filter(isNonEmptyString)
  );
  const sources = new Set(
    data.edges
      .filter(isRecord)
      .map(edge => edge.source)
      .filter(isNonEmptyString)
  );
  const startCount = data.nodes.filter(
    node => isRecord(node) && isNonEmptyString(node.id) && !targets.has(node.id)
  ).length;
  const endCount = data.nodes.filter(
    node => isRecord(node) && isNonEmptyString(node.id) && !sources.has(node.id)
  ).length;
  if (startCount === 0) {
    warnings.push('未发现明确起点节点');
  }
  if (endCount === 0) {
    warnings.push('未发现明确终点节点');
  }
}

export function validateCanvasGraph(data: CanvasGraphValue): CanvasValidationResult {
  ensureCanvasGraph(data);

  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set<string>();
  const sectionBounds = new Map<string, { width: number; height: number }>();

  data.nodes.forEach((node, index) => {
    const nodeLabel = `#${index + 1}`;
    if (!isRecord(node)) {
      errors.push(`节点 ${nodeLabel} 必须是对象`);
      return;
    }
    validateNodeBasics(node, nodeLabel, nodeIds, errors, warnings, sectionBounds, data.nodes);
  });

  const outgoingByNode = validateEdges(data, nodeIds, errors);
  validateDiamondBranches(data, outgoingByNode, errors);
  collectEndpointWarnings(data, warnings);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    nodeCount: data.nodes.length,
    edgeCount: data.edges.length,
  };
}

export function ensureValidCanvasGraph(data: CanvasGraphValue): CanvasValidationResult {
  const result = validateCanvasGraph(data);
  if (!result.ok) {
    throw new Error(`画布数据校验失败：${result.errors.join('；')}`);
  }
  return result;
}
