'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Instagram, Facebook, Youtube } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Calendar</h1>
        <p>This is the calendar page. If you can see this, the routing is working!</p>
      </div>
    </ProtectedRoute>
  );
}
