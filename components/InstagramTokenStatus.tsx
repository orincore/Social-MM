'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TokenStatus {
  connected: boolean;
  tokenExpiresAt?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  needsRefresh?: boolean;
  account?: {
    username: string;
    followersCount: number;
  };
}

export default function InstagramTokenStatus() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/instagram/refresh-token');
      const data = await response.json();
      
      if (response.ok) {
        setTokenStatus(data);
      } else {
        setError(data.error || 'Failed to fetch token status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch('/api/instagram/refresh-token', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTokenStatus(data);
        // Also refresh the main status
        await fetchTokenStatus();
      } else {
        setError(data.error || 'Failed to refresh token');
      }
    } catch (err) {
      setError('Network error during refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTokenStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Loading token status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Instagram Token Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTokenStatus} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!tokenStatus?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Instagram Not Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your Instagram account is not connected or the token has expired.
          </p>
          <Button onClick={() => window.location.href = '/api/instagram/connect'}>
            Reconnect Instagram
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (tokenStatus.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (tokenStatus.needsRefresh || (tokenStatus.daysUntilExpiry && tokenStatus.daysUntilExpiry <= 7)) {
      return <Badge variant="secondary">Needs Refresh</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Active</Badge>;
  };

  const getStatusIcon = () => {
    if (tokenStatus.isExpired) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (tokenStatus.needsRefresh || (tokenStatus.daysUntilExpiry && tokenStatus.daysUntilExpiry <= 7)) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Instagram Token Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        {tokenStatus.account && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Account:</span>
            <span className="text-sm">@{tokenStatus.account.username}</span>
          </div>
        )}
        
        {tokenStatus.daysUntilExpiry !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires in:</span>
            <span className="text-sm">
              {tokenStatus.daysUntilExpiry > 0 
                ? `${tokenStatus.daysUntilExpiry} days`
                : 'Expired'
              }
            </span>
          </div>
        )}
        
        {tokenStatus.tokenExpiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires on:</span>
            <span className="text-sm">
              {new Date(tokenStatus.tokenExpiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={refreshToken} 
            disabled={refreshing}
            size="sm"
            variant="outline"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Token
              </>
            )}
          </Button>
          
          <Button 
            onClick={fetchTokenStatus} 
            size="sm"
            variant="ghost"
          >
            Check Status
          </Button>
        </div>
        
        {(tokenStatus.needsRefresh || (tokenStatus.daysUntilExpiry && tokenStatus.daysUntilExpiry <= 7)) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Your Instagram token will expire soon. Click "Refresh Token" to extend it for another 60 days.
            </p>
          </div>
        )}
        
        {tokenStatus.isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <XCircle className="h-4 w-4 inline mr-1" />
              Your Instagram token has expired. You'll need to reconnect your account.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
