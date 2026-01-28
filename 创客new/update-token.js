/**
 * Update Token Script
 * Helps you update the Anthropic API token
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('='.repeat(60));
console.log('Anthropic API Token Updater');
console.log('='.repeat(60));
console.log('\nCurrent issue: Token authentication failed');
console.log('Error: "用户信息验证失败" (User authentication failed)\n');

// Check for existing .env file
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

let existingToken = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/ANTHROPIC_AUTH_TOKEN=(.+)/);
  if (match) {
    existingToken = match[1].trim();
    console.log(`Found existing token: ${existingToken.substring(0, 30)}...`);
  }
}

console.log('\nTo fix this issue, you need to:');
console.log('1. Get a new token from: https://code.newcli.com');
console.log('2. Enter the new token below\n');

rl.question('Enter your new ANTHROPIC_AUTH_TOKEN (or press Enter to skip): ', (newToken) => {
  if (!newToken || newToken.trim() === '') {
    console.log('\nNo token entered. Creating template file instead...\n');
    createTemplate();
    rl.close();
    return;
  }

  const token = newToken.trim();
  
  // Validate token format
  if (!token.startsWith('sk-ant-')) {
    console.log('\n[WARNING] Token should start with "sk-ant-"');
    console.log('Continuing anyway...\n');
  }

  // Create or update .env file
  const envContent = `# Anthropic API Configuration
# Updated: ${new Date().toISOString()}

ANTHROPIC_AUTH_TOKEN=${token}
ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super
`;

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`\n[SUCCESS] Token updated in ${envPath}`);
    console.log(`\nNew token: ${token.substring(0, 30)}...`);
    console.log('\nNext steps:');
    console.log('1. Restart your application');
    console.log('2. Run: node test-api-comprehensive.js (to verify)');
  } catch (error) {
    console.error('\n[ERROR] Failed to write .env file:', error.message);
    console.log('\nPlease manually create .env file with:');
    console.log(`ANTHROPIC_AUTH_TOKEN=${token}`);
    console.log('ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super');
  }

  rl.close();
});

function createTemplate() {
  const template = `# Anthropic API Configuration
# Copy this file to .env and update with your token

ANTHROPIC_AUTH_TOKEN=YOUR_NEW_TOKEN_HERE
ANTHROPIC_BASE_URL=https://code.newcli.com/claude/super
`;

  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, template, 'utf8');
    console.log(`[CREATED] ${envExamplePath}`);
  }

  console.log('\nTo update your token:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Edit .env and replace YOUR_NEW_TOKEN_HERE with your actual token');
  console.log('3. Restart your application');
}
