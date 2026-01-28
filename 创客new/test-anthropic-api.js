/**
 * Test Anthropic API connection
 * For diagnosing 401 errors
 */

// Set console encoding to UTF-8 (Node.js)
if (typeof process !== 'undefined' && process.stdout) {
  process.stdout.setDefaultEncoding('utf8');
}

const testAnthropicAPI = async () => {
  const token = process.env.ANTHROPIC_AUTH_TOKEN || 'sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA';
  const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://code.newcli.com/claude/super';

  console.log('Testing Anthropic API connection...\n');
  console.log(`Base URL: ${baseURL}`);
  console.log(`Token: ${token.substring(0, 20)}...\n`);

  // Test different endpoints
  const endpoints = [
    '/v1/models',
    '/v1/messages',
    '/api/v1/models',
    '/claude/v1/models',
  ];

  // Test different authentication header formats
  const authHeaders = [
    { 'Authorization': `Bearer ${token}` },
    { 'x-api-key': token },
    { 'anthropic-api-key': token },
    { 'Authorization': token },
  ];

  for (const endpoint of endpoints) {
    for (const headers of authHeaders) {
      const url = `${baseURL}${endpoint}`;
      const headerName = Object.keys(headers)[0];
      
      console.log(`\nTesting: ${url}`);
      console.log(`  Auth Header: ${headerName}`);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        });

        const status = response.status;
        const data = await response.json().catch(() => ({}));

        if (status === 200) {
          console.log(`   [SUCCESS] Status: ${status}`);
          console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
          return { success: true, url, headers, data };
        } else {
          console.log(`   [FAILED] Status: ${status}`);
          console.log(`   Error:`, JSON.stringify(data, null, 2).substring(0, 200));
        }
      } catch (error) {
        console.log(`   [ERROR] ${error.message}`);
      }
    }
  }

  console.log('\n[FAILED] All tests failed. Possible reasons:');
  console.log('   1. Token expired or invalid');
  console.log('   2. Base URL incorrect');
  console.log('   3. Service endpoint changed');
  console.log('   4. Network connection issue');

  return { success: false };
};

// Run test
testAnthropicAPI()
  .then(result => {
    if (result.success) {
      console.log('\n[SUCCESS] Found working configuration!');
      process.exit(0);
    } else {
      console.log('\n[FAILED] Cannot connect to API');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n[ERROR] Test failed:', error);
    process.exit(1);
  });
