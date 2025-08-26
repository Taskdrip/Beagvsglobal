import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  FileText, 
  Upload, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Globe,
  Calendar,
  Hash,
  Eye
} from "lucide-react";
import type { UploadResult } from "@uppy/core";

const documentTypes = {
  DRIVERS_LICENSE: "🚗 Driver's License",
  INTERNATIONAL_PASSPORT: "🛂 International Passport", 
  NATIONAL_ID: "🆔 National ID Card",
  VOTER_ID: "🗳️ Voter ID Card"
};

const countries = {
  US: "🇺🇸 United States",
  GB: "🇬🇧 United Kingdom", 
  CA: "🇨🇦 Canada",
  AU: "🇦🇺 Australia",
  DE: "🇩🇪 Germany",
  FR: "🇫🇷 France",
  NG: "🇳🇬 Nigeria",
  ZA: "🇿🇦 South Africa",
  KE: "🇰🇪 Kenya",
  GH: "🇬🇭 Ghana",
  IN: "🇮🇳 India",
  PH: "🇵🇭 Philippines",
  BR: "🇧🇷 Brazil",
  MX: "🇲🇽 Mexico"
};

interface DocumentFormData {
  documentType: string;
  country: string;
  documentNumber: string;
  expiryDate: string;
}

export default function KycVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentStep, setCurrentStep] = useState<'overview' | 'facial' | 'document' | 'review'>('overview');
  const [facialImageCaptured, setFacialImageCaptured] = useState(false);
  const [facialImageUrl, setFacialImageUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [documentForm, setDocumentForm] = useState<DocumentFormData>({
    documentType: '',
    country: '',
    documentNumber: '',
    expiryDate: ''
  });
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');

  // Get user's current KYC status
  const { data: kycStatus } = useQuery({
    queryKey: ["/api/kyc/status"],
    enabled: !!user,
  });

  // Start facial verification
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsRecording(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Capture facial photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      try {
        // Get upload URL
        const response = await apiRequest("/api/kyc/facial-upload-url", "POST");
        
        // Upload to storage
        const uploadResponse = await fetch(response.uploadURL, {
          method: "PUT",
          body: blob,
          headers: {
            'Content-Type': blob.type,
          },
        });

        if (uploadResponse.ok) {
          setFacialImageUrl(response.uploadURL);
          setFacialImageCaptured(true);
          stopCamera();
          toast({
            title: "✅ Photo Captured",
            description: "Facial verification photo captured successfully",
          });
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      }
    }, 'image/jpeg', 0.8);
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
    }
  };

  // Document upload handlers
  const handleDocumentUpload = async () => {
    const response = await apiRequest("/api/kyc/document-upload-url", "POST", {
      documentType: documentForm.documentType,
    });
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleDocumentComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setDocumentUrl(uploadedFile.uploadURL || "");
      setDocumentUploaded(true);
      toast({
        title: "✅ Document Uploaded",
        description: "Your ID document has been uploaded successfully",
      });
    }
  };

  // Submit KYC verification
  const submitKycMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/kyc/submit", "POST", {
        facialImageUrl,
        documentUrl,
        documentForm,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      toast({
        title: "🎉 KYC Submitted Successfully",
        description: "Your verification is now under review. We'll notify you once complete.",
      });
      setCurrentStep('review');
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const progress = currentStep === 'overview' ? 0 : 
                  currentStep === 'facial' ? 33 : 
                  currentStep === 'document' ? 66 : 100;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access KYC verification.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
            <p className="text-gray-600">Complete your KYC to unlock all platform features</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">Verification Progress</span>
            <span className="text-sm font-medium text-blue-800">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Overview Step */}
      {currentStep === 'overview' && (
        <div className="space-y-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span>Bank-Level Security Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                To ensure the highest security standards and protect all users, we require identity verification
                similar to what banks and financial institutions use.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Camera className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold">📷 Facial Verification</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Live photo capture</li>
                    <li>• Liveness detection</li>
                    <li>• Biometric analysis</li>
                    <li>• Anti-spoofing protection</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold">📄 Document Verification</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Government-issued ID</li>
                    <li>• Multiple country support</li>
                    <li>• Document authenticity check</li>
                    <li>• Encrypted storage</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacy & Security:</strong> All data is encrypted and stored securely. 
                  We comply with international data protection standards.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setCurrentStep('facial')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Verification Process
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Facial Verification Step */}
      {currentStep === 'facial' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-6 h-6 text-blue-600" />
                <span>Step 1: Facial Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-80 h-60 bg-gray-100 rounded-lg border-4 ${
                      isRecording ? 'border-green-400' : 'border-gray-300'
                    }`}
                    style={{ display: facialImageCaptured ? 'none' : 'block' }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                  
                  {facialImageCaptured && (
                    <div className="w-80 h-60 bg-green-50 border-4 border-green-400 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-800">Photo Captured!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-4">
                {!facialImageCaptured && (
                  <>
                    {!isRecording && (
                      <Button
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    )}

                    {isRecording && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Position your face in the center of the camera</li>
                            <li>• Ensure good lighting on your face</li>
                            <li>• Remove sunglasses or hats</li>
                            <li>• Look directly at the camera</li>
                          </ul>
                        </div>
                        
                        <div className="flex space-x-3 justify-center">
                          <Button
                            onClick={capturePhoto}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Capture Photo
                          </Button>
                          <Button
                            onClick={stopCamera}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {facialImageCaptured && (
                  <Button
                    onClick={() => setCurrentStep('document')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    size="lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Continue to Document Upload
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Verification Step */}
      {currentStep === 'document' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-purple-600" />
                <span>Step 2: Document Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="documentType" className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <span>Document Type *</span>
                    </Label>
                    <Select
                      value={documentForm.documentType}
                      onValueChange={(value) => setDocumentForm({ ...documentForm, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="country" className="flex items-center space-x-2 mb-2">
                      <Globe className="w-4 h-4" />
                      <span>Issuing Country *</span>
                    </Label>
                    <Select
                      value={documentForm.country}
                      onValueChange={(value) => setDocumentForm({ ...documentForm, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(countries).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documentNumber" className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4" />
                      <span>Document Number *</span>
                    </Label>
                    <Input
                      id="documentNumber"
                      value={documentForm.documentNumber}
                      onChange={(e) => setDocumentForm({ ...documentForm, documentNumber: e.target.value })}
                      placeholder="Enter document number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiryDate" className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Expiry Date</span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={documentForm.expiryDate}
                      onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center space-x-2 mb-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Document *</span>
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {!documentUploaded ? (
                        <div>
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            accept="image/*,.pdf"
                            onGetUploadParameters={handleDocumentUpload}
                            onComplete={handleDocumentComplete}
                            buttonClassName="bg-purple-600 hover:bg-purple-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </ObjectUploader>
                          <p className="text-xs text-gray-500 mt-2">
                            Supported: JPG, PNG, PDF (max 10MB)
                          </p>
                        </div>
                      ) : (
                        <div>
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="font-semibold text-green-800">Document Uploaded!</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setDocumentUploaded(false);
                              setDocumentUrl('');
                            }}
                          >
                            Upload Different Document
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Document Requirements:</strong>
                      <br />• Clear, high-resolution image
                      <br />• All text must be readable
                      <br />• Document must be valid and not expired
                      <br />• No alterations or modifications
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  onClick={() => setCurrentStep('facial')}
                  variant="outline"
                >
                  Back to Facial Verification
                </Button>
                
                <Button
                  onClick={() => submitKycMutation.mutate()}
                  disabled={!documentUploaded || !documentForm.documentType || !documentForm.country || !documentForm.documentNumber || submitKycMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {submitKycMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Step */}
      {currentStep === 'review' && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Verification Submitted Successfully!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">Under Review</h3>
                <p className="text-green-700 mb-4">
                  Your identity verification has been submitted and is now under review by our security team.
                </p>
                <p className="text-sm text-green-600">
                  You'll receive an email notification once the review is complete. This typically takes 24-48 hours.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">What happens next?</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• Our team reviews your documents</div>
                  <div>• Facial verification is processed</div>
                  <div>• You'll receive email confirmation</div>
                  <div>• Full account access will be unlocked</div>
                </div>
              </div>

              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                🔒 Your data is encrypted and secure
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}