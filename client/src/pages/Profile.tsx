import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import MessageThread from "@/components/MessageThread";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { 
  UserPlus,
  MessageCircle,
  MapPin,
  Calendar,
  Package,
  Star,
  Users,
  ArrowLeft,
  Shield,
  Eye,
  DollarSign
} from "lucide-react";

function FollowerRow({
  follow, isOwnProfile, isAlreadyFollowing, onFollowBack, onUnfollow, isPending,
}: {
  follow: any; isOwnProfile: boolean; isAlreadyFollowing: boolean;
  onFollowBack: (id: string) => void; onUnfollow: (id: string) => void; isPending: boolean;
}) {
  return (
    <div className="flex items-center space-x-3" data-testid={`follower-${follow.follower?.id}`}>
      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600">
        {follow.follower?.username?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${follow.follower?.id}`}>
          <p className="font-medium text-slate-dark hover:text-crypto-blue cursor-pointer truncate">
            {follow.follower?.username}
          </p>
        </Link>
        <p className="text-sm text-slate-medium truncate">
          {follow.follower?.firstName} {follow.follower?.lastName}
        </p>
      </div>
      {isOwnProfile && (
        isAlreadyFollowing ? (
          <Button
            size="sm" variant="outline"
            onClick={() => onUnfollow(follow.follower?.id)}
            disabled={isPending}
            className="text-xs shrink-0"
          >
            Following ✓
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onFollowBack(follow.follower?.id)}
            disabled={isPending}
            className="text-xs shrink-0"
          >
            <UserPlus className="w-3 h-3 mr-1" /> Follow Back
          </Button>
        )
      )}
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const isOwnProfile = user && user.id === id;

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/users", id],
    enabled: !!id,
  });

  const { data: userListings } = useQuery({
    queryKey: ["/api/listings"],
    select: (data) => Array.isArray(data) ? data.filter((listing: any) => listing.sellerId === id) : [],
    enabled: !!id,
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/follows/status", id],
    enabled: !!id && isAuthenticated && !isOwnProfile,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Fetch the PROFILE USER's followers and following (public endpoints, no auth required)
  const { data: followers } = useQuery({
    queryKey: ["/api/users", id, "followers"],
    enabled: !!id,
  });

  const { data: following } = useQuery({
    queryKey: ["/api/users", id, "following"],
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: async (targetId?: string) => {
      const followeeId = targetId || id;
      if (!followeeId) return;
      await apiRequest("POST", "/api/follows", { followeeId });
    },
    onSuccess: (_data, targetId) => {
      toast({
        title: "Follow request sent",
        description: "The user will be notified of your follow request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "following"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Please log in to follow users", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 500);
        return;
      }
      toast({
        title: "Failed to send follow request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetId?: string) => {
      const followeeId = targetId || id;
      if (!followeeId) return;
      await apiRequest("DELETE", `/api/follows/${followeeId}`);
    },
    onSuccess: () => {
      toast({ title: "Unfollowed", description: "You are no longer following this user" });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "following"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to unfollow", description: error.message, variant: "destructive" });
    },
  });

  // Cancel a pending follow request
  const cancelFollowMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      await apiRequest("DELETE", `/api/follows/cancel/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Follow request cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "followers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to cancel request", description: error.message, variant: "destructive" });
    },
  });

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate(undefined);
  };

  const generateWhatsAppLink = () => {
    if (!profileUser?.whatsapp) return "#";
    const message = `Hi! I found your profile on RealShipEX.`;
    return `https://wa.me/${profileUser.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const calculateAverageRating = () => {
    if (!userListings || userListings.length === 0) return 0;
    const totalRating = userListings.reduce((sum: number, listing: any) => sum + (listing.avgRating || 0), 0);
    return totalRating / userListings.length;
  };

  const getTotalReviews = () => {
    if (!userListings || userListings.length === 0) return 0;
    return userListings.reduce((sum: number, listing: any) => sum + (listing.reviewCount || 0), 0);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="h-32 bg-slate-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-64 bg-slate-200 rounded-lg"></div>
              <div className="lg:col-span-2 h-64 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">User not found</h1>
          <p className="text-slate-medium mb-8">The user profile you're looking for doesn't exist.</p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();
  const totalReviews = getTotalReviews();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-3xl font-bold text-slate-600">
                {profileUser.username?.[0]?.toUpperCase() || '?'}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-dark mb-2" data-testid="text-profile-username">
                      {profileUser.username}
                    </h1>
                    <p className="text-lg text-slate-medium mb-2">
                      {profileUser.firstName} {profileUser.lastName}
                    </p>
                    {profileUser.location && (
                      <p className="text-slate-medium flex items-center mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profileUser.location}
                      </p>
                    )}
                    <p className="text-sm text-slate-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Member since {new Date(profileUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!isOwnProfile && isAuthenticated && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                      {profileUser.whatsapp && (
                        <a
                          href={generateWhatsAppLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button 
                            variant="outline" 
                            className="border-green-500 text-green-600 hover:bg-green-50"
                            data-testid="button-whatsapp-contact"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        </a>
                      )}
                      
                      <Button
                        onClick={() => setShowMessageDialog(true)}
                        variant="outline"
                        data-testid="button-send-message"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>

                      {!followStatus ? (
                        <Button
                          onClick={handleFollow}
                          disabled={followMutation.isPending}
                          data-testid="button-follow"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {followMutation.isPending ? "Sending..." : "Follow"}
                        </Button>
                      ) : followStatus.status === 'ACCEPTED' ? (
                        <Button
                          variant="outline"
                          onClick={() => unfollowMutation.mutate(undefined)}
                          disabled={unfollowMutation.isPending}
                          data-testid="button-unfollow"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {unfollowMutation.isPending ? "Unfollowing..." : "Following ✓"}
                        </Button>
                      ) : followStatus.status === 'PENDING' ? (
                        <Button
                          variant="outline"
                          onClick={() => cancelFollowMutation.mutate()}
                          disabled={cancelFollowMutation.isPending}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          data-testid="button-cancel-follow"
                        >
                          {cancelFollowMutation.isPending ? "Cancelling..." : "Request Sent · Cancel"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleFollow}
                          disabled={followMutation.isPending}
                          variant="outline"
                          data-testid="button-follow-retry"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {followMutation.isPending ? "Sending..." : "Follow Again"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {profileUser.bio && (
                  <p className="text-slate-medium mt-4" data-testid="text-profile-bio">
                    {profileUser.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-crypto-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-dark" data-testid="stat-listings">
                {userListings?.filter((listing: any) => listing.isActive)?.length || 0}
              </div>
              <p className="text-sm text-slate-medium">Active Listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-dark" data-testid="stat-rating">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
              </div>
              <p className="text-sm text-slate-medium">Average Rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-dark" data-testid="stat-reviews">
                {totalReviews}
              </div>
              <p className="text-sm text-slate-medium">Total Reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-dark" data-testid="stat-followers">
                {followers?.length || 0}
              </div>
              <p className="text-sm text-slate-medium">Followers</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings" data-testid="tab-listings">Listings</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Listings ({userListings?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {userListings && userListings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userListings.map((listing: any) => (
                      <Card key={listing.id} className="hover:shadow-lg transition-shadow" data-testid={`listing-${listing.id}`}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          {listing.images && listing.images.length > 0 ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-slate-200 flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge variant={listing.isActive ? "default" : "secondary"}>
                              {listing.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <Link href={`/listing/${listing.slug}`}>
                            <h3 className="font-semibold text-slate-dark hover:text-crypto-blue cursor-pointer mb-2 line-clamp-2">
                              {listing.title}
                            </h3>
                          </Link>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                listing.currency === 'PI' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                              }`}>
                                {listing.currency === 'PI' ? 'π PI' : 'USDT'}
                              </span>
                              <span className="font-bold text-slate-dark">{parseFloat(listing.priceCrypto).toLocaleString()}</span>
                            </div>
                            {listing.avgRating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-medium">{Number(listing.avgRating || 0).toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            Listed {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-dark mb-2">No listings found</h3>
                    <p className="text-slate-medium">This user hasn't created any listings yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {averageRating > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center border-b border-slate-200 pb-6">
                      <div className="text-4xl font-bold text-slate-dark mb-2">{averageRating.toFixed(1)}</div>
                      <StarRating rating={averageRating} size="lg" readonly />
                      <p className="text-slate-medium mt-2">Based on {totalReviews} reviews</p>
                    </div>

                    {userListings?.map((listing: any) => (
                      listing.reviews && listing.reviews.length > 0 && listing.reviews.map((review: any) => (
                        <div key={review.id} className="border-b border-slate-200 last:border-b-0 pb-4 last:pb-0" data-testid={`review-${review.id}`}>
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
                              <p className="text-slate-medium text-sm mb-1">For: {listing.title}</p>
                              <p className="text-slate-medium">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-dark mb-2">No reviews yet</h3>
                    <p className="text-slate-medium">This user hasn't received any reviews.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Followers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Followers ({followers?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {followers && followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.slice(0, 10).map((follow: any) => {
                        const isAlreadyFollowing = !!following?.some(
                          (f: any) => f.followeeId === follow.follower?.id
                        );
                        return (
                          <FollowerRow
                            key={follow.id}
                            follow={follow}
                            isOwnProfile={!!isOwnProfile}
                            isAlreadyFollowing={isAlreadyFollowing}
                            onFollowBack={(targetId) => followMutation.mutate(targetId)}
                            onUnfollow={(targetId) => unfollowMutation.mutate(targetId)}
                            isPending={followMutation.isPending || unfollowMutation.isPending}
                          />
                        );
                      })}
                      {followers.length > 10 && (
                        <p className="text-sm text-slate-medium text-center">
                          And {followers.length - 10} more followers...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-medium text-center py-4">No followers yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Following */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Following ({following?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {following && following.length > 0 ? (
                    <div className="space-y-3">
                      {following.slice(0, 5).map((follow: any) => (
                        <div key={follow.id} className="flex items-center space-x-3" data-testid={`following-${follow.followee.id}`}>
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            {follow.followee.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <Link href={`/profile/${follow.followee.id}`}>
                              <p className="font-medium text-slate-dark hover:text-crypto-blue cursor-pointer">
                                {follow.followee.username}
                              </p>
                            </Link>
                            <p className="text-sm text-slate-medium">
                              {follow.followee.firstName} {follow.followee.lastName}
                            </p>
                          </div>
                        </div>
                      ))}
                      {following.length > 5 && (
                        <p className="text-sm text-slate-medium text-center">
                          And {following.length - 5} more following...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-medium text-center py-4">Not following anyone yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Message Dialog */}
        {showMessageDialog && (
          <MessageThread
            recipientId={id!}
            recipientName={profileUser.username}
            onClose={() => setShowMessageDialog(false)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
