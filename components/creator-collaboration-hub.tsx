'use client';

import { useState } from 'react';
import { Users2, MessageCircle, Bell, Send } from 'lucide-react';

interface CreatorMatch {
  id: string;
  name: string;
  category: string;
  followers: string;
  overlap: number;
  matchScore: number;
  platforms: string[];
  bio: string;
  availability: string;
  latestIdea: string;
}

interface MatchAcceptance {
  youAccepted: boolean;
  partnerAccepted: boolean;
}

interface CollaborationNotification {
  id: string;
  type: 'match' | 'invite' | 'message';
  title: string;
  description: string;
  timeAgo: string;
  status: 'new' | 'seen';
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
}

const mockCreatorMatches: CreatorMatch[] = [
  {
    id: 'aria-chen',
    name: 'Aria Chen',
    category: 'Sustainable Fashion',
    followers: '182K',
    overlap: 78,
    matchScore: 92,
    platforms: ['Instagram', 'YouTube'],
    bio: 'Slow fashion storyteller sharing capsule wardrobes & styling tips.',
    availability: 'Open for March launch content',
    latestIdea: 'Co-create a 5-look capsule challenge featuring artisan brands.'
  },
  {
    id: 'leo-ramirez',
    name: 'Leo Ramirez',
    category: 'Wellness & Productivity',
    followers: '96K',
    overlap: 64,
    matchScore: 88,
    platforms: ['Instagram', 'YouTube'],
    bio: 'Mindful routines + solo founder productivity experiments.',
    availability: 'Available for Q2 drops',
    latestIdea: 'Run a "Creators reset week" live series with dual POV shorts.'
  },
  {
    id: 'mira-patel',
    name: 'Mira Patel',
    category: 'Beauty & Skin Tech',
    followers: '210K',
    overlap: 71,
    matchScore: 85,
    platforms: ['Instagram'],
    bio: 'Chemist-backed skincare reviews & live routine breakdowns.',
    availability: 'Planning April brand collabs',
    latestIdea: '"Lab-to-vanity" split screen reels featuring both routines.'
  }
];

const mockCollabNotifications: CollaborationNotification[] = [
  {
    id: 'notif-0',
    type: 'match',
    title: 'AI match found',
    description: 'Hey Adarsh! We spotted a creator posting similar IG + YouTube content. Want to review their profile?',
    timeAgo: 'Just now',
    status: 'new'
  },
  {
    id: 'notif-1',
    type: 'match',
    title: 'New AI match: Aria Chen',
    description: '81% niche overlap · strong performance on reels this month.',
    timeAgo: '2h ago',
    status: 'new'
  },
  {
    id: 'notif-2',
    type: 'invite',
    title: 'Joint campaign invite',
    description: 'Mira sent a brief for "Glow Lab" UGC series.',
    timeAgo: '5h ago',
    status: 'new'
  },
  {
    id: 'notif-3',
    type: 'message',
    title: 'Draft feedback ready',
    description: 'Leo dropped comments on your Notion board.',
    timeAgo: 'Yesterday',
    status: 'seen'
  }
];

const mockChatHistory: Record<string, ChatMessage[]> = {
  'aria-chen': [
    {
      id: '1',
      sender: 'Aria',
      content: 'Love the capsule concept. Can we align drop dates with Earth Week?',
      timestamp: '2h ago',
      type: 'received'
    },
    {
      id: '2',
      sender: 'You',
      content: 'Absolutely. I can prep teaser clips for April 18-20.',
      timestamp: '1h ago',
      type: 'sent'
    },
    {
      id: '3',
      sender: 'Aria',
      content: 'Perfect. Let’s swap brand talking points tomorrow.',
      timestamp: '55m ago',
      type: 'received'
    }
  ],
  'leo-ramirez': [
    {
      id: '1',
      sender: 'Leo',
      content: 'Sharing the outline for the reset week edits in Notion.',
      timestamp: 'Yesterday',
      type: 'received'
    },
    {
      id: '2',
      sender: 'You',
      content: 'Got it. I’ll review the timers section tonight.',
      timestamp: 'Yesterday',
      type: 'sent'
    }
  ],
  'mira-patel': [
    {
      id: '1',
      sender: 'Mira',
      content: 'Sending over BTS stills for the lab shots.',
      timestamp: 'Mon',
      type: 'received'
    }
  ]
};

const initialAcceptanceStatus: Record<string, MatchAcceptance> = {
  'aria-chen': { youAccepted: true, partnerAccepted: true },
  'leo-ramirez': { youAccepted: false, partnerAccepted: true },
  'mira-patel': { youAccepted: false, partnerAccepted: false }
};

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface CreatorCollaborationHubProps {
  className?: string;
}

