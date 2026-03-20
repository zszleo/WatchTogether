/**
 * 房间创建模块 E2E 测试
 *
 * 测试用例：
 * - ROOM-CREATE-001: 正常创建公开房间
 * - ROOM-CREATE-002: 创建私密房间
 * - ROOM-CREATE-003: 使用默认房间名创建
 * - ROOM-CREATE-004: 昵称为空验证
 * - ROOM-CREATE-005: 昵称长度验证
 * - ROOM-CREATE-006: 人数滑块验证
 * - ROOM-CREATE-007: 返回首页
 * - ROOM-CREATE-008: 网络异常创建房间
 * - ROOM-CREATE-009: Session 失效后创建
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('房间创建模块', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('ROOM-CREATE-001: 正常创建公开房间', async ({ page }) => {
    // 监听 API 请求
    const createPromise = page.waitForRequest('**/api/room');

    await page.goto(`${BASE_URL}/create`);

    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', 'E2E测试用户');
    await page.fill('input[placeholder="默认：房间 + 编号"]', 'E2E测试房间');

    // 验证最大人数默认为5
    const slider = page.locator('input[type="range"]');
    await expect(slider).toHaveValue('5');

    // 验证公开房间开关默认为开启
    const toggle = page.locator('.toggle-input');
    await expect(toggle).toBeChecked();

    // 点击创建房间按钮
    await page.click('button[type="submit"]');

    // 等待 API 请求
    const request = await createPromise;
    expect(request.method()).toBe('POST');

    // 等待跳转到房间页面
    await page.waitForURL(/\/room\//, { timeout: 10000 });

    // 验证成功创建房间
    await expect(page).toHaveURL(/\/room\//);

    // 验证 Session 信息保存到 localStorage
    const userData = await page.evaluate(() => localStorage.getItem('watchtogether_user'));
    expect(userData).toBeTruthy();
    const parsedData = JSON.parse(userData);
    expect(parsedData.sessionId).toBeTruthy();
  });

  test('ROOM-CREATE-002: 创建私密房间', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', 'E2E测试用户');
    await page.fill('input[placeholder="默认：房间 + 编号"]', '私密测试房间');

    // 关闭公开房间开关（点击 toggle-label）
    const toggleLabel = page.locator('.toggle-label');
    await toggleLabel.click();

    // 验证开关已关闭
    const toggle = page.locator('.toggle-input');
    await expect(toggle).not.toBeChecked();

    // 点击创建房间按钮
    await page.click('button[type="submit"]');

    // 等待跳转到房间页面
    await page.waitForURL(/\/room\//, { timeout: 10000 });

    // 验证成功创建房间
    await expect(page).toHaveURL(/\/room\//);
  });

  test('ROOM-CREATE-003: 使用默认房间名创建', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 只填写昵称，不填写房间名
    await page.fill('input[placeholder="输入昵称"]', 'E2E测试用户');

    // 点击创建房间按钮
    await page.click('button[type="submit"]');

    // 等待跳转到房间页面
    await page.waitForURL(/\/room\//, { timeout: 10000 });

    // 验证成功创建房间（使用默认名称）
    await expect(page).toHaveURL(/\/room\//);
  });

  test('ROOM-CREATE-004: 昵称为空验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 验证昵称输入框有 required 属性
    const nicknameInput = page.locator('input[placeholder="输入昵称"]');
    await expect(nicknameInput).toHaveAttribute('required', '');

    // 监听对话框
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('请输入昵称');
      await dialog.accept();
    });

    // 不填写昵称，直接点击创建
    await page.click('button[type="submit"]');

    // 等待对话框出现
    await page.waitForTimeout(500);

    // 验证仍在创建页面
    await expect(page).toHaveURL(/\/create/);
  });

  test('ROOM-CREATE-005: 昵称长度验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 验证昵称输入框有 maxlength 属性
    const nicknameInput = page.locator('input[placeholder="输入昵称"]');
    await expect(nicknameInput).toHaveAttribute('maxlength', '20');

    // 尝试输入超长昵称
    const longNickname = 'a'.repeat(25);
    await nicknameInput.fill(longNickname);

    // 验证输入被截断到 20 字符
    const actualValue = await nicknameInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(20);
  });

  test('ROOM-CREATE-006: 人数滑块验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 验证滑块范围
    const slider = page.locator('input[type="range"]');
    await expect(slider).toHaveAttribute('min', '2');
    await expect(slider).toHaveAttribute('max', '10');

    // 验证范围标签显示
    await expect(page.locator('text=2人')).toBeVisible();
    await expect(page.locator('text=10人')).toBeVisible();
  });

  test('ROOM-CREATE-007: 返回首页', async ({ page }) => {
    await page.goto(`${BASE_URL}/create`);

    // 验证返回链接存在
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveText('← 返回');

    // 点击返回链接
    await backLink.click();

    // 验证返回首页
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('ROOM-CREATE-008: 网络异常创建房间', async ({ page }) => {
    // 模拟网络异常
    await page.route('**/api/room', route => {
      route.abort('connectionrefused');
    });

    await page.goto(`${BASE_URL}/create`);

    // 填写表单
    await page.fill('input[placeholder="输入昵称"]', 'E2E测试用户');
    await page.fill('input[placeholder="默认：房间 + 编号"]', '网络异常测试');

    // 监听对话框（错误提示）
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBeTruthy();
      await dialog.accept();
    });

    // 点击创建房间按钮
    await page.click('button[type="submit"]');

    // 等待错误提示
    await page.waitForTimeout(2000);

    // 验证仍在创建页面（不崩溃）
    await expect(page).toHaveURL(/\/create/);
  });

  test('ROOM-CREATE-009: Session 失效后创建', async ({ page }) => {
    // 第一次创建房间
    await page.goto(`${BASE_URL}/create`);
    await page.fill('input[placeholder="输入昵称"]', 'E2E测试用户');
    await page.click('button[type="submit"]');

    // 等待创建成功
    await page.waitForURL(/\/room\//, { timeout: 10000 });

    // 清除 localStorage（模拟 Session 失效）
    await page.evaluate(() => localStorage.clear());

    // 再次创建房间
    await page.goto(`${BASE_URL}/create`);
    await page.fill('input[placeholder="输入昵称"]', '新E2E测试用户');
    await page.click('button[type="submit"]');

    // 等待创建成功（自动创建新 Session）
    await page.waitForURL(/\/room\//, { timeout: 10000 });

    // 验证新 Session 已创建
    const userData = await page.evaluate(() => localStorage.getItem('watchtogether_user'));
    expect(userData).toBeTruthy();
    const parsedData = JSON.parse(userData);
    expect(parsedData.sessionId).toBeTruthy();
  });

});
