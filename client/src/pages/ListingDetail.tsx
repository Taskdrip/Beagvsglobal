import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import EscrowProgress from "@/components/EscrowProgress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  MapPin,
  MessageCircle,
  UserPlus,
  Star,
  Shield,
  Calendar,
  Package,
  DollarSign,
  Eye,
  Heart,
  Share2,
  Flag,
  ArrowLeft
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(1, "Please write a comment"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ListingDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showEscrowDialog, setShowEscrowDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["/api/listings/slug", slug],
  });

  const { data: platformWallet } = useQuery({
    queryKey: ["/api/platform-wallets/currency", listing?.currency, "network", listing?.network],
    enabled: !!(listing && listing.currency && listing.network),
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/follows/status", listing?.seller?.id],
    enabled: !!(listing && listing.seller && listing.seller.id) && isAuthenticated && listing.seller.id !== user?.id,
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const createEscrowMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !listing.id) return;
      await apiRequest("POST", "/api/escrows", {
        listingId: listing.id,
        sellerId: listing.sellerId,
        amount: listing.priceCrypto,
        currency: listing.currency,
        network: listing.network,
      });
    },
    onSuccess: () => {
      toast({
        title: "Escrow created successfully",
        description: "Follow the payment instructions to complete your purchase",
      });
      setShowEscrowDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/escrows"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create escrow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !listing.seller || !listing.seller.id) return;
      await apiRequest("POST", "/api/follows", {
        followeeId: listing.seller.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Follow request sent",
        description: "The user will be notified of your follow request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", listing?.seller?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send follow request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!listing || !listing.id) return;
      await apiRequest("POST", "/api/reviews", {
        listingId: listing.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review posted successfully",
        description: "Thank you for your feedback!",
      });
      setShowReviewDialog(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/listings/slug", slug] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateWhatsAppLink = () => {
    if (!listing || !listing.seller || !listing.seller.whatsapp) return "#";
    const message = `Hi! I'm interested in ${listing.title || 'your listing'}`;
    return `https://wa.me/${listing.seller.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const handleCreateEscrow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an escrow",
        variant: "destructive",
      });
      return;
    }
    createEscrowMutation.mutate();
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate();
  };

  const handleReview = (data: ReviewFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="h-96 bg-slate-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Listing not found</h1>
          <p className="text-slate-medium mb-8">The listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing?.sellerId;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div>
                    <div className="relative h-96 overflow-hidden rounded-t-lg">
                      <img
                        src={listing.images[selectedImageIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        data-testid="img-listing-main"
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          listing.type === 'REAL_ESTATE' ? 'bg-green-100 text-green-800' :
                          listing.type === 'SHIPPING_SERVICE' ? 'bg-blue-100 text-blue-800' :
                          listing.type === 'PRODUCT' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {listing.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2"
                          data-testid="button-favorite"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2"
                          data-testid="button-share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {listing.images.length > 1 && (
                      <div className="flex space-x-2 p-4 overflow-x-auto">
                        {listing.images.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                              selectedImageIndex === index ? 'border-crypto-blue' : 'border-slate-200'
                            }`}
                            data-testid={`button-image-${index}`}
                          >
                            <img src={image} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-dark" data-testid="text-listing-title">
                  {listing.title}
                </CardTitle>
                {listing.location && (
                  <p className="text-slate-medium flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-slate-dark whitespace-pre-wrap" data-testid="text-listing-description">
                    {listing.description}
                  </p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-medium">Category</p>
                      <p className="font-medium text-slate-dark">
                        {listing.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Network</p>
                      <p className="font-medium text-slate-dark">{listing.network}</p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Listed</p>
                      <p className="font-medium text-slate-dark">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Views</p>
                      <p className="font-medium text-slate-dark flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {Math.floor(Math.random() * 500) + 50}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Seller Info and Actions */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        listing.currency === 'PI' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {listing.currency === 'PI' ? 'π PI' : 'USDT'}
                      </span>
                      <span className="text-xs text-slate-medium">{listing.network}</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-slate-dark" data-testid="text-listing-price">
                      {parseFloat(listing.priceCrypto).toLocaleString()}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isOwner ? (
                  <>
                    <Dialog open={showEscrowDialog} onOpenChange={setShowEscrowDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full bg-crypto-blue hover:bg-crypto-teal font-semibold" 
                          size="lg"
                          data-testid="button-buy-escrow"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Buy via Escrow
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Create Escrow Transaction</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">Escrow Protection</h4>
                            <p className="text-sm text-blue-700">
                              Your payment will be held securely until the transaction is complete. 
                              A 10% platform fee will be deducted from the total amount.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-slate-medium">Item Price:</span>
                              <span className="font-semibold">{listing.priceCrypto} {listing.currency}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-medium">Platform Fee (10%):</span>
                              <span className="font-semibold">{(parseFloat(listing.priceCrypto) * 0.1).toFixed(8)} {listing.currency}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg">
                              <span className="font-semibold">Total:</span>
                              <span className="font-bold">{listing.priceCrypto} {listing.currency}</span>
                            </div>
                          </div>

                          {platformWallet && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <h4 className="font-semibold text-yellow-800 mb-2">Payment Instructions</h4>
                              <p className="text-sm text-yellow-700 mb-2">Send payment to:</p>
                              <p className="font-mono text-sm bg-white p-2 rounded border break-all">
                                {platformWallet.address}
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => setShowEscrowDialog(false)}
                              data-testid="button-cancel-escrow"
                            >
                              Cancel
                            </Button>
                            <Button
                              className="flex-1 bg-crypto-blue hover:bg-crypto-teal"
                              onClick={handleCreateEscrow}
                              disabled={createEscrowMutation.isPending}
                              data-testid="button-confirm-escrow"
                            >
                              {createEscrowMutation.isPending ? "Creating..." : "Create Escrow"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {listing.seller?.whatsapp && (
                      <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button 
                          variant="outline" 
                          className="w-full border-green-500 text-green-600 hover:bg-green-50"
                          data-testid="button-whatsapp"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact via WhatsApp
                        </Button>
                      </a>
                    )}
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">This is your listing</p>
                    <div className="mt-3 space-y-2">
                      <Link href={`/sell/${listing.id}/edit`}>
                        <Button variant="outline" className="w-full" data-testid="button-edit-listing">
                          Edit Listing
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            {listing.seller && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      {listing.seller.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <Link href={`/profile/${listing.seller.id}`}>
                        <h4 className="font-semibold text-slate-dark hover:text-crypto-blue cursor-pointer">
                          {listing.seller.username}
                        </h4>
                      </Link>
                      <p className="text-sm text-slate-medium">
                        {listing.seller.firstName} {listing.seller.lastName}
                      </p>
                    </div>
                  </div>

                  {listing.seller.bio && (
                    <p className="text-sm text-slate-medium">{listing.seller.bio}</p>
                  )}

                  <div className="text-sm text-slate-medium">
                    <p>Member since {new Date(listing.seller.createdAt).toLocaleDateString()}</p>
                    <p>{listing.seller.location}</p>
                  </div>

                  {!isOwner && isAuthenticated && (
                    <div className="pt-4 border-t border-slate-200">
                      {!followStatus ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleFollow}
                          disabled={followMutation.isPending}
                          data-testid="button-follow"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {followMutation.isPending ? "Sending..." : "Follow Seller"}
                        </Button>
                      ) : (
                        <div className="text-center py-2">
                          <span className="text-sm text-slate-medium">
                            {followStatus.status === 'PENDING' ? 'Follow request sent' : 
                             followStatus.status === 'ACCEPTED' ? 'Following' : 
                             'Follow request rejected'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Reviews ({listing.reviews?.length || 0})</span>
                </CardTitle>
                {isAuthenticated && !isOwner && (
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-write-review">Write Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Write a Review</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={reviewForm.handleSubmit(handleReview)} className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="mt-2">
                            <StarRating
                              rating={reviewForm.watch("rating")}
                              onRatingChange={(rating) => reviewForm.setValue("rating", rating)}
                              size="lg"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Comment</Label>
                          <Textarea
                            {...reviewForm.register("comment")}
                            placeholder="Share your experience with this listing..."
                            className="mt-1"
                            rows={4}
                            data-testid="input-review-comment"
                          />
                          {reviewForm.formState.errors.comment && (
                            <p className="text-sm text-red-600 mt-1">
                              {reviewForm.formState.errors.comment.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowReviewDialog(false)}
                            data-testid="button-cancel-review"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={createReviewMutation.isPending}
                            data-testid="button-submit-review"
                          >
                            {createReviewMutation.isPending ? "Posting..." : "Post Review"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {listing.reviews && listing.reviews.length > 0 ? (
                <div className="space-y-6">
                  {listing.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-slate-200 last:border-b-0 pb-6 last:pb-0" data-testid={`review-${review.id}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          {review.reviewer?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-dark">{review.reviewer?.username}</h4>
                            <StarRating rating={review.rating} size="sm" readonly />
                            <span className="text-sm text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-medium">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-dark mb-2">No reviews yet</h3>
                  <p className="text-slate-medium">Be the first to review this listing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
