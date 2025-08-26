import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  FileText,
  Camera
} from "lucide-react";
import type { User } from "@shared/schema";

interface KycStatusProps {
  user: User;
  className?: string;
}

const statusConfig = {
  NOT_STARTED: {
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "🚨 KYC Required",
    description: "Complete your verification to access all platform features",
    action: "Start Verification"
  },
  PENDING: {
    icon: Clock,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "⏳ Verification Pending",
    description: "We're reviewing your submitted documents",
    action: "View Status"
  },
  UNDER_REVIEW: {
    icon: FileText,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    label: "🔍 Under Review",
    description: "Our team is carefully reviewing your verification",
    action: "View Status"
  },
  APPROVED: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-300",
    label: "✅ Verified",
    description: "Your account is fully verified and secure",
    action: "View Certificate"
  },
  REJECTED: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-300",
    label: "❌ Verification Failed",
    description: "Please resubmit your documents for verification",
    action: "Retry Verification"
  }
};

export function KycStatus({ user, className }: KycStatusProps) {
  const status = user.kycStatus || 'NOT_STARTED';
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Card className={`border-2 ${config.color.split(' ')[2]} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${config.color}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Account Verification</h3>
            <Badge variant="secondary" className={`${config.color} font-medium mt-1`}>
              {config.label}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <IconComponent className={`w-5 h-5 mt-0.5 ${config.color.split(' ')[1]}`} />
          <div>
            <p className="text-sm text-gray-700">
              {config.description}
            </p>
            
            {status === 'REJECTED' && user.kycRejectionReason && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                <p className="text-sm text-red-700 mt-1">{user.kycRejectionReason}</p>
              </div>
            )}

            {status === 'APPROVED' && user.kycApprovedAt && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Verified on {new Date(user.kycApprovedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <Link href="/kyc" data-testid="kyc-action-button">
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              size="sm"
            >
              {status === 'NOT_STARTED' && (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  {config.action}
                </>
              )}
              {status === 'PENDING' && (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  {config.action}
                </>
              )}
              {status === 'UNDER_REVIEW' && (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {config.action}
                </>
              )}
              {status === 'APPROVED' && (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {config.action}
                </>
              )}
              {status === 'REJECTED' && (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {config.action}
                </>
              )}
            </Button>
          </Link>
        </div>

        {/* Security Features List */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-gray-600 mb-2">🔒 Bank-Level Security Features:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span>Facial Recognition</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span>Document Verification</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span>Multi-Country ID Support</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span>Encrypted Data Storage</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}