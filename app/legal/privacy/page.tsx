'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <Zap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Social MM</span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Privacy Commitment */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <Lock className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Our Privacy Commitment</h3>
                <p className="text-indigo-800">
                  We are committed to protecting your privacy and ensuring transparency about how we collect, 
                  use, and protect your personal information. This policy explains our practices in detail.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="#information" className="text-indigo-600 hover:text-indigo-800 transition-colors">1. Information We Collect</a>
              <a href="#usage" className="text-indigo-600 hover:text-indigo-800 transition-colors">2. How We Use Information</a>
              <a href="#sharing" className="text-indigo-600 hover:text-indigo-800 transition-colors">3. Information Sharing</a>
              <a href="#storage" className="text-indigo-600 hover:text-indigo-800 transition-colors">4. Data Storage & Security</a>
              <a href="#rights" className="text-indigo-600 hover:text-indigo-800 transition-colors">5. Your Rights</a>
              <a href="#cookies" className="text-indigo-600 hover:text-indigo-800 transition-colors">6. Cookies & Tracking</a>
              <a href="#third-party" className="text-indigo-600 hover:text-indigo-800 transition-colors">7. Third-Party Services</a>
              <a href="#contact" className="text-indigo-600 hover:text-indigo-800 transition-colors">8. Contact Us</a>
            </div>
          </div>

          {/* Privacy Policy Content */}
          <div className="prose prose-lg max-w-none">
            
            <section id="information" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 text-indigo-600 mr-2" />
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <p className="text-gray-700 mb-4">When you create an account, we collect:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, profile picture</li>
                <li><strong>Authentication Data:</strong> OAuth tokens from Google, GitHub, or other providers</li>
                <li><strong>Contact Information:</strong> Phone number (if provided)</li>
                <li><strong>Payment Information:</strong> Billing details for paid subscriptions (processed securely by third-party processors)</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content and Usage Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Content:</strong> Posts, captions, images, videos you upload or create</li>
                <li><strong>Social Media Tokens:</strong> Access tokens for connected Instagram, Facebook, and YouTube accounts</li>
                <li><strong>Usage Analytics:</strong> How you interact with our service, features used, performance metrics</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Log Data:</strong> Access times, pages viewed, errors encountered</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Platform Data</h3>
              <p className="text-gray-700 mb-4">
                When you connect social media accounts, we may access:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Basic profile information (username, follower count)</li>
                <li>Publishing permissions to post content</li>
                <li>Analytics data (impressions, engagement metrics)</li>
                <li>Media library access (for content management)</li>
              </ul>
            </section>

            <section id="usage" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 text-indigo-600 mr-2" />
                2. How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Provision</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Create and manage your account</li>
                <li>Schedule and publish content to social media platforms</li>
                <li>Store and organize your media files</li>
                <li>Generate AI-powered captions and content suggestions</li>
                <li>Provide analytics and performance insights</li>
                <li>Process payments and manage subscriptions</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Communication</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Send service-related notifications and updates</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Send important account or security information</li>
                <li>Notify you of new features or changes to our service</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Improvement and Security</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Analyze usage patterns to improve our service</li>
                <li>Detect and prevent fraud or security threats</li>
                <li>Debug technical issues and optimize performance</li>
                <li>Develop new features and functionality</li>
              </ul>
            </section>

            <section id="sharing" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="h-6 w-6 text-indigo-600 mr-2" />
                3. Information Sharing and Disclosure
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">We Do Not Sell Your Data</h3>
              <p className="text-gray-700 mb-4">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Limited Sharing Scenarios</h3>
              <p className="text-gray-700 mb-4">We may share your information only in these specific cases:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Service Providers:</strong> Third-party services that help us operate (hosting, payment processing, analytics)</li>
                <li><strong>Social Media Platforms:</strong> Content you choose to publish through our service</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets (with user notification)</li>
                <li><strong>Consent:</strong> When you explicitly authorize us to share specific information</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Processing Partners</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2"><strong>Current Partners:</strong></p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li><strong>Vercel:</strong> Hosting and deployment</li>
                  <li><strong>MongoDB Atlas:</strong> Database services</li>
                  <li><strong>Cloudflare:</strong> CDN and security services</li>
                  <li><strong>OpenAI:</strong> AI content generation</li>
                  <li><strong>Payment Processors:</strong> Secure payment handling</li>
                </ul>
              </div>
            </section>

            <section id="storage" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 text-indigo-600 mr-2" />
                4. Data Storage and Security
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Security Measures</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure cloud storage with access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Multi-factor authentication support</li>
                <li>Secure API endpoints with rate limiting</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Content:</strong> Stored until you delete it or close your account</li>
                <li><strong>Analytics Data:</strong> Aggregated data may be retained for service improvement</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer as required by law</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">International Transfers</h3>
              <p className="text-gray-700 mb-4">
                Your data may be processed in countries other than your own. We ensure appropriate 
                safeguards are in place to protect your information during international transfers.
              </p>
            </section>

            <section id="rights" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-6 w-6 text-indigo-600 mr-2" />
                5. Your Privacy Rights
              </h2>
              
              <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Access & Portability</h4>
                  <p className="text-gray-700 text-sm">Request a copy of your personal data in a portable format</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Correction</h4>
                  <p className="text-gray-700 text-sm">Update or correct inaccurate personal information</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Deletion</h4>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data (subject to legal requirements)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Restriction</h4>
                  <p className="text-gray-700 text-sm">Limit how we process your personal information</p>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Exercise Your Rights</h3>
              <p className="text-gray-700 mb-4">
                To exercise any of these rights, please contact us at privacy@orincore.com or use our 
                <Link href="/legal/deletion" className="text-indigo-600 hover:text-indigo-800 ml-1">Data Deletion Request form</Link>.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> We will respond to your request within 30 days. Some requests may 
                  require identity verification to protect your privacy.
                </p>
              </div>
            </section>

            <section id="cookies" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Types of Cookies We Use</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for basic site functionality and security</li>
                <li><strong>Authentication Cookies:</strong> Keep you logged in to your account</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Managing Cookies</h3>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings. However, disabling certain cookies 
                may affect the functionality of our service.
              </p>
            </section>

            <section id="third-party" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Social Media Platforms</h3>
              <p className="text-gray-700 mb-4">
                When you connect social media accounts, you're also subject to their privacy policies:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><a href="https://help.instagram.com/519522125107875" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Instagram Privacy Policy</a></li>
                <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">Facebook Privacy Policy</a></li>
                <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">YouTube/Google Privacy Policy</a></li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics and Monitoring</h3>
              <p className="text-gray-700 mb-4">
                We may use third-party analytics services to understand how our service is used. 
                These services have their own privacy policies governing the collection and use of information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 18 years of age. We do not knowingly 
                collect personal information from children under 18. If you believe we have collected 
                information from a child under 18, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by email or through our service. The "Last Updated" date at the top of this 
                policy indicates when it was last revised.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 mb-2"><strong>Privacy Officer</strong></p>
                    <p className="text-gray-700">Email: privacy@orincore.com</p>
                    <p className="text-gray-700">Response Time: Within 48 hours</p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2"><strong>General Support</strong></p>
                    <p className="text-gray-700">Email: support@orincore.com</p>
                    <p className="text-gray-700">Address: Maharashtra, India</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

    </div>
  );
}
