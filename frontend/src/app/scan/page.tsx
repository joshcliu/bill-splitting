'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { useSessionStore } from '@/store/sessionStore';

function ScanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const { setLoading, setError } = useAppStore();
  const { setSession } = useSessionStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      setError('Failed to access camera. Please try uploading a file instead.');
      console.error('Camera error:', error);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));

            // Stop camera
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setIsCameraActive(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile || !sessionId) {
      setError('Please select a receipt image');
      return;
    }

    setIsScanning(true);
    setLoading(true);
    setError(null);

    try {
      // Upload the receipt
      const { receiptId } = await api.uploadReceipt(selectedFile);

      // Scan the receipt
      const receipt = await api.scanReceipt(receiptId);

      // Update session with receipt data
      const session = await api.updateSession(sessionId, {
        restaurantName: receipt.restaurantName,
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        tip: receipt.tip,
        total: receipt.total,
      });

      // Add items to session
      for (const item of receipt.items) {
        await api.addItem(sessionId, {
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineNumber: item.lineNumber,
        });
      }

      // Fetch updated session
      const updatedSession = await api.getSession(sessionId);
      setSession(updatedSession);

      // Navigate to session page
      router.push(`/session/${sessionId}`);
    } catch (error) {
      setError('Failed to scan receipt. Please try again.');
      console.error('Error scanning receipt:', error);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleSkipScan = () => {
    if (sessionId) {
      router.push(`/session/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Scan Your Receipt</h1>
          <p className="text-muted-foreground">
            Take a photo or upload an image of your receipt
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receipt Image</CardTitle>
            <CardDescription>
              We'll automatically extract items and prices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            {previewUrl && !isCameraActive && (
              <div className="relative aspect-[3/4] max-h-96 overflow-hidden rounded-lg border">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Camera View */}
            {isCameraActive && (
              <div className="relative aspect-[3/4] max-h-96 overflow-hidden rounded-lg border">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    onClick={handleTakePhoto}
                    size="lg"
                    className="rounded-full"
                  >
                    Take Photo
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Options */}
            {!previewUrl && !isCameraActive && (
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  onClick={handleCameraCapture}
                  variant="outline"
                  size="lg"
                  className="h-32"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📷</span>
                    <span>Use Camera</span>
                  </div>
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                  className="h-32"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📁</span>
                    <span>Upload File</span>
                  </div>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {selectedFile && (
                <>
                  <Button
                    onClick={handleScanReceipt}
                    size="lg"
                    disabled={isScanning}
                  >
                    {isScanning ? 'Scanning...' : 'Scan Receipt'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    variant="outline"
                  >
                    Choose Different Image
                  </Button>
                </>
              )}
              <Button
                onClick={handleSkipScan}
                variant="ghost"
              >
                Skip and Enter Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScanPageContent />
    </Suspense>
  );
}
