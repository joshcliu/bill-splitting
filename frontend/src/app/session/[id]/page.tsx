'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useSessionStore } from '@/store/sessionStore';
import { useAppStore } from '@/store/appStore';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency, calculateParticipantOwed } from '@/utils/calculations';
import { BillItem, Participant } from '@/types';
import QRCode from 'react-qr-code';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { currentSession, currentParticipant, setSession, setParticipant, addParticipant } = useSessionStore();
  const { setLoading, setError } = useAppStore();
  const socket = useSocket();

  const [guestName, setGuestName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await api.getSession(sessionId);
        setSession(session);
      } catch (error) {
        setError('Failed to load session');
        console.error('Error loading session:', error);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // WebSocket listeners
  useEffect(() => {
    if (!currentSession) return;

    const unsubscribeParticipant = socket.on('participant_joined', (data) => {
      if (data.sessionId === sessionId) {
        addParticipant(data.participant);
      }
    });

    const unsubscribeUpdate = socket.on('bill_updated', (data) => {
      if (data.sessionId === sessionId) {
        setSession(data.session);
      }
    });

    return () => {
      unsubscribeParticipant();
      unsubscribeUpdate();
    };
  }, [currentSession, sessionId]);

  const handleJoinSession = async () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const participant = await api.addParticipant(sessionId, {
        guestName: guestName.trim(),
        amountOwed: 0,
        amountPaid: 0,
        paymentStatus: 'pending',
      });

      setParticipant(participant);
      setHasJoined(true);

      if (currentParticipant) {
        socket.joinSession(sessionId, currentParticipant.id);
      }
    } catch (error) {
      setError('Failed to join session');
      console.error('Error joining session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = async (itemId: string) => {
    if (!currentParticipant) return;

    const newSelectedItems = new Set(selectedItems);

    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
      // Remove assignment
      const assignment = currentSession?.assignments.find(
        (a) => a.itemId === itemId && a.participantId === currentParticipant.id
      );
      if (assignment) {
        await api.deleteAssignment(assignment.id);
      }
    } else {
      newSelectedItems.add(itemId);
      // Add assignment
      await api.assignItem({
        itemId,
        participantIds: [currentParticipant.id],
        splitEqually: false,
      });
    }

    setSelectedItems(newSelectedItems);

    // Reload session
    const updatedSession = await api.getSession(sessionId);
    setSession(updatedSession);
  };

  const calculateMyTotal = () => {
    if (!currentSession || !currentParticipant) return 0;

    return calculateParticipantOwed(
      currentParticipant.id,
      currentSession.items,
      currentSession.assignments,
      currentSession.subtotal,
      currentSession.tax,
      currentSession.tip
    );
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading session...</div>
      </div>
    );
  }

  // Join flow
  if (!hasJoined && !currentParticipant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Join Bill Split</CardTitle>
            <CardDescription>
              {currentSession.restaurantName || 'Restaurant Bill'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <Button onClick={handleJoinSession} className="w-full">
              Join Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/session/${sessionId}` : '';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {currentSession.restaurantName || 'Bill Split'}
            </h1>
            <p className="text-muted-foreground">
              Session Code: <span className="font-mono font-bold">{currentSession.sessionCode}</span>
            </p>
          </div>
          <Button onClick={() => setShowQR(!showQR)} variant="outline">
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>
        </div>

        {/* QR Code */}
        {showQR && (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <QRCode value={shareUrl} size={200} />
              <p className="text-sm text-muted-foreground">
                Share this code for others to join
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bill Items */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Items</CardTitle>
            <CardDescription>
              Tap items you ordered (or shared)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSession.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No items yet. Add items manually or scan a receipt.
                </p>
              ) : (
                currentSession.items.map((item: BillItem) => {
                  const isSelected = selectedItems.has(item.id);
                  const assignments = currentSession.assignments.filter((a) => a.itemId === item.id);
                  const assignedCount = assignments.length;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemToggle(item.id)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                            {assignedCount > 0 && ` • Shared by ${assignedCount}`}
                          </div>
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* My Total */}
          <Card>
            <CardHeader>
              <CardTitle>Your Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(calculateMyTotal())}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Including tax and tip
              </p>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(currentSession.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(currentSession.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip</span>
                <span className="font-medium">{formatCurrency(currentSession.tip)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(currentSession.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants ({currentSession.participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSession.participants.map((participant: Participant) => {
                const owedAmount = calculateParticipantOwed(
                  participant.id,
                  currentSession.items,
                  currentSession.assignments,
                  currentSession.subtotal,
                  currentSession.tax,
                  currentSession.tip
                );

                return (
                  <div
                    key={participant.id}
                    className="flex justify-between items-center p-3 rounded-lg border"
                  >
                    <span className="font-medium">
                      {participant.guestName || 'Guest'}
                      {participant.id === currentParticipant?.id && ' (You)'}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(owedAmount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {participant.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
