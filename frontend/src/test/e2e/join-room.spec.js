/**
 * 房间加入模块 E2E 测试
 * 
 * 测试用例：
 * - ROOM-JOIN-001: 通过房间码加入
 * - ROOM-JOIN-002: 加入不存在的房间
 * - ROOM-JOIN-003: 加入已满房间
 * - ROOM-JOIN-004: 房间码为空
 * - ROOM-JOIN-005: 昵称为空
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:18080';

test.describe('房间加入模块', () => {
  
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage 确保每个测试独立
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('ROOM-JOIN-001: 通过房间码加入', async ({ page }) => {
    // 先创建一个测试房间
    await page.goto(`${BASE_URL}/create`);
    
    // 填写创建房间表单
    await page.fill('input[placeholder="输入昵称"]', '测试创建者');
    await page.fill('input[placeholder="输入房间名（选填）"]', '测试加入房间');
    await page.click('button[type="submit"]');
    
    // 等待跳转到房间页面
    await page.waitForURL(/\/room\//);
    
    // 获取房间号
    const roomUrl = page.url();
    const roomId = roomUrl.split('/room/')[1];
    
    // 返回首页并清除会话（模拟新用户）
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 验证页面标题
    await expect(page.locator('.page-title')).toHaveText('加入房间');
    
    // 填写加入房间表单
    await page.fill('input[placeholder="输入昵称"]', '测试加入者');
    await page.fill('input[placeholder="输入6位房间号"]', roomId);
    
    // 点击加入按钮
    await page.click('button[type="submit"]');
    
    // 等待跳转到房间页面
    await page.waitForURL(/\/room\//);
    
    // 验证成功加入房间
    await expect(page).toHaveURL(new RegExp(`/room/${roomId}`));
  });

  test('ROOM-JOIN-002: 加入不存在的房间', async ({ page }) => {
    // 模拟 API 返回 404 错误
    await page.route(`${API_BASE_URL}/api/room/*`, route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: '房间不存在或已关闭' })
      });
    });
    
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', '测试用户');
    await page.fill('input[placeholder="输入6位房间号"]', 'XXXXXX');
    
    // 监听对话框
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('房间不存在或已关闭');
      await dialog.accept();
    });
    
    // 点击加入按钮
    await page.click('button[type="submit"]');
    
    // 等待错误提示
    await page.waitForTimeout(500);
    
    // 验证仍在加入页面
    await expect(page).toHaveURL(/\/join/);
  });

  test('ROOM-JOIN-003: 加入已满房间', async ({ page }) => {
    // 模拟 API 返回房间已满错误
    await page.route(`${API_BASE_URL}/api/room/*`, route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: '房间已满' })
      });
    });
    
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', '测试用户');
    await page.fill('input[placeholder="输入6位房间号"]', 'FULL01');
    
    // 监听对话框
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('房间已满');
      await dialog.accept();
    });
    
    // 点击加入按钮
    await page.click('button[type="submit"]');
    
    // 等待错误提示
    await page.waitForTimeout(500);
    
    // 验证仍在加入页面
    await expect(page).toHaveURL(/\/join/);
  });

  test('ROOM-JOIN-004: 房间码为空', async ({ page }) => {
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 只填写昵称，不填写房间号
    await page.fill('input[placeholder="输入昵称"]', '测试用户');
    
    // 尝试提交表单（HTML5 验证会阻止提交）
    const roomIdInput = page.locator('input[placeholder="输入6位房间号"]');
    await expect(roomIdInput).toHaveAttribute('required', '');
    
    // 验证房间号输入框有 required 属性
    await expect(roomIdInput).toHaveAttribute('pattern', '[A-Za-z0-9]{6}');
    
    // 尝试点击提交按钮
    await page.click('button[type="submit"]');
    
    // 验证表单未提交（仍在当前页面）
    await expect(page).toHaveURL(/\/join/);
    
    // 验证房间号输入框获得焦点（HTML5 验证失败时的行为）
    await expect(roomIdInput).toBeFocused();
  });

  test('ROOM-JOIN-005: 昵称为空', async ({ page }) => {
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 只填写房间号，不填写昵称
    await page.fill('input[placeholder="输入6位房间号"]', 'ABC123');
    
    // 验证昵称输入框有 required 属性
    const nicknameInput = page.locator('input[placeholder="输入昵称"]');
    await expect(nicknameInput).toHaveAttribute('required', '');
    
    // 监听对话框（代码中的 alert）
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('请输入昵称');
      await dialog.accept();
    });
    
    // 尝试点击提交按钮
    await page.click('button[type="submit"]');
    
    // 等待对话框出现
    await page.waitForTimeout(500);
    
    // 验证表单未提交（仍在当前页面）
    await expect(page).toHaveURL(/\/join/);
  });

  test('ROOM-JOIN-006: 通过URL参数自动填充房间号', async ({ page }) => {
    // 访问带房间号参数的 URL
    await page.goto(`${BASE_URL}/join/ABC123`);
    
    // 验证房间号自动填充
    const roomIdInput = page.locator('input[placeholder="输入6位房间号"]');
    await expect(roomIdInput).toHaveValue('ABC123');
    
    // 验证邀请链接区域显示
    await expect(page.locator('.invite-section')).toBeVisible();
    
    // 验证邀请链接包含房间号
    const inviteInput = page.locator('.invite-link-box input');
    await expect(inviteInput).toHaveValue(/ABC123/);
  });

  test('ROOM-JOIN-007: 返回首页功能', async ({ page }) => {
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 验证返回链接存在
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveText('← 返回');
    
    // 点击返回链接
    await backLink.click();
    
    // 验证返回首页
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('ROOM-JOIN-008: 加载状态显示', async ({ page }) => {
    // 模拟慢速 API 响应
    await page.route(`${API_BASE_URL}/api/room/*`, async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'TEST01',
          name: '测试房间',
          isPublic: true,
          maxUsers: 5,
          currentUsers: 1
        })
      });
    });
    
    // 访问加入房间页面
    await page.goto(`${BASE_URL}/join`);
    
    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', '测试用户');
    await page.fill('input[placeholder="输入6位房间号"]', 'TEST01');
    
    // 点击加入按钮
    await page.click('button[type="submit"]');
    
    // 验证加载状态
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText('加入中...');
    await expect(submitButton).toBeDisabled();
  });
});
