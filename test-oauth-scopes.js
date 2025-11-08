// Test OAuth scopes and page access
// Use the latest access token from your logs

const ACCESS_TOKEN = 'EAATxV9N3FTcBP0k64HdwN9rEVPV2ircqg5DVfK7tb5ywxZBy1dWDb1ZBEpZAbNXJeQeqM8InCdpE0avzB2UZB2FwZA2SCZB9NrnPcO14E20oRsUzVOTqwvncZBJaQmKArXiyT2QaKXKDg1brhCn7iuBJZClmLCnFKAqx96gUAuBzGZBGsvFUZBMGZBQTLLebYIVpRyo01a7QeaEKc6iH1im5ZB2BhIDoGWyIuV9fnpf3Q9ZCSfBqCnxfI9QSxQAZCxkyPz455xgNIn3ZAOfyipOja6berHnOj1gXsbKiYHMCOJSsYA0TzYVN6pIAgZDZD';

async function testOAuthScopes() {
  console.log('🔍 OAuth Scopes & Page Access Test');
  console.log('===================================\n');

  try {
    // 1. Check token permissions/scopes
    console.log('1. Token Permissions:');
    try {
      const debugResponse = await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('   Scopes:', debugData.data?.scopes || 'Not available');
        console.log('   App ID:', debugData.data?.app_id);
        console.log('   Valid:', debugData.data?.is_valid);
      } else {
        console.log('   Debug token failed:', debugResponse.status);
      }
    } catch (error) {
      console.log('   Debug token error:', error.message);
    }
    console.log();

    // 2. Try different page endpoints
    console.log('2. Testing Different Page Endpoints:');
    
    const endpoints = [
      { name: 'me/accounts', url: `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token&access_token=${ACCESS_TOKEN}` },
      { name: 'me/accounts (basic)', url: `https://graph.facebook.com/v21.0/me/accounts?access_token=${ACCESS_TOKEN}` },
      { name: 'me (user info)', url: `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${ACCESS_TOKEN}` }
    ];

    for (const endpoint of endpoints) {
      console.log(`   Testing ${endpoint.name}:`);
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          const data = await response.json();
          if (endpoint.name.includes('accounts')) {
            console.log(`     Found ${data.data?.length || 0} pages`);
            for (const page of data.data || []) {
              console.log(`     - ${page.name} (${page.id}) [${page.category || 'No category'}]`);
            }
          } else {
            console.log(`     User: ${data.name} (${data.id})`);
          }
        } else {
          console.log(`     Error: ${response.status}`);
        }
      } catch (error) {
        console.log(`     Error: ${error.message}`);
      }
      console.log();
    }

    // 3. Direct check for Orincore page
    console.log('3. Direct Orincore Page Check:');
    const orinPageId = '103694521405609';
    
    try {
      const orinResponse = await fetch(`https://graph.facebook.com/v21.0/${orinPageId}?fields=id,name,category,instagram_business_account&access_token=${ACCESS_TOKEN}`);
      
      if (orinResponse.ok) {
        const orinData = await orinResponse.json();
        console.log(`   ✅ Orincore page found: ${orinData.name}`);
        console.log(`   Category: ${orinData.category}`);
        console.log(`   Has Instagram: ${!!orinData.instagram_business_account}`);
        if (orinData.instagram_business_account) {
          console.log(`   Instagram ID: ${orinData.instagram_business_account.id}`);
        }
      } else {
        const errorText = await orinResponse.text();
        console.log(`   ❌ Orincore page not accessible: ${orinResponse.status}`);
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking Orincore: ${error.message}`);
    }
    console.log();

    // 4. Check Instagram account directly
    console.log('4. Direct Instagram Account Check:');
    const igIds = ['17841438932131554', '25613381741599603'];
    
    for (const igId of igIds) {
      console.log(`   Testing IG ID: ${igId}`);
      try {
        const igResponse = await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=id,username,account_type&access_token=${ACCESS_TOKEN}`);
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          console.log(`     ✅ Found: @${igData.username} (${igData.account_type})`);
        } else {
          console.log(`     ❌ Not accessible: ${igResponse.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }
    console.log();

    // 5. Recommendations
    console.log('5. Next Steps:');
    console.log('   If Orincore page is not in /me/accounts:');
    console.log('   - User needs admin/editor role on Orincore page');
    console.log('   - Try re-authorizing with business_management scope');
    console.log('   - Check if page is a Business page vs Personal profile');
    console.log('   - Verify Instagram Business account is connected to the page');
    console.log();
    console.log('   If Instagram account is not accessible:');
    console.log('   - Instagram account might be Personal, not Business');
    console.log('   - Need to convert to Instagram Business account');
    console.log('   - Connect Instagram Business to Facebook page properly');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (ACCESS_TOKEN && ACCESS_TOKEN.length > 50) {
  testOAuthScopes();
} else {
  console.log('⚠️  Please update ACCESS_TOKEN with the latest token from your logs');
}
