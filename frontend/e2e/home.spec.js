/**
 * 首页 E2E 测试
 * 使用 Playwright-cli 运行
 * 命令: npx playwright-cli run e2e/home.spec.js
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('测试 1: 首页标题测试');
    await page.goto('http://localhost:3000');
    const title = await page.title();
    console.log('页面标题:', title);
    if (!title.includes('WatchTogether')) {
      throw new Error('标题验证失败');
    }
    console.log('✓ 标题验证通过');
    
    console.log('\n测试 2: 导航到创建房间页面');
    await page.click('button:has-text("创建房间")');
    await page.waitForURL('/create');
    const createTitle = await page.locator('h1:has-text("创建房间")').textContent();
    console.log('页面标题:', createTitle);
    console.log('✓ 创建房间页面导航成功');
    
    console.log('\n测试 3: 导航到加入房间页面');
    await page.goto('http://localhost:3000');
    await page.click('button:has-text("加入房间")');
    await page.waitForURL('/join');
    const joinTitle = await page.locator('h1:has-text("加入房间")').textContent();
    console.log('页面标题:', joinTitle);
    console.log('✓ 加入房间页面导航成功');
    
    console.log('\n测试 4: 公开房间列表');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.room-list');
    const roomCount = await page.locator('.room-item').count();
    console.log('房间数量:', roomCount);
    console.log('✓ 房间列表显示正常');
    
    console.log('\n所有测试通过!');
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();