import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Globe,
  Calendar,
  Hash,
  Eye,
  X
} from "lucide-react";

const documentTypes = {
  DRIVERS_LICENSE: "Driver's License",
  INTERNATIONAL_PASSPORT: "International Passport", 
  NATIONAL_ID: "National ID Card",
  VOTER_ID: "Voter ID Card"
};

const countries = {
  US: "United States",
  GB: "United Kingdom", 
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  NG: "Nigeria",
  ZA: "South Africa",
  KE: "Kenya",
  GH: "Ghana",
  IN: "India",
  PH: "Philippines",
  BR: "Brazil",
  MX: "Mexico"
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<'overview' | 'facial' | 'document' | 'review'>('overview');
  const [facialImageCaptured, setFacialImageCaptured] = useState(false);
  const [facialImageUrl, setFacialImageUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploadingFacial, setIsUploadingFacial] = useState(false);
  
  const [documentForm, setDocumentForm] = useState<DocumentFormData>({
    documentType: '',
    country: '',
    documentNumber: '',
    expiryDate: ''
  });
  const [documentUploaded, setDocumentUploaded] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const { data: kycStatus } = useQuery({
    queryKey: ["/api/kyc/status"],
    enabled: !!user,
  });

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
        description: "Unable to access camera. Please allow camera permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setIsUploadingFacial(true);
    try {
      const response = await apiRequest("POST", "/api/kyc/upload-facial", { imageData });
      const json = await response.json();

      setFacialImageUrl(json.url);
      setFacialImageCaptured(true);
      stopCamera();
      toast({
        title: "Photo Captured",
        description: "Facial verification photo saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFacial(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file under 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingDoc(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageData = reader.result as string;
          const response = await apiRequest("POST", "/api/kyc/upload-document", {
            imageData,
            documentType: documentForm.documentType || 'id',
            mimeType: file.type,
          });
          const json = await response.json();

          setDocumentUrl(json.url);
          setDocumentFileName(file.name);
          setDocumentUploaded(true);
          toast({
            title: "Document Uploaded",
            description: "Your ID document has been uploaded successfully.",
          });
        } catch (err: any) {
          toast({
            title: "Upload Error",
            description: err.message || "Failed to upload document. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingDoc(false);
        }
      };
      reader.onerror = () => {
        toast({
          title: "File Error",
          description: "Could not read the file. Please try a different file.",
          variant: "destructive",
        });
        setIsUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingDoc(false);
    }
  };

  const submitKycMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/kyc/submit", {
        facialImageUrl,
        documentUrl,
        documentForm,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      toast({
        title: "KYC Submitted Successfully",
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

  const kycStatusData = kycStatus as any;
  if (kycStatusData?.kycStatus === 'APPROVED') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Identity Verified</h2>
            <p className="text-green-700">Your KYC verification has been approved. You have full access to all platform features.</p>
            <Badge className="mt-4 bg-green-100 text-green-800">Verified</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatusData?.kycStatus === 'UNDER_REVIEW') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Under Review</h2>
            <p className="text-yellow-700">Your KYC submission is currently under review. We'll notify you once the process is complete (usually within 1–2 business days).</p>
            <Badge className="mt-4 bg-yellow-100 text-yellow-800">Pending Review</Badge>
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
                    <h3 className="font-semibold">Facial Verification</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Live photo capture via camera</li>
                    <li>• Liveness detection</li>
                    <li>• Biometric analysis</li>
                    <li>• Anti-spoofing protection</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold">Document Verification</h3>
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
                data-testid="button-start-verification"
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
                    className={`w-80 h-60 bg-gray-100 rounded-lg border-4 object-cover ${
                      isRecording ? 'border-green-400' : 'border-gray-300'
                    }`}
                    style={{ display: facialImageCaptured ? 'none' : 'block' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {facialImageCaptured && (
                    <div className="w-80 h-60 bg-green-50 border-4 border-green-400 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-800">Photo Captured!</p>
                        <p className="text-sm text-green-600">Ready to continue</p>
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
                        data-testid="button-start-camera"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    )}

                    {isRecording && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left">
                          <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Position your face in the centre of the camera</li>
                            <li>• Ensure good lighting on your face</li>
                            <li>• Remove sunglasses or hats</li>
                            <li>• Look directly at the camera</li>
                          </ul>
                        </div>
                        
                        <div className="flex space-x-3 justify-center">
                          <Button
                            onClick={capturePhoto}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isUploadingFacial}
                            data-testid="button-capture-photo"
                          >
                            {isUploadingFacial ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 mr-2" />
                                Capture Photo
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={stopCamera}
                            variant="outline"
                            data-testid="button-cancel-camera"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {facialImageCaptured && (
                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setFacialImageCaptured(false);
                        setFacialImageUrl('');
                      }}
                      variant="outline"
                      size="sm"
                      data-testid="button-retake-photo"
                    >
                      Retake Photo
                    </Button>
                    <Button
                      onClick={() => setCurrentStep('document')}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      size="lg"
                      data-testid="button-continue-to-document"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Continue to Document Upload
                    </Button>
                  </div>
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
                      <SelectTrigger data-testid="select-document-type">
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
                      <SelectTrigger data-testid="select-country">
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
                      data-testid="input-document-number"
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
                      data-testid="input-expiry-date"
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
                        <div className="space-y-4">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">
                            Upload a clear photo or scan of your ID document
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleDocumentFileChange}
                            className="hidden"
                            data-testid="input-document-file"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingDoc}
                            className="bg-purple-600 hover:bg-purple-700"
                            data-testid="button-upload-document"
                          >
                            {isUploadingDoc ? (
                              <>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500">
                            Supported: JPG, PNG, PDF (max 10MB)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                          <p className="font-semibold text-green-800">Document Uploaded!</p>
                          {documentFileName && (
                            <p className="text-sm text-gray-600 truncate">{documentFileName}</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDocumentUploaded(false);
                              setDocumentUrl('');
                              setDocumentFileName('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            data-testid="button-reupload-document"
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
                  data-testid="button-back-to-facial"
                >
                  Back to Facial Verification
                </Button>
                
                <Button
                  onClick={() => {
                    if (!facialImageUrl) {
                      toast({
                        title: "Facial photo required",
                        description: "Please go back and complete the facial verification step first.",
                        variant: "destructive",
                      });
                      return;
                    }
                    submitKycMutation.mutate();
                  }}
                  disabled={
                    !documentUploaded ||
                    !documentForm.documentType ||
                    !documentForm.country ||
                    !documentForm.documentNumber ||
                    submitKycMutation.isPending
                  }
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  data-testid="button-submit-kyc"
                >
                  {submitKycMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Submit KYC Verification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review / Submitted Step */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-800">Verification Submitted!</h2>
              <p className="text-gray-700 max-w-md mx-auto">
                Your KYC documents have been submitted successfully. Our team will review your submission
                and you'll receive a notification once the process is complete (usually within 1–2 business days).
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 mr-1 inline" />
                  Under Review
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
