/**
 * 首页模块 E2E 测试
 *
 * 测试用例：
 * - HOME-001: 首页正常访问
 * - HOME-002: 首页元素验证
 * - HOME-003: 导航到创建房间
 * - HOME-004: 导航到加入房间
 * - HOME-005: 导航到历史页面
 * - HOME-006: 导航到个人页面
 * - HOME-007: 首页加载状态
 * - HOME-008: 首页错误状态
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:18080';

test.describe('首页模块', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('HOME-001: 首页正常访问', async ({ page }) => {
    await page.goto(BASE_URL);

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 验证页面标题
    await expect(page).toHaveTitle(/一起看/);

    // 验证 logo 标题
    const logo = page.locator('.logo');
    await expect(logo).toHaveText('一起看');

    // 验证副标题
    const tagline = page.locator('.tagline');
    await expect(tagline).toHaveText('和朋友同步观影，实时聊天');
  });

  test('HOME-002: 首页元素验证', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 验证"创建房间"按钮存在且可点击
    const createButton = page.locator('a[href="/create"]');
    await expect(createButton).toBeVisible();
    await expect(createButton).toContainText('创建房间');

    // 验证"加入房间"按钮存在且可点击
    const joinButton = page.locator('a[href="/join"]');
    await expect(joinButton).toBeVisible();
    await expect(joinButton).toContainText('加入房间');

    // 验证导航链接存在
    const historyLink = page.locator('a[href="/history"]');
    await expect(historyLink).toBeVisible();
    await expect(historyLink).toContainText('历史');

    const profileLink = page.locator('a[href="/profile"]');
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toContainText('个人');
  });

  test('HOME-003: 导航到创建房间', async ({ page }) => {
    await page.goto(BASE_URL);

    // 点击"创建房间"
    await page.locator('a[href="/create"]').click();

    // 等待导航完成
    await page.waitForURL(/\/create/);

    // 验证 URL 变为 /create
    await expect(page).toHaveURL(/\/create/);

    // 验证页面显示创建房间标题
    await expect(page.locator('.page-title')).toHaveText('创建房间');
  });

  test('HOME-004: 导航到加入房间', async ({ page }) => {
    await page.goto(BASE_URL);

    // 点击"加入房间"
    await page.locator('a[href="/join"]').click();

    // 等待导航完成
    await page.waitForURL(/\/join/);

    // 验证 URL 变为 /join
    await expect(page).toHaveURL(/\/join/);

    // 验证页面显示加入房间标题
    await expect(page.locator('.page-title')).toHaveText('加入房间');
  });

  test('HOME-005: 导航到历史页面', async ({ page }) => {
    await page.goto(BASE_URL);

    // 点击"历史"链接
    await page.locator('a[href="/history"]').click();

    // 等待导航完成
    await page.waitForURL(/\/history/);

    // 验证 URL 变为 /history
    await expect(page).toHaveURL(/\/history/);
  });

  test('HOME-006: 导航到个人页面', async ({ page }) => {
    await page.goto(BASE_URL);

    // 点击"个人"链接
    await page.locator('a[href="/profile"]').click();

    // 等待导航完成
    await page.waitForURL(/\/profile/);

    // 验证 URL 变为 /profile
    await expect(page).toHaveURL(/\/profile/);
  });

  test('HOME-007: 首页加载状态', async ({ page }) => {
    // 模拟慢速 API 响应
    await page.route('**/api/room', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto(BASE_URL);

    // 验证加载状态指示器显示
    const loadingSpinner = page.locator('.loading-spinner');
    await expect(loadingSpinner).toBeVisible({ timeout: 5000 });
  });

  test('HOME-008: 首页错误状态', async ({ page }) => {
    // 模拟 API 返回错误
    await page.route('**/api/room', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto(BASE_URL);

    // 等待错误组件显示
    await page.waitForSelector('.error-component', { timeout: 10000 });

    // 验证错误组件显示
    const errorComponent = page.locator('.error-component');
    await expect(errorComponent).toBeVisible();
  });

});
