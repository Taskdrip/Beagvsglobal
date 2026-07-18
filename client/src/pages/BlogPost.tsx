import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Tag,
  Copy,
  Mail,
  Trash2,
  MessageSquare,
  Send,
  UserCircle,
} from "lucide-react";
import {
  SiX,
  SiFacebook,
  SiLinkedin,
  SiWhatsapp,
  SiTelegram,
  SiReddit,
  SiPinterest,
} from "react-icons/si";

export default function BlogPost() {
  const { toast } = useToast();
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: blogPost, isLoading } = useQuery({
    queryKey: ["/api/blog", slug],
  });

  const { data: recentPosts } = useQuery({
    queryKey: ["/api/blog"],
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["/api/blog", slug, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${slug}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
    enabled: !!slug,
  });

  const postComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to post comment");
      }
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast({ title: "Comment posted!", description: "Your comment was added successfully." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Could not post comment.", variant: "destructive" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/blog/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      refetchComments();
      toast({ title: "Comment deleted." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Could not delete comment.", variant: "destructive" });
    },
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

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = (blogPost as any).ogTitle || blogPost.title;
  const shareSummary = (blogPost as any).excerpt || (blogPost as any).metaDescription || "";
  const shareText = `${shareSummary ? `${shareSummary} ` : ""}Check out this read from Beagvs Global 👇`.trim();
  const shareCoverImage = (blogPost as any).coverImageUrl || "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Share URL copied to clipboard." });
  };

  const shareLinks = [
    {
      key: "x",
      label: "Share on X (Twitter)",
      Icon: SiX,
      className: "bg-black hover:bg-slate-800 text-white",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText ? `${shareTitle} — ${shareText}` : shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: "facebook",
      label: "Share on Facebook",
      Icon: SiFacebook,
      className: "bg-[#1877F2] hover:bg-[#1465d1] text-white",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText || shareTitle)}`,
    },
    {
      key: "linkedin",
      label: "Share on LinkedIn",
      Icon: SiLinkedin,
      className: "bg-[#0A66C2] hover:bg-[#0955a3] text-white",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      key: "whatsapp",
      label: "Share on WhatsApp",
      Icon: SiWhatsapp,
      className: "bg-[#25D366] hover:bg-[#1ebe59] text-white",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareText} ${shareUrl}`)}`,
    },
    {
      key: "telegram",
      label: "Share on Telegram",
      Icon: SiTelegram,
      className: "bg-[#229ED9] hover:bg-[#1c86b8] text-white",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || shareTitle)}`,
    },
    {
      key: "reddit",
      label: "Share on Reddit",
      Icon: SiReddit,
      className: "bg-[#FF4500] hover:bg-[#e03d00] text-white",
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      key: "pinterest",
      label: "Share on Pinterest",
      Icon: SiPinterest,
      className: "bg-[#E60023] hover:bg-[#c5001e] text-white",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareCoverImage || `${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`)}&description=${encodeURIComponent(shareText || shareTitle)}`,
    },
    {
      key: "email",
      label: "Share via Email",
      Icon: Mail,
      className: "bg-slate-600 hover:bg-slate-700 text-white",
      href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    },
  ];

  // Simple markdown to HTML conversion for basic formatting
  const renderMarkdown = (content: string) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-dark mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-dark mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-dark mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, "<br>")
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>)/gim, '<ul class="list-disc list-inside mb-4">$1</ul>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-crypto-blue hover:text-crypto-teal underline" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  const currentUserId = (user as any)?.id || (user as any)?.claims?.sub;
  const currentUserRole = (user as any)?.role;

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
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600">
                    {blogPost.author?.username?.[0]?.toUpperCase() || "?"}
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

              {/* Inline share buttons — header */}
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-sm text-slate-medium">Share:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {shareCoverImage && (
                    <img src={shareCoverImage} alt="" className="w-7 h-7 rounded object-cover border border-slate-200 mr-1 flex-shrink-0" />
                  )}
                  {shareLinks.map(({ key, label, Icon, href }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
                      title={label}
                      data-testid={`button-share-${key}`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
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
                  <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer">
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div
              className="text-slate-dark leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: `<p class="mb-4">${renderMarkdown(blogPost.contentMarkdown)}</p>`,
              }}
              data-testid="content-blog-markdown"
            />
          </div>

          {/* Article Footer — full share section */}
          <footer className="border-t border-slate-200 pt-8 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600 text-lg">
                  {blogPost.author?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-dark">{blogPost.author?.username}</h4>
                  <p className="text-sm text-slate-medium">
                    {blogPost.author?.firstName} {blogPost.author?.lastName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-slate-medium font-medium">Share this post:</span>
                <div className="flex flex-wrap gap-2">
                  {shareLinks.map(({ key, label, Icon, className, href }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${className}`}
                      title={label}
                      data-testid={`button-footer-share-${key}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label.replace("Share on ", "").replace("Share via ", "")}</span>
                    </a>
                  ))}
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    data-testid="button-footer-share-copy"
                    title="Copy link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy link</span>
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </article>

        {/* Comments Section */}
        <section className="mb-16" id="comments">
          <h2 className="text-2xl font-bold text-slate-dark mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-crypto-blue" />
            Comments
            {comments.length > 0 && (
              <span className="text-base font-normal text-slate-medium">({comments.length})</span>
            )}
          </h2>

          {/* Comment form */}
          {isAuthenticated ? (
            <div className="mb-8">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="mb-3 resize-none"
                rows={3}
              />
              <Button
                onClick={() => {
                  if (commentText.trim()) postComment.mutate(commentText);
                }}
                disabled={!commentText.trim() || postComment.isPending}
                className="flex items-center gap-2 bg-crypto-blue hover:bg-crypto-blue/90"
              >
                <Send className="w-4 h-4" />
                {postComment.isPending ? "Posting…" : "Post Comment"}
              </Button>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-slate-100 rounded-lg text-center">
              <p className="text-slate-medium mb-3">Sign in to leave a comment</p>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-slate-medium text-center py-8">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => {
                const isOwner = currentUserId && comment.userId === currentUserId;
                const isAdmin = currentUserRole === "ADMIN";
                return (
                  <Card key={comment.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600 flex-shrink-0">
                            {comment.user?.username?.[0]?.toUpperCase() || <UserCircle className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {comment.user?.username ? (
                                <Link href={`/profile/${comment.user.username}`}>
                                  <span className="font-semibold text-slate-dark hover:text-crypto-blue transition-colors cursor-pointer text-sm">
                                    {comment.user.username}
                                  </span>
                                </Link>
                              ) : (
                                <span className="font-semibold text-slate-dark text-sm">Anonymous</span>
                              )}
                              <span className="text-xs text-slate-400">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                        {(isOwner || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-500 flex-shrink-0 p-1"
                            onClick={() => deleteComment.mutate(comment.id)}
                            disabled={deleteComment.isPending}
                            title="Delete comment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Related Posts */}
        {recentPublishedPosts.length > 0 && (
          <section className="mt-4">
            <h2 className="text-2xl font-bold text-slate-dark mb-8">More from our blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPublishedPosts.map((post: any) => (
                <Card key={post.id} className="group hover:shadow-lg transition-shadow" data-testid={`related-post-${post.id}`}>
                  <div className="relative overflow-hidden rounded-t-lg">
                    {/* Fallback gradient as base; image overlaid and hides itself on error */}
                    <div className="w-full h-32 bg-gradient-to-r from-crypto-blue to-crypto-teal flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    {post.coverImageUrl && (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
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
