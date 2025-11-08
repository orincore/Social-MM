// Test script to verify page selection logic
// Run this with: node test-page-selection.js

const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Replace with actual token

async function testPageSelection() {
  try {
    console.log('Testing page selection logic...\n');
    
    // 1. Get all Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${ACCESS_TOKEN}`
    );
    
    if (!pagesResponse.ok) {
      throw new Error(`Pages fetch failed: ${pagesResponse.status}`);
    }
    
    const pagesData = await pagesResponse.json();
    console.log(`Found ${pagesData.data?.length || 0} Facebook pages:`);
    
    for (const page of pagesData.data || []) {
      console.log(`- ${page.name} (ID: ${page.id})`);
    }
    console.log();
    
    // 2. Find page with Instagram Business account
    let selectedPage = null;
    let igAccountData = null;
    
    for (const page of pagesData.data || []) {
      console.log(`Checking page: ${page.name} (${page.id})`);
      
      const igResponse = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      
      if (igResponse.ok) {
        const data = await igResponse.json();
        const hasIG = !!data.instagram_business_account;
        console.log(`  Has Instagram: ${hasIG}`);
        
        if (hasIG) {
          console.log(`  IG Account ID: ${data.instagram_business_account.id}`);
          selectedPage = page;
          igAccountData = data;
          break;
        }
      } else {
        console.log(`  Error checking IG: ${igResponse.status}`);
      }
    }
    
    console.log('\n--- RESULTS ---');
    if (selectedPage && igAccountData) {
      console.log(`✅ Selected Page: ${selectedPage.name}`);
      console.log(`✅ Page ID: ${selectedPage.id}`);
      console.log(`✅ Instagram ID: ${igAccountData.instagram_business_account.id}`);
      
      // Expected values
      console.log('\n--- EXPECTED VALUES ---');
      console.log('Expected Page ID: 103694521405609');
      console.log('Expected IG ID: 17841438932131554');
      
      // Validation
      const pageIdMatch = selectedPage.id === '103694521405609';
      const igIdMatch = igAccountData.instagram_business_account.id === '17841438932131554';
      
      console.log('\n--- VALIDATION ---');
      console.log(`Page ID Match: ${pageIdMatch ? '✅' : '❌'}`);
      console.log(`IG ID Match: ${igIdMatch ? '✅' : '❌'}`);
      
      if (pageIdMatch && igIdMatch) {
        console.log('\n🎉 SUCCESS: Logic will select the correct Orincore page!');
      } else {
        console.log('\n❌ ISSUE: Logic selected wrong page/IG account');
      }
    } else {
      console.log('❌ No page with Instagram Business account found');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Manual test for specific page
async function testSpecificPage() {
  const pageId = '103694521405609';
  console.log(`\nTesting specific page: ${pageId}`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.instagram_business_account) {
        console.log(`✅ Page ${pageId} has Instagram Business account: ${data.instagram_business_account.id}`);
      } else {
        console.log(`❌ Page ${pageId} does not have Instagram Business account`);
      }
    } else {
      console.log(`❌ Error fetching page ${pageId}: ${response.status}`);
    }
  } catch (error) {
    console.error('Specific page test failed:', error.message);
  }
}

console.log('🔍 Facebook Page Selection Test');
console.log('================================');
console.log('Replace ACCESS_TOKEN with your actual token to run this test\n');

if (ACCESS_TOKEN !== 'YOUR_ACCESS_TOKEN_HERE') {
  testPageSelection().then(() => testSpecificPage());
} else {
  console.log('⚠️  Please set ACCESS_TOKEN in the script to run the test');
}
