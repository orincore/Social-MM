import Link from 'next/link';
import { contentProducts } from '@/data/content-products';

interface ProductAdProps {
  variant?: 'banner' | 'sidebar';
}

export function ProductAd({ variant = 'banner' }: ProductAdProps) {
  const featured = contentProducts.slice(0, 2);

  if (variant === 'sidebar') {
    const product = featured[0];
    return (
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm space-y-3">
        <div className="aspect-video rounded-xl overflow-hidden bg-white shadow">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-purple-600">Creator Store</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
        <p className="text-sm font-medium text-emerald-600 mt-2">{product.benefit}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">{product.price}</span>
          <Link
            href="/dashboard/store"
            className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
          >
            Shop now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Creator Store</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">Handpicked tools for fast content ships</h3>
          <p className="text-sm text-gray-500 mt-1">
            Lighting, audio, templates, and more—curated for Instagram + YouTube workflows.
          </p>
          <Link
            href="/dashboard/store"
            className="mt-4 inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
          >
            Browse store →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((product) => (
            <div key={product.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <div className="aspect-video rounded-lg overflow-hidden bg-white shadow">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-semibold text-gray-500">{product.category}</p>
              <h4 className="text-base font-semibold text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.benefit}</p>
              <p className="text-lg font-bold text-gray-900">{product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
