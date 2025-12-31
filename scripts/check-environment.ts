/**
 * Environment Check Script
 * Run this FIRST to verify everything is working
 */

import chalk from 'chalk';
import { chromium } from 'playwright';
import * as fs from 'fs-extra';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function log(result: CheckResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
  const color = result.status === 'pass' ? chalk.green : result.status === 'warn' ? chalk.yellow : chalk.red;
  console.log(`${icon} ${color(result.name)}: ${result.message}`);
}

async function checkAnthropicKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();

  if (!key) {
    log({
      name: 'Anthropic API Key',
      status: 'fail',
      message: 'Not set. Run: export ANTHROPIC_API_KEY=your_key_here'
    });
    return;
  }

  if (!key.startsWith('sk-ant-')) {
    log({
      name: 'Anthropic API Key',
      status: 'warn',
      message: 'Key format looks unusual (should start with sk-ant-)'
    });
    return;
  }

  if (key.length < 50) {
    log({
      name: 'Anthropic API Key',
      status: 'warn',
      message: 'Key seems too short. Make sure you copied the full key.'
    });
    return;
  }

  log({
    name: 'Anthropic API Key',
    status: 'pass',
    message: 'Set and format looks correct'
  });
}

async function checkGeminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    log({
      name: 'Gemini API Key',
      status: 'fail',
      message: 'Not set. Run: export GEMINI_API_KEY=your_key_here'
    });
    return;
  }

  if (key.length < 30) {
    log({
      name: 'Gemini API Key',
      status: 'warn',
      message: 'Key seems too short. Make sure you copied the full key.'
    });
    return;
  }

  log({
    name: 'Gemini API Key',
    status: 'pass',
    message: 'Set and format looks correct'
  });
}

async function checkPlaywright() {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    log({
      name: 'Playwright Browser',
      status: 'pass',
      message: 'Chromium is installed and working'
    });
  } catch (error: any) {
    log({
      name: 'Playwright Browser',
      status: 'fail',
      message: `Browser failed: ${error.message}. Run: npx playwright install chromium`
    });
  }
}

async function checkDirectories() {
  const dirs = ['./cloned-pages', './screenshots'];

  for (const dir of dirs) {
    try {
      await fs.ensureDir(dir);
      await fs.access(dir, fs.constants.W_OK);
      log({
        name: `Directory ${dir}`,
        status: 'pass',
        message: 'Exists and writable'
      });
    } catch (error) {
      log({
        name: `Directory ${dir}`,
        status: 'fail',
        message: 'Cannot create or write to directory'
      });
    }
  }
}

async function checkNetwork() {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com', { timeout: 10000 });
    await browser.close();
    log({
      name: 'Network Access',
      status: 'pass',
      message: 'Can reach external websites'
    });
  } catch (error: any) {
    log({
      name: 'Network Access',
      status: 'fail',
      message: 'Cannot reach websites. Check your internet connection.'
    });
  }
}

async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major >= 18) {
    log({
      name: 'Node.js Version',
      status: 'pass',
      message: `${version} (18+ required)`
    });
  } else {
    log({
      name: 'Node.js Version',
      status: 'fail',
      message: `${version} is too old. Need Node 18+`
    });
  }
}

async function main() {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════════════╗
║              ENVIRONMENT CHECK - Geekout Vegas 2026          ║
╚══════════════════════════════════════════════════════════════╝
`));

  await checkNodeVersion();
  await checkAnthropicKey();
  await checkGeminiKey();
  await checkDirectories();
  await checkPlaywright();
  await checkNetwork();

  console.log('\n' + '─'.repeat(60) + '\n');

  const failed = results.filter(r => r.status === 'fail');
  const warned = results.filter(r => r.status === 'warn');
  const passed = results.filter(r => r.status === 'pass');

  if (failed.length === 0) {
    console.log(chalk.bold.green(`🎉 ALL CHECKS PASSED! (${passed.length}/${results.length})`));
    if (warned.length > 0) {
      console.log(chalk.yellow(`   ${warned.length} warning(s) - review above`));
    }
    console.log(chalk.cyan('\n   Ready to start! Type: claude\n'));
  } else {
    console.log(chalk.bold.red(`❌ ${failed.length} CHECK(S) FAILED`));
    console.log(chalk.white('\n   Fix the issues above, then run: npm run check\n'));
    process.exit(1);
  }
}

main().catch(console.error);
