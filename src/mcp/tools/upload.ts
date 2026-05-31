import { z } from 'zod';
import type { UploadFileOptions } from '../../sdk/upload';
import { contextSchema, createSimpleTool, stringArg, writeAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createUploadTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_upload_file',
      title: '上传文件',
      description: '上传本地文件到维表智联统一文件接口。',
      inputSchema: {
        ...contextSchema,
        filePath: z.string(),
        key: z.string().optional(),
        scene: z.string().optional(),
        source: z.string().optional(),
        type: z.string().optional(),
        bizType: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const filePath = stringArg(args.filePath);
        if (!filePath) {
          throw new Error('缺少 filePath，请传入本地文件路径');
        }
        const options: UploadFileOptions = {};
        const key = stringArg(args.key);
        if (key) options.key = key;
        const scene = stringArg(args.scene);
        if (scene) options.scene = scene;
        const source = stringArg(args.source);
        if (source) options.source = source;
        const type = stringArg(args.type);
        if (type) options.type = type;
        const bizType = stringArg(args.bizType);
        if (bizType) options.bizType = bizType;
        if (context.teamId) options.teamId = context.teamId;
        if (context.projectId) options.projectId = context.projectId;
        const result = await toolContext.createSDK(context).upload.uploadFile(filePath, options);
        return { message: '文件上传成功', data: result.data };
      },
    }),
  ];
}
