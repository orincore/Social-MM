import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center justify-center md:justify-start">
            <Zap className="h-6 w-6 text-indigo-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Social MM</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-center text-sm text-gray-600">
            <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/deletion" className="hover:text-indigo-600 transition-colors">
              Data Deletion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
