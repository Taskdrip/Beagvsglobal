import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  FileText,
  Globe,
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Upload,
  ImagePlus,
  X,
  CheckCircle,
  Clock,
  BookOpen,
  RefreshCw,
} from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  contentMarkdown: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().optional().or(z.literal("")),
  published: z.boolean().default(false),
  metaDescription: z.string().max(160).optional().or(z.literal("")),
  focusKeyword: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  ogTitle: z.string().max(60).optional().or(z.literal("")),
  ogDescription: z.string().max(160).optional().or(z.literal("")),
});

type BlogFormData = z.infer<typeof blogSchema>;

// ─── Cover Image Uploader ─────────────────────────────────────────────────────

interface CoverImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG, PNG, WebP, GIF", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const res = await apiRequest("POST", "/api/admin/upload-image", { base64, filename: file.name });
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          toast({ title: "Cover image uploaded" });
        }
      } catch {
        toast({ title: "Upload failed", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>Cover Image</Label>
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        data-testid="cover-image-uploader"
      >
        {value ? (
          <div className="relative group">
            <img src={value} alt="Cover" className="w-full h-40 object-cover rounded" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" className="bg-white" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                <Upload className="w-3 h-3 mr-1" /> Replace
              </Button>
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onChange(""); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            )}
            <p className="text-xs text-slate-500">{uploading ? "Uploading…" : "Click or drag image here"}</p>
            <p className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</p>
          </div>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL"
        className="text-xs"
        data-testid="input-blog-cover-url"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ─── Blog Post Editor Dialog ──────────────────────────────────────────────────

interface EditorDialogProps {
  open: boolean;
  onClose: () => void;
  post: any | null;
  onSaved: () => void;
}

function BlogEditorDialog({ open, onClose, post, onSaved }: EditorDialogProps) {
  const { toast } = useToast();
  const isEdit = !!post;

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: post?.title ?? "",
      excerpt: post?.excerpt ?? "",
      contentMarkdown: post?.contentMarkdown ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      published: post?.published ?? false,
      metaDescription: post?.metaDescription ?? "",
      focusKeyword: post?.focusKeyword ?? "",
      tags: Array.isArray(post?.tags) ? post.tags.join(", ") : (post?.tags ?? ""),
      ogTitle: post?.ogTitle ?? "",
      ogDescription: post?.ogDescription ?? "",
    },
  });

  // Reset form when post changes
  const prevId = useRef<string | null>(null);
  if (post?.id !== prevId.current) {
    prevId.current = post?.id ?? null;
    form.reset({
      title: post?.title ?? "",
      excerpt: post?.excerpt ?? "",
      contentMarkdown: post?.contentMarkdown ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      published: post?.published ?? false,
      metaDescription: post?.metaDescription ?? "",
      focusKeyword: post?.focusKeyword ?? "",
      tags: Array.isArray(post?.tags) ? post.tags.join(", ") : (post?.tags ?? ""),
      ogTitle: post?.ogTitle ?? "",
      ogDescription: post?.ogDescription ?? "",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        const res = await apiRequest("PATCH", `/api/blog/${post.id}`, payload);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Update failed");
        }
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/blog", payload);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Create failed");
        }
        return res.json();
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Blog post updated" : "Blog post created" });
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: BlogFormData) => saveMutation.mutate(data);
  const titleVal = form.watch("title");
  const metaVal = form.watch("metaDescription") ?? "";
  const ogTitleVal = form.watch("ogTitle") ?? "";
  const ogDescVal = form.watch("ogDescription") ?? "";
  const excerptVal = form.watch("excerpt") ?? "";
  const coverVal = form.watch("coverImageUrl") ?? "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {isEdit ? `Edit: ${post?.title}` : "Create New Blog Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Content
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1 flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> Cover Image
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 flex items-center gap-2">
                <Globe className="w-4 h-4" /> SEO
              </TabsTrigger>
              <TabsTrigger value="social" className="flex-1 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Social & Tags
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  {...form.register("title")}
                  placeholder="Enter blog post title"
                  data-testid="input-blog-title"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label>Excerpt *</Label>
                <Textarea
                  {...form.register("excerpt")}
                  placeholder="Brief summary shown in listings and previews"
                  rows={2}
                  data-testid="input-blog-excerpt"
                />
                {form.formState.errors.excerpt && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.excerpt.message}</p>
                )}
              </div>

              <div>
                <Label>Content (Markdown) *</Label>
                <div className="text-xs text-slate-400 mb-1">
                  Supports Markdown: **bold**, *italic*, # Heading, ## Subheading, - list, `code`, [link](url), ![img](url)
                </div>
                <Textarea
                  {...form.register("contentMarkdown")}
                  placeholder={"# Introduction\n\nWrite your content here using Markdown...\n\n## Subheading\n\nParagraph text with **bold** and *italic*.\n\n- List item\n- Another item"}
                  rows={18}
                  className="font-mono text-sm"
                  data-testid="input-blog-content"
                />
                {form.formState.errors.contentMarkdown && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.contentMarkdown.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-slate-50 border rounded-lg">
                <input
                  type="checkbox"
                  id="blog-published"
                  {...form.register("published")}
                  className="rounded"
                  data-testid="checkbox-blog-published"
                />
                <Label htmlFor="blog-published" className="cursor-pointer font-normal">
                  Publish immediately (visible to all users)
                </Label>
              </div>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4 mt-4">
              <p className="text-sm text-slate-500">
                Upload or link a cover image for this blog post. This image appears in post listings, social shares, and at the top of the post.
              </p>
              <CoverImageUpload
                value={coverVal}
                onChange={(url) => form.setValue("coverImageUrl", url)}
              />
              {coverVal && (
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-xs text-slate-500 font-medium mb-2">Preview</p>
                  <div className="rounded-lg overflow-hidden border shadow-sm">
                    <img src={coverVal} alt="Cover preview" className="w-full h-48 object-cover" />
                    <div className="p-3 bg-white">
                      <p className="font-semibold text-slate-800">{titleVal || "Post Title"}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{excerptVal || "Excerpt preview..."}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>SEO Tips:</strong> Meta description should be 120–160 characters. Use your focus keyword in the title, first paragraph, and headings.
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  Focus Keyword
                </Label>
                <Input
                  {...form.register("focusKeyword")}
                  placeholder="e.g. customs clearance Nigeria"
                  data-testid="input-blog-focus-keyword"
                />
                <p className="text-xs text-slate-500 mt-1">The main search term you want this post to rank for</p>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  {...form.register("metaDescription")}
                  placeholder="Brief summary for search engines (120–160 characters recommended)"
                  rows={3}
                  data-testid="input-blog-meta-desc"
                />
                <p className="text-xs mt-1">
                  <span className={metaVal.length > 160 ? "text-red-500" : metaVal.length >= 120 ? "text-green-500" : "text-amber-500"}>
                    {metaVal.length}/160
                    {metaVal.length > 160 && " — Too long!"}
                    {metaVal.length >= 120 && metaVal.length <= 160 && " — ✓ Good length"}
                    {metaVal.length > 0 && metaVal.length < 120 && " — Could be longer"}
                  </span>
                </p>
              </div>

              {/* Google preview */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Google Search Preview</p>
                <p className="text-blue-600 text-sm font-medium truncate">{titleVal || "Post Title"}</p>
                <p className="text-green-600 text-xs">beagvsglobal.com/blog/...</p>
                <p className="text-slate-600 text-xs mt-1 line-clamp-2">
                  {metaVal || excerptVal || "Meta description will appear here…"}
                </p>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="bg-slate-50 border rounded-lg p-3 text-sm text-slate-600">
                <strong>Open Graph</strong> controls how this post looks when shared on WhatsApp, Facebook, LinkedIn, Twitter.
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  {...form.register("tags")}
                  placeholder="e.g. customs, Nigeria, freight, import"
                  data-testid="input-blog-tags"
                />
                <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas</p>
              </div>

              <div>
                <Label>OG Title</Label>
                <Input
                  {...form.register("ogTitle")}
                  placeholder="Social share title (leave blank to use post title)"
                  data-testid="input-blog-og-title"
                />
                <p className="text-xs mt-1">
                  <span className={ogTitleVal.length > 60 ? "text-red-500" : "text-slate-400"}>
                    {ogTitleVal.length}/60{ogTitleVal.length > 60 && " — Too long!"}
                  </span>
                </p>
              </div>

              <div>
                <Label>OG Description</Label>
                <Textarea
                  {...form.register("ogDescription")}
                  placeholder="Social share description (leave blank to use meta description)"
                  rows={3}
                  data-testid="input-blog-og-desc"
                />
                <p className="text-xs mt-1">
                  <span className={ogDescVal.length > 160 ? "text-red-500" : "text-slate-400"}>
                    {ogDescVal.length}/160{ogDescVal.length > 160 && " — Too long!"}
                  </span>
                </p>
              </div>

              {/* Social preview */}
              {(ogTitleVal || titleVal) && (
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                  <p className="text-xs font-medium text-slate-500 p-2 bg-slate-50 border-b uppercase tracking-wide">Social Share Preview</p>
                  {coverVal && (
                    <img src={coverVal} alt="OG preview" className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-xs text-slate-400 uppercase">beagvsglobal.com</p>
                    <p className="font-semibold text-sm text-slate-800 mt-1">{ogTitleVal || titleVal}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {ogDescVal || metaVal || excerptVal}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-testid="button-cancel-blog"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saveMutation.isPending}
              data-testid="button-save-blog"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                isEdit ? "Update Post" : "Create Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminBlogManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [editorPost, setEditorPost] = useState<any | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: posts = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/blog"],
    staleTime: 0,
    retry: 1,
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blog/${id}`, { published });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: vars.published ? "Post published" : "Post unpublished" });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/blog/${id}`);
      if (!res.ok && res.status !== 204) {
        throw new Error("Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setDeleteTarget(null);
      toast({ title: "Post deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.tags) ? p.tags.join(" ") : p.tags ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && p.published) ||
      (filterStatus === "draft" && !p.published);
    return matchesSearch && matchesStatus;
  });

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="space-y-4">
      {/* Header & stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span><strong>{publishedCount}</strong> published</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-amber-500" />
            <span><strong>{draftCount}</strong> drafts</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-blog"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditorPost(null); setEditorOpen(true); }}
            data-testid="button-new-blog-post"
          >
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by title, excerpt, or tags…"
            className="pl-9"
            data-testid="input-blog-search"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors capitalize ${
                filterStatus === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? `All (${posts.length})` : s === "published" ? `Published (${publishedCount})` : `Drafts (${draftCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-red-200 mx-auto mb-3" />
              <p className="text-red-500 font-medium">Failed to load blog posts</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">{(error as any)?.message || "Check that you are logged in as admin"}</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-blog">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">
                {search || filterStatus !== "all" ? "No posts match your filter" : "No blog posts yet"}
              </p>
              {!search && filterStatus === "all" && (
                <p className="text-slate-400 text-sm mt-1">Click "New Post" to create your first article</p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                  data-testid={`blog-row-${post.id}`}
                >
                  {/* Cover thumbnail */}
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                  )}

                  {/* Post info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4
                        className="font-semibold text-slate-900 truncate"
                        data-testid={`blog-title-${post.id}`}
                      >
                        {post.title}
                      </h4>
                      <Badge
                        variant={post.published ? "default" : "secondary"}
                        className={post.published ? "bg-green-100 text-green-700 border-green-200" : ""}
                        data-testid={`badge-status-${post.id}`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </span>
                      {post.author && (
                        <span className="text-xs text-slate-400">
                          by {post.author.username || post.author.firstName || "Admin"}
                        </span>
                      )}
                      {post.tags && (Array.isArray(post.tags) ? post.tags : post.tags.split(",")).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs py-0">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Link href={`/blog/${post.slug}`}>
                      <Button size="sm" variant="ghost" title="View post" data-testid={`button-view-${post.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={post.published ? "Unpublish" : "Publish"}
                      onClick={() => publishMutation.mutate({ id: post.id, published: !post.published })}
                      disabled={publishMutation.isPending}
                      className={post.published ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                      data-testid={`button-toggle-publish-${post.id}`}
                    >
                      {post.published ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit post"
                      onClick={() => { setEditorPost(post); setEditorOpen(true); }}
                      data-testid={`button-edit-${post.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete post"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                      data-testid={`button-delete-${post.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <BlogEditorDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditorPost(null); }}
        post={editorPost}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
          queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>"{deleteTarget?.title}"</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              data-testid="button-confirm-delete-blog"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
