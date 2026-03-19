/**
 * file-utils.js 文件操作工具模块单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('file-utils.js - 文件操作工具模块', () => {
  let ensureDir;
  let writeFile;
  let readFile;
  let checkFileExists;
  let deleteFile;
  let copyFile;
  let getExtension;
  let getBasename;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('../utils/file-utils.js');
    ensureDir = module.ensureDir;
    writeFile = module.writeFile;
    readFile = module.readFile;
    checkFileExists = module.checkFileExists;
    deleteFile = module.deleteFile;
    copyFile = module.copyFile;
    getExtension = module.getExtension;
    getBasename = module.getBasename;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ensureDir', () => {
    it('目录不存在时应该创建目录', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

      ensureDir('/test/dir');

      expect(mkdirSpy).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('目录存在时不应该创建', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync');

      ensureDir('/test/dir');

      expect(mkdirSpy).not.toHaveBeenCalled();
    });
  });

  describe('writeFile', () => {
    it('应该写入文件并确保目录存在', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const writeSpy = vi.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);

      await writeFile('/test/dir/file.txt', 'content');

      expect(writeSpy).toHaveBeenCalledWith('/test/dir/file.txt', 'content', 'utf-8');
    });

    it('应该在写入前创建目录', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
      vi.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);

      await writeFile('/test/newdir/file.txt', 'content');

      expect(mkdirSpy).toHaveBeenCalled();
    });
  });

  describe('readFile', () => {
    it('文件存在时应该返回内容', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('file content');

      const content = readFile('/test/file.txt');

      expect(content).toBe('file content');
    });

    it('文件不存在时应该返回 null', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const content = readFile('/test/nonexistent.txt');

      expect(content).toBeNull();
    });
  });

  describe('checkFileExists', () => {
    it('文件存在时应该返回 true', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      expect(checkFileExists('/test/file.txt')).toBe(true);
    });

    it('文件不存在时应该返回 false', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      expect(checkFileExists('/test/nonexistent.txt')).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('文件存在时应该删除', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockReturnValue(undefined);

      deleteFile('/test/file.txt');

      expect(unlinkSpy).toHaveBeenCalledWith('/test/file.txt');
    });

    it('文件不存在时不应该删除', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const unlinkSpy = vi.spyOn(fs, 'unlinkSync');

      deleteFile('/test/nonexistent.txt');

      expect(unlinkSpy).not.toHaveBeenCalled();
    });
  });

  describe('copyFile', () => {
    it('应该复制文件并确保目标目录存在', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const copySpy = vi.spyOn(fs, 'copyFileSync').mockReturnValue(undefined);

      copyFile('/test/src.txt', '/test/dest/dir/dest.txt');

      expect(copySpy).toHaveBeenCalledWith('/test/src.txt', '/test/dest/dir/dest.txt');
    });
  });

  describe('getExtension', () => {
    it('应该返回文件扩展名', () => {
      expect(getExtension('file.txt')).toBe('.txt');
      expect(getExtension('path/to/file.js')).toBe('.js');
      expect(getExtension('file.tar.gz')).toBe('.gz');
    });

    it('无扩展名时应该返回空字符串', () => {
      expect(getExtension('file')).toBe('');
    });
  });

  describe('getBasename', () => {
    it('应该返回不含扩展名的文件名', () => {
      expect(getBasename('file.txt')).toBe('file');
      expect(getBasename('path/to/file.js')).toBe('file');
    });

    it('无扩展名时应该返回完整文件名', () => {
      expect(getBasename('file')).toBe('file');
    });
  });
});
