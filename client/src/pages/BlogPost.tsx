import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Calendar,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Clock,
  FileText,
  Tag,
  Copy,
  MessageCircle,
} from "lucide-react";

export default function BlogPost() {
  const { toast } = useToast();
  const { slug } = useParams();

  const { data: blogPost, isLoading } = useQuery({
    queryKey: ["/api/blog", slug],
  });

  const { data: recentPosts } = useQuery({
    queryKey: ["/api/blog"],
  });

  useEffect(() => {
    if (!blogPost) return;
    const post = blogPost as any;
    document.title = `${post.ogTitle || post.title} | Beagvs Global Blog`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(name.startsWith("og:") ? "property" : "name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    if (post.metaDescription) setMeta("description", post.metaDescription);
    setMeta("og:title", post.ogTitle || post.title);
    setMeta("og:description", post.ogDescription || post.metaDescription || post.excerpt || "");
    if (post.coverImageUrl) setMeta("og:image", post.coverImageUrl);
    setMeta("og:type", "article");
    if (post.focusKeyword) setMeta("keywords", Array.isArray(post.tags) ? post.tags.join(", ") : post.focusKeyword);
    return () => { document.title = "Beagvs Global"; };
  }, [blogPost]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="h-64 bg-slate-200 rounded-lg mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Blog post not found</h1>
          <p className="text-slate-medium mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const recentPublishedPosts = recentPosts?.filter((post: any) => 
    post.published && post.id !== blogPost.id
  ).slice(0, 3) || [];

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = (blogPost as any).ogTitle || blogPost.title;
  const shareSummary = (blogPost as any).excerpt || (blogPost as any).metaDescription || '';
  const shareText = `${shareSummary ? `${shareSummary} ` : ''}Check out this read from Beagvs Global 👇`.trim();
  const shareCoverImage = (blogPost as any).coverImageUrl || '';

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  // Simple markdown to HTML conversion for basic formatting
  const renderMarkdown = (content: string) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-dark mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-dark mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-dark mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/gim, '<ul class="list-disc list-inside mb-4">$1</ul>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-crypto-blue hover:text-crypto-teal underline" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/blog">
            <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back-to-blog">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Badge className="bg-crypto-blue text-white">Blog Post</Badge>
              <span className="text-sm text-slate-medium">•</span>
              <div className="flex items-center space-x-1 text-sm text-slate-medium">
                <Clock className="w-4 h-4" />
                <span>5 min read</span>
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-dark mb-6" data-testid="text-blog-post-title">
              {blogPost.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    {blogPost.author?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-dark">{blogPost.author?.username}</p>
                    <div className="flex items-center space-x-2 text-sm text-slate-medium">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(blogPost.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-sm text-slate-medium">Share:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {shareCoverImage && (
                    <img src={shareCoverImage} alt="" className="w-7 h-7 rounded object-cover border border-slate-200 mr-1 flex-shrink-0" />
                  )}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText ? `${shareTitle} — ${shareText}` : shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                    data-testid="button-share-twitter"
                    title="Share on X (Twitter)"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    data-testid="button-share-facebook"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-700 transition-colors"
                    data-testid="button-share-linkedin"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                    data-testid="button-share-whatsapp"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleCopyLink(); toast({ title: "Link copied!", description: "Share URL copied to clipboard." }); }}
                    className="p-2 text-slate-400 hover:text-slate-600"
                    data-testid="button-copy-link"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {blogPost.excerpt && (
              <p className="text-xl text-slate-medium leading-relaxed" data-testid="text-blog-excerpt">
                {blogPost.excerpt}
              </p>
            )}

            {Array.isArray((blogPost as any).tags) && (blogPost as any).tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4" data-testid="blog-tags">
                <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {(blogPost as any).tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {blogPost.coverImageUrl && (
            <div className="mb-8">
              <img 
                src={blogPost.coverImageUrl} 
                alt={blogPost.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                data-testid="img-blog-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div 
              className="text-slate-dark leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: `<p class="mb-4">${renderMarkdown(blogPost.contentMarkdown)}</p>` 
              }}
              data-testid="content-blog-markdown"
            />
          </div>

          {/* Article Footer */}
          <footer className="border-t border-slate-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                  {blogPost.author?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-dark">{blogPost.author?.username}</h4>
                  <p className="text-sm text-slate-medium">
                    {blogPost.author?.firstName} {blogPost.author?.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-medium">Share this post:</span>
                <div className="flex gap-1 flex-wrap">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText ? `${shareTitle} — ${shareText}` : shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                    data-testid="button-footer-share-twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                    data-testid="button-footer-share-facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
                    data-testid="button-footer-share-linkedin"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-700 rounded-lg transition-colors"
                    data-testid="button-footer-share-whatsapp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleCopyLink(); toast({ title: "Link copied!", description: "Share URL copied to clipboard." }); }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                    data-testid="button-footer-share-copy"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </article>

        {/* Related Posts */}
        {recentPublishedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-slate-dark mb-8">More from our blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPublishedPosts.map((post: any) => (
                <Card key={post.id} className="group hover:shadow-lg transition-shadow" data-testid={`related-post-${post.id}`}>
                  <div className="relative overflow-hidden rounded-t-lg">
                    {post.coverImageUrl ? (
                      <img 
                        src={post.coverImageUrl} 
                        alt={post.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-r from-crypto-blue to-crypto-teal flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="font-semibold text-slate-dark group-hover:text-crypto-blue transition-colors cursor-pointer mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-slate-medium mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{post.author?.username}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
