'use client';

import Link from 'next/link';
import { Zap, ArrowLeft, Scale, Shield, Users, Clock } from 'lucide-react';

export default function TermsOfServicePage() {
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
              <Scale className="h-12 w-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="#acceptance" className="text-indigo-600 hover:text-indigo-800 transition-colors">1. Acceptance of Terms</a>
              <a href="#description" className="text-indigo-600 hover:text-indigo-800 transition-colors">2. Service Description</a>
              <a href="#accounts" className="text-indigo-600 hover:text-indigo-800 transition-colors">3. User Accounts</a>
              <a href="#usage" className="text-indigo-600 hover:text-indigo-800 transition-colors">4. Acceptable Use</a>
              <a href="#content" className="text-indigo-600 hover:text-indigo-800 transition-colors">5. Content Policy</a>
              <a href="#payment" className="text-indigo-600 hover:text-indigo-800 transition-colors">6. Payment Terms</a>
              <a href="#privacy" className="text-indigo-600 hover:text-indigo-800 transition-colors">7. Privacy & Data</a>
              <a href="#termination" className="text-indigo-600 hover:text-indigo-800 transition-colors">8. Termination</a>
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-lg max-w-none">
            
            <section id="acceptance" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 text-indigo-600 mr-2" />
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing or using Social MM ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all visitors, users, and others who access or use the Service, including but not 
                limited to users who are contributors of content, information, and other materials or services on the Service.
              </p>
            </section>

            <section id="description" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                Social MM is a multi-platform social media management tool that allows users to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Schedule and publish content to Instagram, Facebook, and YouTube</li>
                <li>Manage multiple social media accounts from a single dashboard</li>
                <li>Generate AI-powered captions and content ideas</li>
                <li>Track analytics and performance metrics</li>
                <li>Store and organize media content</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time 
                with or without notice.
              </p>
            </section>

            <section id="accounts" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 text-indigo-600 mr-2" />
                3. User Accounts
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Eligibility</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old to use this Service. By using the Service, you represent 
                and warrant that you meet this age requirement.
              </p>
            </section>

            <section id="usage" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Permitted Uses</h3>
              <p className="text-gray-700 mb-4">You may use the Service for lawful business and personal purposes only.</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Uses</h3>
              <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit spam, viruses, or malicious code</li>
                <li>Harass, abuse, or harm others</li>
                <li>Impersonate any person or entity</li>
                <li>Collect user information without consent</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Publish content that is illegal, harmful, or offensive</li>
              </ul>
            </section>

            <section id="content" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content Policy</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you upload to the Service. By uploading content, you grant us 
                a non-exclusive, worldwide, royalty-free license to use, store, and process your content solely 
                for providing the Service.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Responsibility</h3>
              <p className="text-gray-700 mb-4">You are solely responsible for:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>The legality and appropriateness of your content</li>
                <li>Obtaining necessary rights and permissions</li>
                <li>Compliance with platform-specific terms (Instagram, Facebook, YouTube)</li>
                <li>Ensuring content does not violate third-party rights</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Removal</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to remove content that violates these Terms or applicable laws, 
                without prior notice.
              </p>
            </section>

            <section id="payment" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer both free and paid subscription plans:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Free Plan:</strong> Limited features with usage restrictions</li>
                <li><strong>Pro Plan (₹149/month):</strong> Full access to all features</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h3>
              <p className="text-gray-700 mb-4">
                Payments are processed securely through third-party payment processors. By providing 
                payment information, you authorize us to charge the applicable fees.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Refunds</h3>
              <p className="text-gray-700 mb-4">
                Refunds are handled on a case-by-case basis. Contact our support team for refund requests.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Changes to Pricing</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify pricing with 30 days' notice to existing subscribers.
              </p>
            </section>

            <section id="privacy" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our <Link href="/legal/privacy" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</Link>, 
                which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your data, but cannot guarantee 
                absolute security. You acknowledge the inherent risks of internet transmission.
              </p>
            </section>

            <section id="termination" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 text-indigo-600 mr-2" />
                8. Termination
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time through your account settings or by contacting us.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account if you violate these Terms or for any other reason 
                at our discretion, with or without notice.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Effect of Termination</h3>
              <p className="text-gray-700 mb-4">
                Upon termination, your right to use the Service ceases immediately. We may delete your 
                account and data, though some information may be retained as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, 
                EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
              <p className="text-gray-700 mb-4">
                WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES 
                ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of India. Any disputes shall be resolved in the 
                courts of [Your City], India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material 
                changes via email or through the Service. Continued use constitutes acceptance of modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email:</strong> contact@orincore.com</p>
                <p className="text-gray-700"><strong>Address:</strong> Maharashtra, India</p>
                <p className="text-gray-700"><strong>Support:</strong> support@orincore.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>

    </div>
  );
}
