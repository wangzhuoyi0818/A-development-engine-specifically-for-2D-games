/**
 * Fix Token Issue - Create configuration file
 */

const fs = require('fs');
const path = require('path');

console.log('Token Configuration Helper\n');

// Current token (may be expired)
const currentToken = 'sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA';
const baseURL = 'https://code.newcli.com/claude/super';

console.log('Current Configuration:');
console.log(`  Base URL: ${baseURL}`);
console.log(`  Token: ${currentToken.substring(0, 30)}...`);
console.log('\n[ERROR] Token authentication failed: "用户信息验证失败"');
console.log('\nThis means the token is invalid or expired.\n');

// Create .env file template
const envContent = `# Anthropic API Configuration
# IMPORTANT: Replace the token below with a valid token from your service provider

ANTHROPIC_AUTH_TOKEN=YOUR_NEW_TOKEN_HERE
ANTHROPIC_BASE_URL=${baseURL}

# Instructions:
# 1. Contact your service provider (code.newcli.com) to get a new token
# 2. Replace YOUR_NEW_TOKEN_HERE with the new token
# 3. Save this file
# 4. Restart your application
`;

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Create .env.example if it doesn't exist
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envContent);
  console.log(`[CREATED] ${envExamplePath}`);
  console.log('  This is a template file. Copy it to .env and update with your token.\n');
}

// Check if .env exists
if (fs.existsSync(envPath)) {
  console.log(`[INFO] .env file already exists at: ${envPath}`);
  console.log('  Please update ANTHROPIC_AUTH_TOKEN with a valid token.\n');
} else {
  console.log(`[INFO] .env file not found.`);
  console.log('  Create .env file with your token, or use the template:\n');
  console.log('  Copy .env.example to .env and update the token.\n');
}

console.log('Next Steps:');
console.log('1. Get a new token from: https://code.newcli.com');
console.log('2. Update .env file with the new token');
console.log('3. Restart your application');
console.log('\nIf you need help, contact the service provider with:');
console.log(`  Request ID: 20260125165751263886432c3i15nb4`);
