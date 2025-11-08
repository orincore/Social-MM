'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Instagram, Facebook, Youtube } from 'lucide-react';

const mockPosts = [
  {
    id: 1,
    title: 'Summer Collection Launch',
    date: '2024-11-15',
    time: '10:00',
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
  },
  {
    id: 2,
    title: 'Behind the Scenes Video',
    date: '2024-11-16',
    time: '14:30',
    platforms: ['youtube', 'instagram'],
    status: 'draft',
  },
  {
    id: 3,
    title: 'Customer Testimonial',
    date: '2024-11-18',
    time: '09:15',
    platforms: ['facebook'],
    status: 'published',
  },
];

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mockPosts.filter(post => post.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Today
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {getDaysInMonth(currentDate).map((day, index) => {
            const posts = day ? getPostsForDay(day) : [];
            
            return (
              <div
                key={index}
                className="min-h-[120px] p-2 border-r border-b last:border-r-0 hover:bg-gray-50"
              >
                {day && (
                  <>
                    <div className="text-sm font-medium text-gray-900 mb-2">{day}</div>
                    <div className="space-y-1">
                      {posts.map((post) => (
                        <div
                          key={post.id}
                          className="text-xs p-2 rounded bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100"
                        >
                          <div className="font-medium text-indigo-900 truncate">{post.title}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-indigo-600">{post.time}</span>
                            <div className="flex space-x-1">
                              {post.platforms.map((platform) => {
                                const Icon = platformIcons[platform as keyof typeof platformIcons];
                                return (
                                  <Icon key={platform} className="h-3 w-3 text-gray-500" />
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[post.status as keyof typeof statusColors]}`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Posts</h3>
        </div>
        <div className="divide-y">
          {mockPosts.filter(post => post.status === 'scheduled').map((post) => (
            <div key={post.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  {post.platforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    return (
                      <Icon key={platform} className="h-5 w-5 text-gray-400" />
                    );
                  })}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{post.title}</h4>
                  <p className="text-sm text-gray-500">{post.date} at {post.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[post.status as keyof typeof statusColors]}`}>
                  {post.status}
                </span>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
