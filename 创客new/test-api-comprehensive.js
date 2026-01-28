/**
 * Comprehensive API test for Anthropic/Claude API
 * Tests various endpoints and authentication methods
 */

const testAPI = async () => {
  const token = process.env.ANTHROPIC_AUTH_TOKEN || 'sk-ant-oat01-p_J91U6B3zyXFyVyH9-xF9g4JKimb4mIHZr_UF4mqrGDdWvLj6OXnwyFIcYWiu2XjuFYDkv2jdxvz646ViqaaA-eeC9CwAA';
  const baseURL = process.env.ANTHROPIC_BASE_URL || 'https://code.newcli.com/claude/super';

  console.log('Comprehensive API Test\n');
  console.log(`Base URL: ${baseURL}`);
  console.log(`Token: ${token.substring(0, 30)}...\n`);

  // Try different base URL variations
  const baseURLs = [
    'https://code.newcli.com/claude/super',
    'https://code.newcli.com/claude',
    'https://code.newcli.com',
    'https://code.newcli.com/api',
  ];

  // Try different endpoints
  const endpoints = [
    '/v1/models',
    '/v1/messages',
    '/api/v1/models',
    '/claude/v1/models',
    '/messages',
    '/models',
    '/health',
    '/status',
  ];

  // Try different auth header formats
  const authHeaders = [
    { 'Authorization': `Bearer ${token}` },
    { 'Authorization': token },
    { 'x-api-key': token },
    { 'anthropic-api-key': token },
    { 'api-key': token },
    { 'X-API-Key': token },
  ];

  // Try POST request with message
  const testMessage = {
    model: 'claude-3-opus-20240229',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'test' }]
  };

  for (const testBaseURL of baseURLs) {
    console.log(`\n=== Testing Base URL: ${testBaseURL} ===\n`);

    // Test GET requests
    for (const endpoint of endpoints) {
      for (const headers of authHeaders) {
        const url = `${testBaseURL}${endpoint}`;
        const headerName = Object.keys(headers)[0];

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
          });

          const status = response.status;
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = { raw: text.substring(0, 100) };
          }

          if (status === 200 || status === 201) {
            console.log(`[SUCCESS] ${url}`);
            console.log(`  Method: GET, Header: ${headerName}, Status: ${status}`);
            console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}`);
            return { success: true, url, method: 'GET', headers, data };
          } else if (status !== 403 && status !== 404) {
            console.log(`[INFO] ${url} - Status: ${status}`);
            console.log(`  Header: ${headerName}, Response: ${JSON.stringify(data).substring(0, 150)}`);
          }
        } catch (error) {
          // Skip network errors for now
        }
      }
    }

    // Test POST request to /v1/messages
    const postEndpoints = ['/v1/messages', '/messages', '/api/v1/messages'];
    for (const endpoint of postEndpoints) {
      for (const headers of authHeaders) {
        const url = `${testBaseURL}${endpoint}`;

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testMessage),
          });

          const status = response.status;
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = { raw: text.substring(0, 100) };
          }

          if (status === 200 || status === 201) {
            console.log(`[SUCCESS] ${url}`);
            console.log(`  Method: POST, Status: ${status}`);
            console.log(`  Response: ${JSON.stringify(data).substring(0, 200)}`);
            return { success: true, url, method: 'POST', headers, data };
          } else if (status !== 403 && status !== 404 && status !== 400) {
            console.log(`[INFO] ${url} - Status: ${status}`);
            console.log(`  Response: ${JSON.stringify(data).substring(0, 150)}`);
          }
        } catch (error) {
          // Skip network errors
        }
      }
    }
  }

  console.log('\n[FAILED] All tests failed.');
  console.log('\nPossible solutions:');
  console.log('1. Token may be expired - contact service provider');
  console.log('2. Base URL may be incorrect');
  console.log('3. Service may require different authentication');
  console.log('4. Check if service is available at https://code.newcli.com');

  return { success: false };
};

testAPI()
  .then(result => {
    if (result.success) {
      console.log('\n[SUCCESS] Found working configuration!');
      console.log('\nWorking configuration:');
      console.log(`  URL: ${result.url}`);
      console.log(`  Method: ${result.method}`);
      console.log(`  Headers: ${JSON.stringify(result.headers, null, 2)}`);
      process.exit(0);
    } else {
      console.log('\n[FAILED] Could not find working configuration');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n[ERROR] Test failed:', error.message);
    process.exit(1);
  });
