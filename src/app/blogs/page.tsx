"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BLOG_POSTS, TRENDING_SEARCH_TERMS, BlogPost } from "@/data/blogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Search, 
  Flame, 
  Clock, 
  Eye, 
  ArrowRight, 
  Tag, 
  Sparkles, 
  X,
  BookOpen,
  Calendar
} from "lucide-react";

const CATEGORIES = [
  "All",
  "IRS Updates",
  "Small Business",
  "Tax Deductions",
  "Crypto & Investments",
  "Retirement & Planning",
] as const;

function BlogsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Filter posts based on search query and category
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = post.title.toLowerCase().includes(q);
      const inExcerpt = post.excerpt.toLowerCase().includes(q);
      const inTags = post.tags.some((t) => t.toLowerCase().includes(q));
      const inCategory = post.category.toLowerCase().includes(q);
      const inAuthor = post.author.name.toLowerCase().includes(q);

      return inTitle || inExcerpt || inTags || inCategory || inAuthor;
    });
  }, [searchQuery, selectedCategory]);

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Polaris Tax Intelligence Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight mb-4">
              Tax Insights, Guides & Updates
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stay ahead of IRS policy shifts, maximize your deductions, and optimize your business tax strategy with expert-backed guides.
            </p>

            {/* Search Input Bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles by topic, keyword, or tax code (e.g., standard deduction, LLC, crypto)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 py-6 text-base rounded-full shadow-md border-border bg-card focus-visible:ring-2 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Trending Search Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs">
              <span className="flex items-center gap-1 font-semibold text-muted-foreground mr-1">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                Trending Searches:
              </span>
              {TRENDING_SEARCH_TERMS.map((term) => {
                const isActive = searchQuery.toLowerCase() === term.toLowerCase();
                return (
                  <button
                    key={term}
                    onClick={() => handleTrendingClick(term)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {term}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-card border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Results Status Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredPosts.length}</span>{" "}
                {filteredPosts.length === 1 ? "article" : "articles"}
                {selectedCategory !== "All" && (
                  <span>
                    {" "}in <span className="font-medium text-foreground">{selectedCategory}</span>
                  </span>
                )}
                {searchQuery && (
                  <span>
                    {" "}matching &ldquo;<span className="font-medium text-foreground">{searchQuery}</span>&rdquo;
                  </span>
                )}
              </div>
              {(searchQuery || selectedCategory !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset all filters
                </Button>
              )}
            </div>

            {/* Blog Cards Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group flex flex-col overflow-hidden border border-border/80 bg-card hover:shadow-xl hover:border-primary/40 transition-all duration-300 rounded-xl"
                  >
                    {/* Thumbnail Image */}
                    <Link href={`/blogs/${post.slug}`} className="relative h-52 w-full overflow-hidden bg-muted">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <Badge className="bg-primary/95 text-primary-foreground font-semibold shadow-sm">
                          {post.category}
                        </Badge>
                        {post.trending && (
                          <Badge className="bg-amber-500/95 text-white font-semibold flex items-center gap-1 shadow-sm">
                            <Flame className="h-3 w-3 fill-white" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    </Link>

                    {/* Card Body */}
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readTime}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                      <Link href={`/blogs/${post.slug}`}>
                        <h2 className="text-xl font-headline font-bold text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h2>
                      </Link>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    </CardContent>

                    {/* Card Footer */}
                    <CardFooter className="p-5 pt-3 border-t bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border">
                          <Image
                            src={post.author.avatar}
                            alt={post.author.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-tight">
                            {post.author.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {post.author.role}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary group-hover:translate-x-0.5 transition-transform p-0 h-auto font-medium text-xs flex items-center gap-1"
                      >
                        <Link href={`/blogs/${post.slug}`}>
                          Read Article
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border p-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tax articles found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  We could not find any guides matching &ldquo;{searchQuery}&rdquo;. Try another search term or browse our popular categories.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  variant="outline"
                >
                  Clear Search & View All
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
              Need Professional Assistance With Your 2026 Taxes?
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Don&apos;t navigate complex tax laws alone. Our certified CPAs and tax advisors ensure 100% compliance and maximum legal deductions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                <Link href="/book-appointment">Book a Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10 text-white">
                <Link href="/services">Explore Tax Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Loading tax insights...</p>
        </div>
      </PublicLayout>
    }>
      <BlogsContent />
    </Suspense>
  );
}
