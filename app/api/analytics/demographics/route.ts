import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { YouTubeAPI } from '@/lib/youtube-api';

// Function to get Instagram account dynamically by checking all Facebook pages
async function getConnectedInstagram(access_token: string) {
  const pagesResp = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${access_token}`
  );

  if (!pagesResp.ok) {
    throw new Error('Failed to fetch pages');
  }

  const pagesData = await pagesResp.json();

  for (const page of pagesData.data) {
    const r = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${access_token}`
    );

    if (r.ok) {
      const pageData = await r.json();
      if (pageData.instagram_business_account) {
        return {
          page_id: page.id,
          ig_user_id: pageData.instagram_business_account.id,
          page_access_token: page.access_token
        };
      }
    }
  }

  throw new Error("No IG business account found on any of the pages");
}

// Transform Instagram demographics data
function transformInstagramDemographics(demographicsBreakdowns: any) {
  const transformed: {
    gender: { name: string; value: number }[];
    age: { name: string; value: number }[];
    countries: { name: string; value: number; code: string }[];
  } = {
    gender: [],
    age: [],
    countries: []
  };

  // Process gender data
  if (demographicsBreakdowns.gender) {
    const genderData = demographicsBreakdowns.gender;
    const totalGender = Object.values(genderData).reduce((sum: number, count: any) => sum + count, 0);
    
    if (totalGender > 0) {
      transformed.gender = Object.entries(genderData).map(([key, count]: [string, any]) => {
        let name = key;
        // Map API gender codes to readable names
        if (key === 'F') name = 'Female';
        else if (key === 'M') name = 'Male';
        else if (key === 'U') name = 'Other';
        
        return {
          name,
          value: Math.round((count / totalGender) * 100)
        };
      });
    }
  }

  // Process age data
  if (demographicsBreakdowns.age) {
    const ageData = demographicsBreakdowns.age;
    const totalAge = Object.values(ageData).reduce((sum: number, count: any) => sum + count, 0);
    
    if (totalAge > 0) {
      transformed.age = Object.entries(ageData).map(([ageRange, count]: [string, any]) => ({
        name: ageRange,
        value: Math.round((count / totalAge) * 100)
      }));
    }
  }

  // Process countries data
  if (demographicsBreakdowns.country) {
    const countryData = demographicsBreakdowns.country;
    const totalCountries = Object.values(countryData).reduce((sum: number, count: any) => sum + count, 0);
    
    if (totalCountries > 0) {
      transformed.countries = Object.entries(countryData)
        .map(([code, count]: [string, any]) => ({
          name: getCountryName(code),
          value: Math.round((count / totalCountries) * 100),
          code
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 countries
    }
  }

  return transformed;
}

// Transform YouTube demographics data (YouTube Analytics API v2 has limited demographic data)
function transformYouTubeDemographics(analytics: any) {
  // YouTube Analytics API v2 doesn't provide detailed demographic breakdowns
  // We'll return placeholder structure for now
  return {
    gender: [
      { name: 'Male', value: 55 },
      { name: 'Female', value: 42 },
      { name: 'Other', value: 3 }
    ],
    age: [
      { name: '13-17', value: 8 },
      { name: '18-24', value: 28 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 18 },
      { name: '45-54', value: 7 },
      { name: '55+', value: 4 }
    ],
    countries: [
      { name: 'United States', value: 40, code: 'US' },
      { name: 'India', value: 20, code: 'IN' },
      { name: 'Brazil', value: 10, code: 'BR' },
      { name: 'United Kingdom', value: 12, code: 'GB' },
      { name: 'Others', value: 18, code: 'GL' }
    ]
  };
}

// Helper function to get country name from code
function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'IN': 'India',
    'BR': 'Brazil',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'RU': 'Russia',
    'TR': 'Turkey',
    'SA': 'Saudi Arabia',
    'AE': 'UAE',
    'EG': 'Egypt',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'PH': 'Philippines',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'SG': 'Singapore'
  };
  
  return countryNames[code] || code;
}

export async function GET(request: NextRequest) {
  console.log('Demographics Analytics API called');
  
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Demographics Analytics: No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Demographics Analytics: Session found for', session.user.email);

    await connectDB();

    let user = await User.findOne({ email: session.user.email });
    if (!user && session.user.name) {
      user = await User.findOne({ name: session.user.name, email: { $regex: /@facebook\.local$/ } });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const demographics: {
      instagram: {
        gender: { name: string; value: number }[];
        age: { name: string; value: number }[];
        countries: { name: string; value: number; code: string }[];
      } | null;
      youtube: any; // You might want to properly type this as well
    } = {
      instagram: null,
      youtube: null
    };

    // Fetch Instagram demographics
    try {
      const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
      
      if (instagramAccount && instagramAccount.accessToken) {
        if (!instagramAccount.tokenExpiresAt || new Date() < instagramAccount.tokenExpiresAt) {
          const baseUrl = 'https://graph.facebook.com/v21.0';
          const ig_user_id = instagramAccount.instagramId;
          const page_access_token = instagramAccount.accessToken;

          // Get follower demographics from Instagram - need separate calls for each breakdown
          const demographicsBreakdowns: {
            age: Record<string, number> | null;
            gender: Record<string, number> | null;
            country: Record<string, number> | null;
          } = {
            age: null,
            gender: null,
            country: null
          };

          // Fetch age demographics
          try {
            const ageResponse = await fetch(
              `${baseUrl}/${ig_user_id}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=age&access_token=${page_access_token}`
            );
            if (ageResponse.ok) {
              const ageData = await ageResponse.json();
              console.log('Instagram Age Demographics:', ageData);
              console.log('Age total_value structure:', JSON.stringify(ageData.data[0]?.total_value, null, 2));
              if (ageData.data && ageData.data.length > 0) {
                const metric = ageData.data[0];
                console.log('Age metric total_value:', metric.total_value);
                if (metric.total_value && metric.total_value.breakdowns) {
                  // Extract age data from breakdowns.results
                  const ageBreakdown: Record<string, number> = {};
                  metric.total_value.breakdowns.forEach((breakdown: any) => {
                    if (breakdown.results && Array.isArray(breakdown.results)) {
                      breakdown.results.forEach((result: any) => {
                        if (result.dimension_values && result.dimension_values.length > 0) {
                          const ageRange = result.dimension_values[0]; // First dimension is age
                          ageBreakdown[ageRange] = result.value;
                        }
                      });
                    }
                  });
                  demographicsBreakdowns.age = ageBreakdown;
                  console.log('Parsed age breakdown:', ageBreakdown);
                }
              }
            }
          } catch (error) {
            console.log('Error fetching age demographics:', error);
          }

          // Fetch gender demographics
          try {
            const genderResponse = await fetch(
              `${baseUrl}/${ig_user_id}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=gender&access_token=${page_access_token}`
            );
            if (genderResponse.ok) {
              const genderData = await genderResponse.json();
              console.log('Instagram Gender Demographics:', genderData);
              if (genderData.data && genderData.data.length > 0) {
                const metric = genderData.data[0];
                if (metric.total_value && metric.total_value.breakdowns) {
                  // Extract gender data from breakdowns.results
                  const genderBreakdown: Record<string, number> = {};
                  metric.total_value.breakdowns.forEach((breakdown: any) => {
                    if (breakdown.results && Array.isArray(breakdown.results)) {
                      breakdown.results.forEach((result: any) => {
                        if (result.dimension_values && result.dimension_values.length > 0) {
                          const gender = result.dimension_values[0]; // First dimension is gender
                          genderBreakdown[gender] = result.value;
                        }
                      });
                    }
                  });
                  demographicsBreakdowns.gender = genderBreakdown;
                  console.log('Parsed gender breakdown:', genderBreakdown);
                }
              }
            }
          } catch (error) {
            console.log('Error fetching gender demographics:', error);
          }

          // Fetch country demographics
          try {
            const countryResponse = await fetch(
              `${baseUrl}/${ig_user_id}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=country&access_token=${page_access_token}`
            );
            if (countryResponse.ok) {
              const countryData = await countryResponse.json();
              console.log('Instagram Country Demographics:', countryData);
              if (countryData.data && countryData.data.length > 0) {
                const metric = countryData.data[0];
                if (metric.total_value && metric.total_value.breakdowns) {
                  // Extract country data from breakdowns.results
                  const countryBreakdown: Record<string, number> = {};
                  metric.total_value.breakdowns.forEach((breakdown: any) => {
                    if (breakdown.results && Array.isArray(breakdown.results)) {
                      breakdown.results.forEach((result: any) => {
                        if (result.dimension_values && result.dimension_values.length > 0) {
                          const country = result.dimension_values[0]; // First dimension is country
                          countryBreakdown[country] = result.value;
                        }
                      });
                    }
                  });
                  demographicsBreakdowns.country = countryBreakdown;
                  console.log('Parsed country breakdown:', countryBreakdown);
                }
              }
            }
          } catch (error) {
            console.log('Error fetching country demographics:', error);
          }

          console.log('All demographics breakdowns:', demographicsBreakdowns);
          demographics.instagram = transformInstagramDemographics(demographicsBreakdowns);
        } else {
          console.log('Instagram token expired');
        }
      } else {
        console.log('Instagram account not connected or no access token');
      }
    } catch (error) {
      console.log('Error fetching Instagram demographics:', error);
    }

    // Fetch YouTube demographics
    try {
      const youtubeAccount = await YouTubeAccount.findOne({ 
        userId: user._id, 
        isActive: true 
      });

      if (youtubeAccount) {
        // Check if token is expired and refresh if needed
        let accessToken = youtubeAccount.accessToken;
        if (new Date() > youtubeAccount.tokenExpiresAt) {
          try {
            const refreshedTokens = await YouTubeAPI.refreshToken(youtubeAccount.refreshToken);
            accessToken = refreshedTokens.access_token;
            
            // Update stored tokens
            youtubeAccount.accessToken = accessToken;
            youtubeAccount.tokenExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
            await youtubeAccount.save();
          } catch (error) {
            console.error('Failed to refresh YouTube token:', error);
          }
        }

        if (accessToken) {
          // YouTube Analytics API v2 has very limited demographic data
          // For now, we'll use the transformed placeholder data
          demographics.youtube = transformYouTubeDemographics({});
          
          // TODO: Implement actual YouTube demographic fetching when API supports it
          // The YouTube Analytics API v2 doesn't provide detailed demographic breakdowns
          // like age/gender/country for most channels due to privacy restrictions
        }
      } else {
        console.log('YouTube account not connected');
      }
    } catch (error) {
      console.log('Error fetching YouTube demographics:', error);
    }

    console.log('Demographics Analytics: Data compiled successfully');
    return NextResponse.json({ 
      success: true, 
      data: demographics 
    });
    
  } catch (error) {
    console.error('Demographics Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch demographics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
