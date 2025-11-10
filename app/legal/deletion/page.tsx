'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap, ArrowLeft, Trash2, Shield, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

export default function DataDeletionPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    reason: '',
    confirmDeletion: false,
    dataTypes: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'confirmDeletion') {
        setFormData(prev => ({ ...prev, confirmDeletion: checked }));
      } else {
        setFormData(prev => ({
          ...prev,
          dataTypes: checked 
            ? [...prev.dataTypes, value]
            : prev.dataTypes.filter(item => item !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/legal/deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deletion request');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      alert('Failed to submit deletion request. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.fullName && formData.confirmDeletion;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your data deletion request has been submitted successfully. We will process your request within 30 days 
            and send you a confirmation email once completed.
          </p>
          <div className="space-y-3">
            <Link 
              href="/" 
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Home
            </Link>
            <Link 
              href="/legal/privacy" 
              className="block w-full text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-12 text-center">
            <div className="flex justify-center mb-4">
              <Trash2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Data Deletion Request</h1>
            <p className="text-red-100 text-lg">
              Request permanent deletion of your personal data from Social MM
            </p>
          </div>

          <div className="p-8">
            {/* Important Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Important Notice</h3>
                  <ul className="text-red-800 space-y-1">
                    <li>• This action is <strong>permanent and irreversible</strong></li>
                    <li>• All your content, analytics, and account data will be deleted</li>
                    <li>• You will lose access to all connected social media accounts</li>
                    <li>• Any active subscriptions will be cancelled</li>
                    <li>• Processing may take up to 30 days to complete</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Deletion Request Form</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 text-indigo-600 mr-2" />
                      Personal Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter the email associated with your account"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Must match the email address on your Social MM account
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Types to Delete */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Types to Delete</h3>
                    <p className="text-gray-600 mb-4">
                      Select the types of data you want to delete (all will be deleted by default):
                    </p>
                    
                    <div className="space-y-3">
                      {[
                        { value: 'account', label: 'Account Information', desc: 'Profile, settings, preferences' },
                        { value: 'content', label: 'Content & Media', desc: 'Posts, images, videos, captions' },
                        { value: 'analytics', label: 'Analytics Data', desc: 'Performance metrics, insights' },
                        { value: 'social', label: 'Social Media Connections', desc: 'Connected accounts, tokens' },
                        { value: 'billing', label: 'Billing Information', desc: 'Payment history, subscription data' }
                      ].map((item) => (
                        <label key={item.value} className="flex items-start">
                          <input
                            type="checkbox"
                            name="dataTypes"
                            value={item.value}
                            checked={formData.dataTypes.includes(item.value)}
                            onChange={handleInputChange}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Reason for Deletion */}
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Deletion (Optional)
                    </label>
                    <select
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a reason (optional)</option>
                      <option value="no-longer-needed">No longer need the service</option>
                      <option value="privacy-concerns">Privacy concerns</option>
                      <option value="switching-services">Switching to another service</option>
                      <option value="account-security">Account security issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Confirmation */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        name="confirmDeletion"
                        checked={formData.confirmDeletion}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        required
                      />
                      <span className="ml-3 text-sm text-red-800">
                        I understand that this action is permanent and irreversible. I confirm that I want to 
                        delete all my data from Social MM. *
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Submit Deletion Request
                        </>
                      )}
                    </button>
                    
                    <Link
                      href="/legal/privacy"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>

              {/* Information Sidebar */}
              <div className="space-y-6">
                {/* Process Timeline */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    Deletion Process
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Request Submitted</p>
                        <p className="text-xs text-blue-700">We receive and verify your request</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Identity Verification</p>
                        <p className="text-xs text-blue-700">We may contact you to confirm your identity</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Data Deletion</p>
                        <p className="text-xs text-blue-700">All your data is permanently removed</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Confirmation</p>
                        <p className="text-xs text-blue-700">You receive confirmation email</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternative Options */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 text-green-600 mr-2" />
                    Alternative Options
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-green-800">
                      Before deleting your account, consider these alternatives:
                    </p>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li>• <strong>Account Deactivation:</strong> Temporarily disable your account</li>
                      <li>• <strong>Data Export:</strong> Download your data before deletion</li>
                      <li>• <strong>Privacy Settings:</strong> Adjust what data we collect</li>
                      <li>• <strong>Subscription Pause:</strong> Pause paid features temporarily</li>
                    </ul>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong>Privacy Team:</strong><br />
                      privacy@socialmm.com
                    </p>
                    <p>
                      <strong>Support Team:</strong><br />
                      support@socialmm.com
                    </p>
                    <p>
                      <strong>Response Time:</strong><br />
                      Within 48 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
