'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Users2,
  MapPin,
  DollarSign,
  Calendar,
  Target,
  BellRing,
  Phone,
  Mail,
  CheckCircle2,
  Send,
  Wand2,
  Clock3
} from 'lucide-react';

export const AGENCY_DEMO_STORAGE_KEY = 'socialos-agency-demo';

interface AgencyWorkflowExperienceProps {
  demoMode?: boolean;
}

interface AgencyCriteria {
  objective: string;
  eventName: string;
  eventDate: string;
  location: string;
  budget: string;
  platforms: string[];
  deliverables: string[];
  kpis: string[];
  brandTone: string;
  aiNotes: string;
}

interface InfluencerProfile {
  id: string;
  name: string;
  category: string;
  followers: string;
  avgEngagement: string;
  feeRange: string;
  location: string;
  platforms: string[];
  contactEmail: string;
  contactPhone: string;
  readiness: string[];
  preferredDeliverables: string[];
  aiAngle: string;
}

interface InfluencerMatch extends InfluencerProfile {
  matchScore: number;
  aiRationale: string;
  signalStrength: string;
  status: 'pending' | 'notified';
}

interface NotificationEvent {
  id: string;
  creator: string;
  status: 'Queued' | 'Sent';
  channel: string;
  timestamp: string;
  brief: string;
}

const initialCriteria: AgencyCriteria = {
  objective: 'Paid promotion',
  eventName: 'Aurora Tech Launch Weekend',
  eventDate: '',
  location: 'Bengaluru · Hybrid',
  budget: '₹3.5L - ₹5.5L',
  platforms: ['Instagram', 'YouTube'],
  deliverables: ['Reels', 'Live stream'],
  kpis: ['Qualified RSVPs', 'Story Mentions'],
  brandTone: 'Futuristic, premium & bilingual',
  aiNotes: 'Need creators comfortable hosting IRL demos + bilingual hand-offs.'
};

const platformOptions = ['Instagram', 'YouTube', 'Threads', 'LinkedIn', 'TikTok'];
const deliverableOptions = ['Reels', 'Stories', 'Live stream', 'YouTube Shorts', 'LinkedIn thought piece'];
const kpiOptions = ['Qualified RSVPs', 'Story Mentions', 'Swipe ups', 'Booth visits', 'Lead capture'];

const mockInfluencers: InfluencerProfile[] = [
  {
    id: 'aanya-verma',
    name: 'Aanya Verma',
    category: 'Luxury Lifestyle & Tech',
    followers: '320K',
    avgEngagement: '6.2%',
    feeRange: '₹75K - ₹1.2L / deliverable',
    location: 'Mumbai',
    platforms: ['Instagram', 'YouTube'],
    contactEmail: 'aanya@studioflux.co',
    contactPhone: '+91 99876 12345',
    readiness: ['Paid product launches', 'Hybrid IRL + digital'],
    preferredDeliverables: ['Reels', 'Live stream'],
    aiAngle: 'Drives 28% higher RSVPs for premium events'
  },
  {
    id: 'vihaan-roy',
    name: 'Vihaan Roy',
    category: 'Gaming & Experiential Tech',
    followers: '210K',
    avgEngagement: '5.4%',
    feeRange: '₹60K - ₹90K / deliverable',
    location: 'Delhi NCR',
    platforms: ['YouTube', 'Instagram', 'Threads'],
    contactEmail: 'vihaan@creatorlane.io',
    contactPhone: '+91 98231 44556',
    readiness: ['Paid promotion', 'Product walk-throughs'],
    preferredDeliverables: ['YouTube Shorts', 'Reels'],
    aiAngle: 'Known for high watch time on live demos'
  },
  {
    id: 'ira-sen',
    name: 'Ira Sen',
    category: 'Design & Future of Work',
    followers: '185K',
    avgEngagement: '7.1%',
    feeRange: '₹55K - ₹80K / deliverable',
    location: 'Remote · APAC ready',
    platforms: ['LinkedIn', 'Instagram'],
    contactEmail: 'ira@northnode.studio',
    contactPhone: '+91 90045 88990',
    readiness: ['Thought leadership', 'Paid keynote slots'],
    preferredDeliverables: ['LinkedIn thought piece', 'Stories'],
    aiAngle: 'Trusted for B2B premium community launches'
  }
];

