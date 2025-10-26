'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { validateSessionCode } from '@/utils/validators';

export default function Home() {
  const router = useRouter();
  const { setLoading, setError } = useAppStore();
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await api.createSession({});
      router.push(`/scan?sessionId=${session.id}`);
    } catch (error) {
      setError('Failed to create session. Please try again.');
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    setCodeError('');

    if (!sessionCode) {
      setCodeError('Please enter a session code');
      return;
    }

    if (!validateSessionCode(sessionCode.toUpperCase())) {
      setCodeError('Session code must be 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { session, participant } = await api.joinSession({
        sessionCode: sessionCode.toUpperCase(),
      });
      router.push(`/session/${session.id}`);
    } catch (error) {
      setCodeError('Session not found. Please check the code and try again.');
      console.error('Error joining session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Bill Splitter</h1>
          <p className="text-lg text-muted-foreground">
            Split restaurant bills effortlessly with friends
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Create New Bill */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Create New Bill</CardTitle>
              <CardDescription>
                Scan a receipt and start splitting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateSession}
                className="w-full"
                size="lg"
              >
                Start Splitting
              </Button>
            </CardContent>
          </Card>

          {/* Join Existing Bill */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Join a Bill</CardTitle>
              <CardDescription>
                Enter the session code from your friend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter 6-digit code"
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value.toUpperCase());
                    setCodeError('');
                  }}
                  maxLength={6}
                  className="text-center text-lg tracking-widest uppercase font-mono"
                />
                {codeError && (
                  <p className="text-sm text-destructive">{codeError}</p>
                )}
              </div>
              <Button
                onClick={handleJoinSession}
                className="w-full"
                size="lg"
              >
                Join Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid gap-4 md:grid-cols-3 pt-8">
          <div className="text-center space-y-2">
            <div className="text-3xl">📸</div>
            <h3 className="font-semibold">Scan Receipts</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered receipt scanning
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">👥</div>
            <h3 className="font-semibold">Real-time Sync</h3>
            <p className="text-sm text-muted-foreground">
              Everyone sees updates instantly
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">💰</div>
            <h3 className="font-semibold">Fair Splits</h3>
            <p className="text-sm text-muted-foreground">
              Automatic tax and tip calculation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
