/**
 * 房间加入模块 E2E 测试 (简化版)
 * 
 * 使用 playwright-cli 命令执行
 */

const { execSync } = require('child_process');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:18080';

// 测试结果记录
const testResults = [];

// 辅助函数：执行 playwright-cli 命令
function runCommand(command) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      cwd: '/git_repo/watchTogether/frontend'
    });
    return result;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

// 辅助函数：等待一段时间
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试用例：ROOM-JOIN-001 - 通过房间码加入
async function testJoinRoomWithCode() {
  console.log('\n=== ROOM-JOIN-001: 通过房间码加入 ===');
  
  try {
    // 1. 先创建一个测试房间
    runCommand('playwright-cli open http://localhost:3000/create --browser=chromium');
    await sleep(1000);
    
    // 填写创建房间表单
    runCommand('playwright-cli snapshot');
    runCommand('playwright-cli fill e12 "测试创建者"');
    runCommand('playwright-cli fill e15 "测试加入房间"');
    runCommand('playwright-cli click e18');
    await sleep(2000);
    
    // 获取当前 URL 中的房间号
    const urlOutput = runCommand('playwright-cli eval "window.location.href"');
    console.log('Room URL:', urlOutput);
    
    // 关闭浏览器
    runCommand('playwright-cli close');
    await sleep(500);
    
    // 2. 清除会话并加入房间
    runCommand('playwright-cli open http://localhost:3000/join --browser=chromium');
    await sleep(1000);
    
    // 清除 localStorage
    runCommand('playwright-cli run-code "async page => { await page.evaluate(() => localStorage.clear()); }"');
    
    // 填写加入房间表单
    runCommand('playwright-cli snapshot');
    runCommand('playwright-cli fill e12 "测试加入者"');
    
    // 使用一个测试房间号（需要先创建）
    runCommand('playwright-cli fill e15 "ABC123"');
    runCommand('playwright-cli click e16');
    await sleep(2000);
    
    // 检查是否跳转到房间页面
    const currentUrl = runCommand('playwright-cli eval "window.location.href"');
    console.log('Current URL:', currentUrl);
    
    if (currentUrl && currentUrl.includes('/room/')) {
      console.log('✅ 通过房间码加入测试通过');
      testResults.push({ name: 'ROOM-JOIN-001', status: 'PASS' });
    } else {
      console.log('❌ 通过房间码加入测试失败');
      testResults.push({ name: 'ROOM-JOIN-001', status: 'FAIL' });
    }
    
    runCommand('playwright-cli close');
  } catch (error) {
    console.error('测试执行错误:', error.message);
    testResults.push({ name: 'ROOM-JOIN-001', status: 'ERROR' });
    runCommand('playwright-cli close');
  }
}

// 测试用例：ROOM-JOIN-004 - 房间码为空
async function testEmptyRoomCode() {
  console.log('\n=== ROOM-JOIN-004: 房间码为空 ===');
  
  try {
    runCommand('playwright-cli open http://localhost:3000/join --browser=chromium');
    await sleep(1000);
    
    // 填写昵称但不填写房间号
    runCommand('playwright-cli snapshot');
    runCommand('playwright-cli fill e12 "测试用户"');
    
    // 验证房间号输入框有 required 属性
    const hasRequired = runCommand('playwright-cli eval "document.querySelector(\'input[placeholder=\"输入6位房间号\"]\').required"');
    console.log('Room ID has required:', hasRequired);
    
    // 点击提交按钮
    runCommand('playwright-cli click e16');
    await sleep(500);
    
    // 检查是否仍在加入页面（HTML5 验证应阻止提交）
    const currentUrl = runCommand('playwright-cli eval "window.location.href"');
    console.log('Current URL:', currentUrl);
    
    if (currentUrl && currentUrl.includes('/join')) {
      console.log('✅ 房间码为空测试通过');
      testResults.push({ name: 'ROOM-JOIN-004', status: 'PASS' });
    } else {
      console.log('❌ 房间码为空测试失败');
      testResults.push({ name: 'ROOM-JOIN-004', status: 'FAIL' });
    }
    
    runCommand('playwright-cli close');
  } catch (error) {
    console.error('测试执行错误:', error.message);
    testResults.push({ name: 'ROOM-JOIN-004', status: 'ERROR' });
    runCommand('playwright-cli close');
  }
}

