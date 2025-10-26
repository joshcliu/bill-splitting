'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { validateSessionCode } from '@/utils/validators';
import { Receipt, Users, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <div className="max-w-6xl w-full space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                AI-Powered Bill Splitting
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
              Split Bills
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                Effortlessly
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Scan receipts with AI, split with friends in real-time, and settle up instantly.
            </p>
          </div>

          {/* Main Actions */}
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Create New Bill */}
            <Card className="hover:shadow-lg transition-shadow border bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Create New Bill</CardTitle>
                <CardDescription className="text-base">
                  Scan a receipt and invite friends to split
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateSession}
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Start Splitting
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Join Existing Bill */}
            <Card className="hover:shadow-lg transition-shadow border bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl">Join a Bill</CardTitle>
                <CardDescription className="text-base">
                  Enter your friend's session code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="ABC123"
                    value={sessionCode}
                    onChange={(e) => {
                      setSessionCode(e.target.value.toUpperCase());
                      setCodeError('');
                    }}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest uppercase font-mono h-14 font-bold border-2 focus:border-purple-500"
                  />
                  {codeError && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{codeError}</p>
                  )}
                </div>
                <Button
                  onClick={handleJoinSession}
                  className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  Join Session
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto pt-8">
            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">AI Receipt Scanning</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Powered by Claude AI to extract items with incredible accuracy
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Real-time Sync</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Everyone sees updates instantly as you split the bill
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Fair & Accurate</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Automatic tax and tip calculation split proportionally
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
