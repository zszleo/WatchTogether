/**
 * snapshot.spec.js 快照测试
 * 确保生成结果的稳定性
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据路径
const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data', 'openapi-doc.json');

describe('快照测试 - 生成结果稳定性', () => {
  let parseOpenAPIDocument;
  let generateCode;
  let testDoc;
  let defaultConfig;

  beforeAll(async () => {
    // 导入模块
    const openapiClientModule = await import('../openapi-client.js');
    const codeGenModule = await import('../code-generator.js');

    parseOpenAPIDocument = openapiClientModule.parseOpenAPIDocument;
    generateCode = codeGenModule.generateCode;

    // 加载测试数据
    const docContent = fs.readFileSync(TEST_DATA_PATH, 'utf-8');
    testDoc = JSON.parse(docContent);

    // 默认配置
    defaultConfig = {
      openapiUrl: 'http://localhost:18080/api-docs',
      outputDir: '../../src/services',
      utilsDir: '../../src/utils',
      apiFileName: 'api.js',
      reqFileName: 'req.js',
      respFileName: 'resp.js',
      requestFileName: 'request.js',
      basePath: '',
      tags: [],
      filterUnknownParams: false,
      strictMode: false,
      initRequestFile: true
    };
  });

  describe('api.js 快照', () => {
    it('生成的 api.js 结构应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 移除时间戳，因为它每次都会变化
      const contentWithoutTimestamp = apiFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });

    it('应该包含正确的 API 分组结构', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 提取分组名称
      const groups = apiFile.content.match(/export const \w+Api = \{/g) || [];
      expect(groups).toMatchSnapshot();
    });

    it('应该包含正确的函数签名', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const apiFile = files.find(f => f.filename === 'api.js');

      // 提取函数定义行
      const funcDefs = apiFile.content.match(/^\s+\w+: async \(.+\) => \{$/gm) || [];
      expect(funcDefs).toMatchSnapshot();
    });
  });

  describe('req.js 快照', () => {
    it('生成的 req.js 结构应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const reqFile = files.find(f => f.filename === 'req.js');

      const contentWithoutTimestamp = reqFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });

    it('应该包含正确的请求参数类型定义', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const reqFile = files.find(f => f.filename === 'req.js');

      // 提取 typedef 名称
      const typedefs = reqFile.content.match(/@typedef \{Object\} \w+/g) || [];
      expect(typedefs).toMatchSnapshot();
    });
  });

  describe('resp.js 快照', () => {
    it('生成的 resp.js 结构应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      const contentWithoutTimestamp = respFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });

    it('应该包含正确的响应参数类型定义', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const files = await generateCode(parsedDoc, defaultConfig);
      const respFile = files.find(f => f.filename === 'resp.js');

      // 提取 typedef 名称
      const typedefs = respFile.content.match(/@typedef \{Object\} \w+/g) || [];
      expect(typedefs).toMatchSnapshot();
    });
  });

  describe('配置选项快照', () => {
    it('tags 过滤模式下的 api.js 应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithTags = {
        ...defaultConfig,
        tags: ['健康检查', '房间管理']
      };

      const files = await generateCode(parsedDoc, configWithTags);
      const apiFile = files.find(f => f.filename === 'api.js');

      const contentWithoutTimestamp = apiFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });

    it('filterUnknownParams 模式下的 api.js 应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithFilter = {
        ...defaultConfig,
        filterUnknownParams: true
      };

      const files = await generateCode(parsedDoc, configWithFilter);
      const apiFile = files.find(f => f.filename === 'api.js');

      const contentWithoutTimestamp = apiFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });

    it('strictMode 模式下的 api.js 应该保持稳定', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);
      const configWithStrict = {
        ...defaultConfig,
        strictMode: true
      };

      const files = await generateCode(parsedDoc, configWithStrict);
      const apiFile = files.find(f => f.filename === 'api.js');

      const contentWithoutTimestamp = apiFile.content.replace(
        /生成时间: .+/,
        '生成时间: [TIMESTAMP]'
      );

      expect(contentWithoutTimestamp).toMatchSnapshot();
    });
  });

  describe('多次生成一致性', () => {
    it('相同输入应该产生相同输出', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);

      const files1 = await generateCode(parsedDoc, defaultConfig);
      const files2 = await generateCode(parsedDoc, defaultConfig);

      for (let i = 0; i < files1.length; i++) {
        const content1 = files1[i].content.replace(/生成时间: .+/, '生成时间: [TIMESTAMP]');
        const content2 = files2[i].content.replace(/生成时间: .+/, '生成时间: [TIMESTAMP]');

        expect(content1).toBe(content2);
      }
    });

    it('不同配置应该产生不同输出', async () => {
      const parsedDoc = parseOpenAPIDocument(testDoc);

      const files1 = await generateCode(parsedDoc, defaultConfig);
      const files2 = await generateCode(parsedDoc, {
        ...defaultConfig,
        tags: ['健康检查']
      });

      const api1 = files1.find(f => f.filename === 'api.js');
      const api2 = files2.find(f => f.filename === 'api.js');

      // 内容应该不同
      expect(api1.content).not.toBe(api2.content);
    });
  });
});
