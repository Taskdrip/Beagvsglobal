import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useState } from "react";
import { 
  Search,
  Calendar,
  User,
  ArrowRight,
  FileText
} from "lucide-react";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: blogPosts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/blog"],
  });

  const filteredPosts = blogPosts?.filter((post: any) => 
    post.published && (
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-dark mb-4" data-testid="text-blog-title">
            Beagvs Global Blog
          </h1>
          <p className="text-xl text-slate-medium max-w-3xl mx-auto">
            Stay updated with the latest news, insights, and developments in crypto-powered real estate and global shipping.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search blog posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-center"
              data-testid="input-blog-search"
            />
          </div>
        </div>

        {/* Blog Posts */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: any) => (
              <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-crypto-blue/30" data-testid={`blog-post-${post.id}`}>
                <div className="relative overflow-hidden rounded-t-lg">
                  {/* Fallback gradient always rendered as base layer */}
                  <div className="w-full h-48 bg-gradient-to-r from-crypto-blue to-crypto-teal flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white" />
                  </div>
                  {/* Cover image overlaid; hides itself on load error, revealing gradient */}
                  {post.coverImageUrl && (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="absolute inset-0 w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-dark">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="font-bold text-xl text-slate-dark group-hover:text-crypto-blue transition-colors cursor-pointer mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  
                  <p className="text-slate-medium mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-medium">
                      <User className="w-4 h-4" />
                      <span>{post.author?.username}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-medium">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <Button 
                      className="w-full bg-crypto-blue hover:bg-crypto-teal group"
                      data-testid={`button-read-more-${post.id}`}
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-dark mb-2">
              {searchQuery ? "No blog posts found" : "No blog posts available"}
            </h3>
            <p className="text-slate-medium mb-6">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Check back later for new content!"
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                data-testid="button-clear-search"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-16">
          <Card className="crypto-gradient text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Subscribe to our newsletter for the latest insights on crypto-powered real estate and global shipping innovations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  placeholder="Enter your email" 
                  className="bg-white/20 border-white/30 text-white placeholder:text-blue-200"
                  data-testid="input-newsletter-email"
                />
                <Button 
                  className="bg-white text-crypto-blue hover:bg-blue-50 whitespace-nowrap"
                  data-testid="button-newsletter-subscribe"
                >
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
