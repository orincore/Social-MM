'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { ContentProduct } from '@/data/content-products';

interface ProductCardProps {
  product: ContentProduct;
  onAddToCart?: (product: ContentProduct) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xl font-bold text-gray-900">{product.price}</span>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/store"
            className="text-sm font-semibold text-purple-600 hover:text-purple-700"
          >
            View details →
          </Link>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white text-sm font-semibold px-4 py-2 shadow hover:bg-purple-700 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
