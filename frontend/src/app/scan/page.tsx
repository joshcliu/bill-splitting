'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { useSessionStore } from '@/store/sessionStore';
import { Camera, Upload, Scan, Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-900">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <div className="max-w-3xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950 border border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">
                AI-Powered OCR
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Scan Your Receipt
            </h1>

            <p className="text-lg text-gray-400">
              Upload or capture your receipt and let Claude AI extract all the items
            </p>
          </div>

          {/* Main Card */}
          <Card className="border border-gray-800 bg-gray-950 shadow-lg">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Preview */}
              {previewUrl && !isCameraActive && (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] max-h-[500px] overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl bg-gray-50 dark:bg-gray-800">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      size="icon"
                      variant="destructive"
                      className="absolute top-4 right-4 rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {isCameraActive && (
                <div className="relative aspect-[3/4] max-h-[500px] overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-blue-500/50 rounded-xl pointer-events-none" />
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        const stream = videoRef.current?.srcObject as MediaStream;
                        stream?.getTracks().forEach(track => track.stop());
                        setIsCameraActive(false);
                      }}
                      size="lg"
                      variant="secondary"
                      className="rounded-full px-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTakePhoto}
                      size="lg"
                      className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Options */}
              {!previewUrl && !isCameraActive && (
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    onClick={handleCameraCapture}
                    className="p-8 rounded-xl border-2 border-dashed border-gray-700 hover:border-blue-500 hover:shadow-lg transition-shadow bg-gray-800"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg mb-1 text-white">Use Camera</div>
                        <div className="text-sm text-gray-400">
                          Take a photo now
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500 hover:shadow-lg transition-shadow bg-gray-800"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-purple-600 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg mb-1 text-white">Upload File</div>
                        <div className="text-sm text-gray-400">
                          Browse your files
                        </div>
                      </div>
                    </div>
                  </button>

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
              {selectedFile && (
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleScanReceipt}
                    size="lg"
                    disabled={isScanning}
                    className="h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Scanning with Claude AI...
                      </>
                    ) : (
                      <>
                        <Scan className="w-5 h-5 mr-2" />
                        Scan Receipt with AI
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="text-center pt-2">
                <Button
                  onClick={handleSkipScan}
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-100"
                >
                  Skip and enter items manually
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
              <div className="text-2xl mb-2">✨</div>
              <div className="font-semibold text-sm text-white">AI-Powered</div>
              <div className="text-xs text-gray-400">Claude Sonnet 4.5</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold text-sm text-white">Lightning Fast</div>
              <div className="text-xs text-gray-400">Results in seconds</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-sm text-white">High Accuracy</div>
              <div className="text-xs text-gray-400">99%+ precision</div>
            </div>
          </div>
        </div>
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
