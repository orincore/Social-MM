"use client";

import { useMemo, useState } from 'react';
import ProtectedRoute from '@/components/protected-route';
import { ProductCard } from '@/components/store/product-card';
import { ProductAd } from '@/components/store/product-ad';
import { contentProducts, ContentProduct } from '@/data/content-products';
import { ShoppingBag, Trash2, CheckCircle } from 'lucide-react';

export default function StorePage() {
  const [cart, setCart] = useState<{ product: ContentProduct; quantity: number }[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddToCart = (product: ContentProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 5) } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(5, Math.max(1, item.quantity + delta)) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const numeric = Number(item.product.price.replace(/[^0-9.]/g, '').replace(',', '')) || 0;
      return total + numeric * item.quantity;
    }, 0);
  }, [cart]);

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(cartSubtotal);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = () => {
    setProcessingOrder(true);
    setTimeout(() => {
      setProcessingOrder(false);
      setShowCheckoutModal(false);
      setCart([]);
      setSuccessMessage('Order placed successfully! Invoice mailed to you.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }, 1500);
  };

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

          <section className="grid gap-8 xl:grid-cols-[2fr_1fr] items-start">
            <div className="space-y-4">
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
              <div className="grid gap-6 md:grid-cols-2">
                {contentProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sticky top-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Cart</p>
                  <h3 className="text-lg font-semibold text-gray-900">Creator checkout</h3>
                </div>
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>

              {cart.length === 0 ? (
                <div className="text-center text-sm text-gray-500 mt-6">
                  Add kits to start checkout.
                </div>
              ) : (
                <div className="space-y-4 mt-6 max-h-[360px] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="border border-gray-100 rounded-2xl p-4 flex gap-4">
                      <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                            <p className="text-xs text-gray-500">{item.product.category}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="inline-flex items-center rounded-full border border-gray-200">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, -1)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              –
                            </button>
                            <span className="px-3 font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.product.id, 1)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-900"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-gray-900">{item.product.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">Free</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-semibold py-3 shadow-lg disabled:opacity-40"
              >
                Proceed to checkout
              </button>

              {successMessage && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <CheckCircle className="h-4 w-4" />
                  {successMessage}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Dummy Payment</h3>
              <button
                onClick={() => !processingOrder && setShowCheckoutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              No real payment is processed. Use this flow to demo a successful order placement.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <input className="col-span-2 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Cardholder name" />
                <input className="col-span-2 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="Card number" />
                <input className="px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="MM/YY" />
                <input className="px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500" placeholder="CVV" />
              </div>

              <div className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Order total</span>
                  <span className="font-semibold text-gray-900">{formattedSubtotal}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Includes GST. Instant digital delivery for kits below ₹2,000.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                disabled={processingOrder}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={processingOrder}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {processingOrder ? 'Processing...' : 'Pay & place order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