export default function CreatorCollaborationHub({ className }: CreatorCollaborationHubProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(mockCreatorMatches[0].id);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(mockChatHistory);
  const [chatInput, setChatInput] = useState('');
  const [acceptanceStatus, setAcceptanceStatus] = useState<Record<string, MatchAcceptance>>(initialAcceptanceStatus);

  const selectedMatch = mockCreatorMatches.find((match) => match.id === selectedMatchId) || mockCreatorMatches[0];
  const selectedMessages = chatHistory[selectedMatchId] || [];
  const currentAcceptance = acceptanceStatus[selectedMatchId];
  const chatUnlocked = !!(currentAcceptance?.youAccepted && currentAcceptance?.partnerAccepted);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatHistory((prev) => {
      const existing = prev[selectedMatchId] || [];
      const newMessage: ChatMessage = {
        id: `${Date.now()}`,
        sender: 'You',
        content: chatInput.trim(),
        timestamp: 'Just now',
        type: 'sent'
      };

      return {
        ...prev,
        [selectedMatchId]: [...existing, newMessage]
      };
    });

    setChatInput('');
  };

  const handleAcceptMatch = (matchId: string) => {
    setAcceptanceStatus((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        youAccepted: true
      }
    }));
  };

  return (
    <div className={cn('grid grid-cols-1 xl:grid-cols-3 gap-8', className)}>
      <div className="xl:col-span-2 space-y-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users2 className="h-5 w-5 text-purple-500 mr-2" />
                AI Collaboration Matches
              </h3>
              <p className="text-sm text-gray-500">Recommended creators with overlapping audiences</p>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Auto-refreshed hourly
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {mockCreatorMatches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedMatchId === match.id
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{match.name}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-600">{match.followers} audience</span>
                      <span className="text-gray-500">{match.platforms.join(' • ')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/80">Top match insight</p>
                <h4 className="text-2xl font-bold mt-2">{selectedMatch.name}</h4>
                <p className="text-sm text-white/80 mt-1">{selectedMatch.bio}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Audience overlap</span>
                    <span className="text-lg font-semibold">{selectedMatch.overlap}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Availability</span>
                    <span className="text-sm font-medium">{selectedMatch.availability}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-white/80">AI idea</span>
                    <p className="text-sm font-medium text-right max-w-xs">{selectedMatch.latestIdea}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    currentAcceptance?.youAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'
                  }`}>
                    You {currentAcceptance?.youAccepted ? 'accepted' : 'need to accept'}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    currentAcceptance?.partnerAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'
                  }`}>
                    {currentAcceptance?.partnerAccepted ? `${selectedMatch.name} accepted` : `Waiting for ${selectedMatch.name}`}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => handleAcceptMatch(selectedMatchId)}
                  disabled={currentAcceptance?.youAccepted}
                  className="flex-1 bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {currentAcceptance?.youAccepted ? 'Request accepted' : 'Accept collab request'}
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-white/40 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                  View media kit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 text-amber-500 mr-2" />
              Collaboration Feed
            </h3>
            <span className="text-xs text-gray-500">AI scanned 128 creators today</span>
          </div>
          <div className="p-6 space-y-4">
            {mockCollabNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  notification.status === 'new'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="mt-1">
                  {notification.type === 'match' && <Users2 className="h-5 w-5 text-purple-600" />}
                  {notification.type === 'invite' && <MessageCircle className="h-5 w-5 text-pink-500" />}
                  {notification.type === 'message' && <Bell className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                </div>
                {notification.status === 'new' && (
                  <span className="text-xs font-semibold text-amber-600 bg-white px-2 py-1 rounded-full">New</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm flex flex-col">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="h-5 w-5 text-sky-500 mr-2" />
            Live Collab Chat
          </h3>
          <p className="text-sm text-gray-500">Sync on briefs without leaving Socialos</p>
        </div>
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-sky-100 text-sky-700 text-sm font-semibold px-3 py-1 rounded-full">
              {selectedMatch.platforms.join(' • ')}
            </div>
            <span className="text-sm text-gray-500">
              {chatUnlocked ? `Chatting with ${selectedMatch.name}` : 'Chat unlocks after both confirm'}
            </span>
          </div>
          {chatUnlocked ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-2 text-sm shadow ${
                      message.type === 'sent'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="font-semibold text-xs mb-1">
                      {message.type === 'sent' ? 'You' : message.sender}
                      <span className="ml-2 text-[10px] opacity-70">{message.timestamp}</span>
                    </p>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50 px-4">
              <p className="text-sm text-sky-700">
                Accept the AI match and wait for {currentAcceptance?.partnerAccepted ? 'their confirmation' : `${selectedMatch.name} to confirm`} to unlock messaging.
              </p>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Share talking points, files or timelines..."
              disabled={!chatUnlocked}
              className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                chatUnlocked ? 'border-gray-200' : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatUnlocked}
              className={`rounded-full p-3 transition-colors ${
                chatUnlocked
                  ? 'bg-sky-600 hover:bg-sky-500 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