// 测试用例：ROOM-JOIN-005 - 昵称为空
async function testEmptyNickname() {
  console.log('\n=== ROOM-JOIN-005: 昵称为空 ===');
  
  try {
    runCommand('playwright-cli open http://localhost:3000/join --browser=chromium');
    await sleep(1000);
    
    // 填写房间号但不填写昵称
    runCommand('playwright-cli snapshot');
    runCommand('playwright-cli fill e15 "ABC123"');
    
    // 验证昵称输入框有 required 属性
    const hasRequired = runCommand('playwright-cli eval "document.querySelector(\'input[placeholder=\"输入昵称\"]\').required"');
    console.log('Nickname has required:', hasRequired);
    
    // 监听对话框
    runCommand('playwright-cli run-code "async page => { page.on(\'dialog\', async dialog => { console.log(\'Dialog message:\', dialog.message()); await dialog.accept(); }); }"');
    
    // 点击提交按钮
    runCommand('playwright-cli click e16');
    await sleep(500);
    
    // 检查是否仍在加入页面
    const currentUrl = runCommand('playwright-cli eval "window.location.href"');
    console.log('Current URL:', currentUrl);
    
    if (currentUrl && currentUrl.includes('/join')) {
      console.log('✅ 昵称为空测试通过');
      testResults.push({ name: 'ROOM-JOIN-005', status: 'PASS' });
    } else {
      console.log('❌ 昵称为空测试失败');
      testResults.push({ name: 'ROOM-JOIN-005', status: 'FAIL' });
    }
    
    runCommand('playwright-cli close');
  } catch (error) {
    console.error('测试执行错误:', error.message);
    testResults.push({ name: 'ROOM-JOIN-005', status: 'ERROR' });
    runCommand('playwright-cli close');
  }
}

// 测试用例：ROOM-JOIN-006 - 通过URL参数自动填充房间号
async function testUrlParameter() {
  console.log('\n=== ROOM-JOIN-006: 通过URL参数自动填充房间号 ===');
  
  try {
    runCommand('playwright-cli open http://localhost:3000/join/ABC123 --browser=chromium');
    await sleep(1000);
    
    // 验证房间号自动填充
    runCommand('playwright-cli snapshot');
    const roomIdValue = runCommand('playwright-cli eval "document.querySelector(\'input[placeholder=\"输入6位房间号\"]\').value"');
    console.log('Room ID value:', roomIdValue);
    
    // 验证邀请链接区域显示
    const inviteSectionVisible = runCommand('playwright-cli eval "document.querySelector(\'.invite-section\') !== null"');
    console.log('Invite section visible:', inviteSectionVisible);
    
    if (roomIdValue && roomIdValue.includes('ABC123') && inviteSectionVisible === 'true') {
      console.log('✅ URL参数自动填充测试通过');
      testResults.push({ name: 'ROOM-JOIN-006', status: 'PASS' });
    } else {
      console.log('❌ URL参数自动填充测试失败');
      testResults.push({ name: 'ROOM-JOIN-006', status: 'FAIL' });
    }
    
    runCommand('playwright-cli close');
  } catch (error) {
    console.error('测试执行错误:', error.message);
    testResults.push({ name: 'ROOM-JOIN-006', status: 'ERROR' });
    runCommand('playwright-cli close');
  }
}

// 测试用例：ROOM-JOIN-007 - 返回首页功能
async function testBackToHome() {
  console.log('\n=== ROOM-JOIN-007: 返回首页功能 ===');
  
  try {
    runCommand('playwright-cli open http://localhost:3000/join --browser=chromium');
    await sleep(1000);
    
    // 验证返回链接存在
    runCommand('playwright-cli snapshot');
    
    // 点击返回链接
    runCommand('playwright-cli click e6');
    await sleep(1000);
    
    // 验证返回首页
    const currentUrl = runCommand('playwright-cli eval "window.location.href"');
    console.log('Current URL:', currentUrl);
    
    if (currentUrl && (currentUrl === 'http://localhost:3000/' || currentUrl === 'http://localhost:3000')) {
      console.log('✅ 返回首页功能测试通过');
      testResults.push({ name: 'ROOM-JOIN-007', status: 'PASS' });
    } else {
      console.log('❌ 返回首页功能测试失败');
      testResults.push({ name: 'ROOM-JOIN-007', status: 'FAIL' });
    }
    
    runCommand('playwright-cli close');
  } catch (error) {
    console.error('测试执行错误:', error.message);
    testResults.push({ name: 'ROOM-JOIN-007', status: 'ERROR' });
    runCommand('playwright-cli close');
  }
}

// 主测试函数
async function runTests() {
  console.log('开始执行房间加入模块 E2E 测试...\n');
  
  await testBackToHome();
  await testUrlParameter();
  await testEmptyRoomCode();
  await testEmptyNickname();
  await testJoinRoomWithCode();
  
  // 输出测试结果汇总
  console.log('\n=== 测试结果汇总 ===');
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  
  console.log(`总计: ${testResults.length} 个测试`);
  console.log(`通过: ${passed} 个`);
  console.log(`失败: ${failed} 个`);
  console.log(`错误: ${errors} 个`);
  
  testResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.status}`);
  });
}

// 运行测试
runTests().catch(console.error);
