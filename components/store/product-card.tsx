'use client';

import Link from 'next/link';
import { ContentProduct } from '@/data/content-products';

interface ProductCardProps {
  product: ContentProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      {product.badge && (
        <span className="absolute -top-3 right-4 text-xs font-semibold bg-purple-600 text-white px-3 py-1 rounded-full shadow">
          {product.badge}
        </span>
      )}
      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400">{product.category}</p>
        <h3 className="text-lg font-semibold text-gray-900 mt-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-2">{product.description}</p>
      </div>
      <p className="text-sm font-medium text-emerald-600">{product.benefit}</p>
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">{product.price}</span>
        <Link
          href="/dashboard/store"
          className="text-sm font-semibold text-purple-600 hover:text-purple-700"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
