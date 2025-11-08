// Debug script for Facebook Pages and Instagram Business accounts
// Replace ACCESS_TOKEN with your actual token from the logs above

const ACCESS_TOKEN = 'EAATxV9N3FTcBP8ejMVGDGGwPgYZCZBT2DQYqjTCt4R9ZCSRWp4g9VyoY8sdIYBJtcAZBcPThtmlTlvrvhy1eFZA6fT9ad0JRcWtbxLRQCeMVAiDWZAgPBqN8VTBB1vVkLlClQkOwjt0C3ottZAOcnCMpGbUyivyQJW44H3AEjbMfqTRjyxCAuriTv2JX7S3CcZAvYdmS9FThq08amFpjM6n2iRQtuKsxHC8L3Y83QWEXss5t5lEzk3YoHsLR2z2gpJawYAFmi9FfgoVRrQsmAhR2Bix9mC6CgvBGNFPXVfRigZBgdaRgdVwZDZD';

async function debugFacebookPages() {
  console.log('🔍 Facebook Pages Debug');
  console.log('========================\n');

  try {
    // 1. Check current user info
    console.log('1. Current User Info:');
    const userResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${ACCESS_TOKEN}`);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`   User: ${userData.name} (ID: ${userData.id})`);
    } else {
      console.log(`   Error: ${userResponse.status}`);
    }
    console.log();

    // 2. Get all pages with detailed info
    console.log('2. All Facebook Pages:');
    const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token&access_token=${ACCESS_TOKEN}`);
    
    if (!pagesResponse.ok) {
      console.log(`   Error: ${pagesResponse.status} - ${await pagesResponse.text()}`);
      return;
    }

    const pagesData = await pagesResponse.json();
    console.log(`   Found ${pagesData.data?.length || 0} pages:`);
    
    for (const page of pagesData.data || []) {
      console.log(`   - ${page.name}`);
      console.log(`     ID: ${page.id}`);
      console.log(`     Category: ${page.category}`);
      console.log(`     Has Access Token: ${!!page.access_token}`);
      console.log();
    }

    // 3. Check for Orincore page specifically
    console.log('3. Checking for Orincore Page (103694521405609):');
    try {
      const orinResponse = await fetch(`https://graph.facebook.com/v21.0/103694521405609?access_token=${ACCESS_TOKEN}`);
      if (orinResponse.ok) {
        const orinData = await orinResponse.json();
        console.log(`   ✅ Orincore page accessible: ${orinData.name}`);
      } else {
        console.log(`   ❌ Orincore page not accessible: ${orinResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error accessing Orincore page: ${error.message}`);
    }
    console.log();

    // 4. Check Instagram accounts for each page
    console.log('4. Instagram Business Accounts:');
    for (const page of pagesData.data || []) {
      console.log(`   Checking ${page.name} (${page.id}):`);
      
      try {
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        );
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          if (igData.instagram_business_account) {
            console.log(`     ✅ Has Instagram: ${igData.instagram_business_account.id}`);
            
            // Get Instagram profile details
            const profileResponse = await fetch(
              `https://graph.facebook.com/v21.0/${igData.instagram_business_account.id}?fields=id,username,account_type&access_token=${page.access_token}`
            );
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log(`     Username: @${profileData.username}`);
              console.log(`     Account Type: ${profileData.account_type}`);
            }
          } else {
            console.log(`     ❌ No Instagram Business account`);
          }
        } else {
          console.log(`     ❌ Error checking Instagram: ${igResponse.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
      console.log();
    }

    // 5. Direct check of expected Instagram account
    console.log('5. Direct Instagram Account Check:');
    const expectedIds = ['17841438932131554', '25613381741599603'];
    
    for (const igId of expectedIds) {
      console.log(`   Checking IG ID: ${igId}`);
      try {
        // Try with user access token first
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${igId}?fields=id,username,account_type&access_token=${ACCESS_TOKEN}`
        );
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          console.log(`     ✅ Accessible: @${igData.username} (${igData.account_type})`);
        } else {
          console.log(`     ❌ Not accessible with user token: ${igResponse.status}`);
        }
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }

    console.log('\n6. Recommendations:');
    console.log('   - If Orincore page is missing, the user needs admin access to that page');
    console.log('   - If Instagram account is not found, check if it\'s properly connected to a Facebook page');
    console.log('   - Try reconnecting Instagram Business account to Facebook page');
    console.log('   - Verify the Instagram account is a Business account, not Personal');

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

if (ACCESS_TOKEN && ACCESS_TOKEN !== 'YOUR_TOKEN_HERE') {
  debugFacebookPages();
} else {
  console.log('⚠️  Please set ACCESS_TOKEN in the script');
  console.log('Use the token from your logs: EAATxV9N3FTcBP...');
}