const seedNotifications: NotificationEvent[] = [
  {
    id: 'seed-1',
    creator: 'System',
    status: 'Queued',
    channel: 'Cloudflare Cron → Upstash Queue',
    timestamp: '10m ago',
    brief: 'Cron warmed queue with agency requirements.'
  },
  {
    id: 'seed-2',
    creator: 'AI Assistant',
    status: 'Sent',
    channel: 'Mock /api/publish',
    timestamp: 'Just now',
    brief: 'Dispatching preview briefs to short-listed creators.'
  }
];

export default function AgencyWorkflowExperience({ demoMode = false }: AgencyWorkflowExperienceProps) {
  const [isAgencyLoggedIn, setIsAgencyLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', accessCode: '' });
  const [criteria, setCriteria] = useState(initialCriteria);
  const [matches, setMatches] = useState<InfluencerMatch[]>([]);
  const [aiSummary, setAiSummary] = useState('Let AI understand your ideal creator before briefing.');
  const [notifications, setNotifications] = useState<NotificationEvent[]>(seedNotifications);
  const hasAutoLogged = useRef(false);

  const handleAgencyLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setIsAgencyLoggedIn(true);
    setNotifications((prev) => [
      {
        id: `login-${Date.now()}`,
        creator: demoMode ? 'Demo access granted' : 'Agency seat secured',
        status: 'Sent',
        channel: demoMode ? 'Demo session' : 'NextAuth session',
        timestamp: 'Just now',
        brief: 'Scoped access granted for agency workflow.'
      },
      ...prev
    ]);
  };

  useEffect(() => {
    if (!demoMode || hasAutoLogged.current) return;
    if (typeof window === 'undefined') return;
    hasAutoLogged.current = true;
    const saved = window.sessionStorage.getItem(AGENCY_DEMO_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCredentials((prev) => ({ ...prev, ...parsed }));
        setNotifications((prev) => [
          {
            id: `demo-${Date.now()}`,
            creator: parsed.email || 'Demo seat',
            status: 'Sent',
            channel: 'Demo fast-pass',
            timestamp: 'Just now',
            brief: 'Auto-logged with provided agency credentials.'
          },
          ...prev
        ]);
      } catch (error) {
        console.error('Failed to hydrate demo credentials:', error);
      }
    }
    setIsAgencyLoggedIn(true);
  }, [demoMode]);

  const handleMultiSelect = (field: 'platforms' | 'deliverables' | 'kpis', value: string) => {
    setCriteria((prev) => {
      const current = prev[field];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter((item) => item !== value) : [...current, value]
      };
    });
  };

  const computeMatchScore = (profile: InfluencerProfile) => {
    let score = 82;
    if (profile.platforms.some((platform) => criteria.platforms.includes(platform))) {
      score += 6;
    }
    if (profile.preferredDeliverables.some((deliverable) => criteria.deliverables.includes(deliverable))) {
      score += 4;
    }
    if (profile.readiness.includes(criteria.objective)) {
      score += 3;
    }
    if (profile.location.includes(criteria.location.split(' ')[0])) {
      score += 2;
    }
    return Math.min(score, 98);
  };

  const runAiMatch = () => {
    const enriched = mockInfluencers.map((profile) => ({
      ...profile,
      matchScore: computeMatchScore(profile),
      aiRationale: `${profile.aiAngle}. Aligns with ${criteria.brandTone.toLowerCase()} tone & ${criteria.platforms.join(', ')} cadence.`,
      signalStrength: profile.platforms.some((platform) => criteria.platforms.includes(platform)) ? 'Strong' : 'Medium',
      status: 'pending' as const
    }));

    setMatches(enriched.sort((a, b) => b.matchScore - a.matchScore));
    setAiSummary(
      `AI prioritized creators near ${criteria.location.split('·')[0].trim()} who can deliver ${criteria.deliverables.join(', ')} within the ${criteria.budget} budget band. Confidence: ${(90 + Math.random() * 8).toFixed(1)}%.`
    );
    setNotifications((prev) => [
      {
        id: `match-${Date.now()}`,
        creator: 'AI Matcher',
        status: 'Queued',
        channel: 'GPT-5 + vector audience graph',
        timestamp: 'Just now',
        brief: 'Generated influencer shortlist & drafted briefs.'
      },
      ...prev
    ]);
  };

  const handleNotifyCreator = (matchId: string) => {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              status: 'notified'
            }
          : match
      )
    );

    const notifiedMatch = matches.find((match) => match.id === matchId);
    if (!notifiedMatch) return;

    setNotifications((prev) => [
      {
        id: `notify-${Date.now()}`,
        creator: notifiedMatch.name,
        status: 'Sent',
        channel: 'Upstash queue → /api/publish',
        timestamp: 'Just now',
        brief: `Brief: ${criteria.eventName} (${criteria.objective}).`
      },
      ...prev
    ]);
  };

  const allReadyForDispatch = useMemo(() => matches.length > 0 && matches.every((match) => match.status === 'notified'), [matches]);

  return (
    <div className="min-h-screen bg-gray-50">
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white text-center text-sm font-medium py-2">
          Demo mode: use any agency email + access code to preview the workflow. No real accounts are touched.
        </div>
      )}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-indigo-500 font-semibold">Agency console</p>
            <h1 className="text-2xl font-bold text-gray-900">Match the perfect creators for your next paid event</h1>
            <p className="text-sm text-gray-500">Simulated flow using dummy data · keeps existing UI · shows AI + notification workflow end-to-end.</p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            SOC 2 compliant hand-offs
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">Workflow preview</p>
              <h2 className="text-3xl font-semibold mt-2">AI scouts creators, Upstash dispatches, creators get pinged.</h2>
              <p className="mt-3 text-white/80 max-w-2xl">
                Toggle dummy data to show prospects how agencies craft criteria, how our GPT-5 layer curates influencers, and how creators receive instant notifications in Socialos.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur border border-white/30 rounded-2xl p-4 w-full md:w-80">
              <p className="text-xs font-semibold uppercase text-white/80">Live sim</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-white/80">Agencies logged in</span>
                <span className="text-lg font-bold">12</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-white/80">Creators notified (demo)</span>
                <span className="text-lg font-bold">36</span>
              </div>
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: allReadyForDispatch ? '100%' : '68%' }} />
              </div>
              <p className="mt-2 text-xs text-white/70">{allReadyForDispatch ? 'All briefed · queue idle' : 'Waiting for agency confirmation'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Step 01</p>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    Agency login
                  </h3>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isAgencyLoggedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isAgencyLoggedIn ? 'Verified' : 'Awaiting login'}
                </span>
              </div>
              <form onSubmit={handleAgencyLogin} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Agency email
                  <input
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="events@agency.com"
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Access code
                  <input
                    type="password"
                    required
                    value={credentials.accessCode}
                    onChange={(event) => setCredentials((prev) => ({ ...prev, accessCode: event.target.value }))}
                    placeholder="••••••"
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-indigo-500" />
                    Demo uses dummy data · no real accounts touched.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Secure login
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Step 02</p>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Event criteria & AI brief
                  </h3>
                </div>
                <span className="text-xs text-gray-500">Unlocked after login</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  runAiMatch();
                }}
                className={`p-6 space-y-6 ${isAgencyLoggedIn ? '' : 'opacity-60 pointer-events-none'}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Event Name
                    <input
                      type="text"
                      value={criteria.eventName}
                      onChange={(event) => setCriteria((prev) => ({ ...prev, eventName: event.target.value }))}
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Target date
                    <input
                      type="date"
                      value={criteria.eventDate}
                      onChange={(event) => setCriteria((prev) => ({ ...prev, eventDate: event.target.value }))}
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Location / format
                    <div className="mt-2 relative">
                      <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={criteria.location}
                        onChange={(event) => setCriteria((prev) => ({ ...prev, location: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Budget band
                    <div className="mt-2 relative">
                      <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={criteria.budget}
                        onChange={(event) => setCriteria((prev) => ({ ...prev, budget: event.target.value }))}
                        className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm font-medium text-gray-700 md:col-span-1">
                    Objective
                    <select
                      value={criteria.objective}
                      onChange={(event) => setCriteria((prev) => ({ ...prev, objective: event.target.value }))}
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option>Paid promotion</option>
                      <option>Product launch</option>
                      <option>Community meetup</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700 md:col-span-2">
                    Brand tone
                    <input
                      type="text"
                      value={criteria.brandTone}
                      onChange={(event) => setCriteria((prev) => ({ ...prev, brandTone: event.target.value }))}
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preferred platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {platformOptions.map((platform) => {
                      const selected = criteria.platforms.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => handleMultiSelect('platforms', platform)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Deliverables</p>
                    <div className="flex flex-wrap gap-2">
                      {deliverableOptions.map((deliverable) => {
                        const selected = criteria.deliverables.includes(deliverable);
                        return (
                          <button
                            key={deliverable}
                            type="button"
                            onClick={() => handleMultiSelect('deliverables', deliverable)}
                            className={`px-3 py-1 rounded-full border text-sm ${
                              selected
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {deliverable}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Primary KPIs</p>
                    <div className="flex flex-wrap gap-2">
                      {kpiOptions.map((kpi) => {
                        const selected = criteria.kpis.includes(kpi);
                        return (
                          <button
                            key={kpi}
                            type="button"
                            onClick={() => handleMultiSelect('kpis', kpi)}
                            className={`px-3 py-1 rounded-full border text-sm ${
                              selected
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {kpi}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <label className="text-sm font-medium text-gray-700 block">
                  AI brief / extra notes
                  <textarea
                    rows={3}
                    value={criteria.aiNotes}
                    onChange={(event) => setCriteria((prev) => ({ ...prev, aiNotes: event.target.value }))}
                    className="mt-2 w-full border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    GPT-5 ranks creators against your signal map.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    <Users2 className="h-4 w-4" />
                    Run AI match
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Step 03 · AI summary</p>
                  <h3 className="text-lg font-semibold text-gray-900">{aiSummary}</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["Paid promotion ready", "Bilingual hosts", "Hybrid friendly"].map((tag) => (
                      <div key={tag} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">AI Matches</p>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-indigo-500" />
                    Influencer short-list
                  </h3>
                </div>
                <span className="text-xs text-gray-500">Dummy data</span>
              </div>

              <div className="p-6 space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">
                    Run an AI match to see shortlisted creators.
                  </div>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="border rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{match.name}</p>
                          <p className="text-xs text-gray-500">{match.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{match.matchScore}%</p>
                          <p className="text-xs text-gray-400">match confidence</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <Users2 className="h-4 w-4 text-gray-400" /> {match.followers} audience · {match.avgEngagement} avg engagement
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" /> {match.location} · {match.platforms.join(' / ')}
                        </p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" /> {match.feeRange}
                        </p>
                        <p className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-400" /> {match.aiRationale}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-xl bg-gray-50">
                          <p className="text-xs text-gray-500">Contacts</p>
                          <p className="flex items-center gap-2 font-medium text-gray-900">
                            <Mail className="h-4 w-4 text-indigo-500" />
                            {match.contactEmail}
                          </p>
                          <p className="flex items-center gap-2 text-gray-600 mt-1">
                            <Phone className="h-4 w-4 text-indigo-500" />
                            {match.contactPhone}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50">
                          <p className="text-xs text-gray-500">Preferred deliverables</p>
                          <p className="text-sm text-gray-900">{match.preferredDeliverables.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          match.status === 'notified'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {match.status === 'notified' ? 'Creator notified' : `${match.signalStrength} signal · Ready to notify`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleNotifyCreator(match.id)}
                          disabled={match.status === 'notified'}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                            match.status === 'notified'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <Send className="h-4 w-4" />
                          {match.status === 'notified' ? 'Pinged' : 'Notify creator'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Creator Notifications</p>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-amber-500" />
                    Dispatch stream
                  </h3>
                </div>
                <span className="text-xs text-gray-500">Simulated</span>
              </div>
              <div className="p-6 space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-2xl flex flex-col gap-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{notification.creator}</p>
                        <p className="text-xs text-gray-500">{notification.channel}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          notification.status === 'Sent'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{notification.brief}</p>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {notification.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
