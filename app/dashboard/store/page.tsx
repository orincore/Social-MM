'use client';

import ProtectedRoute from '@/components/protected-route';
import { ProductCard } from '@/components/store/product-card';
import { ProductAd } from '@/components/store/product-ad';
import { contentProducts } from '@/data/content-products';

export default function StorePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-10 space-y-8">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white p-8 shadow-lg">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Creator store</p>
              <h1 className="text-4xl font-bold mt-4">Content creation kits curated for IG & YouTube</h1>
              <p className="mt-3 text-white/80 max-w-2xl">
                Plug gaps in your workflow with gear, templates, and digital tools we rely on to plan shoots, capture crisp
                audio, and ship edits faster. Everything is priced in INR and optimized for independent creators.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm text-white/80">
                <div>
                  <p className="font-semibold text-white">Instant delivery</p>
                  <p>Notion kits, presets, caption packs ship immediately.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Partner-tested</p>
                  <p>Products vetted during real brand collaborations.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Made for India</p>
                  <p>INR pricing + COD options via our merchant partners.</p>
                </div>
              </div>
            </div>
            <div>
              <ProductAd variant="sidebar" />
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">All products</p>
                <h2 className="text-2xl font-bold text-gray-900">Everything you need to create faster</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Ships across India</span>
                <span className="text-gray-300">•</span>
                <span>Free returns for gear</span>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {contentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
