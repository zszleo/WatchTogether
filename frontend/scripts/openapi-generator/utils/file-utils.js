/**
 * 文件操作工具模块
 */

import fs from 'fs';
import path from 'path';

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 写入文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 */
export async function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * 读取文件
 * @param {string} filePath - 文件路径
 * @returns {string} 文件内容
 */
export function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否存在
 */
export function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 */
export function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 复制文件
 * @param {string} src - 源文件路径
 * @param {string} dest - 目标文件路径
 */
export function copyFile(src, dest) {
  const dir = path.dirname(dest);
  ensureDir(dir);
  fs.copyFileSync(src, dest);
}

/**
 * 获取文件扩展名
 * @param {string} filePath - 文件路径
 * @returns {string} 扩展名
 */
export function getExtension(filePath) {
  return path.extname(filePath);
}

/**
 * 获取文件名（不含扩展名）
 * @param {string} filePath - 文件路径
 * @returns {string} 文件名
 */
export function getBasename(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
