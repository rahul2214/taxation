"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BLOG_POSTS, TRENDING_SEARCH_TERMS } from "@/data/blogs";
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

export function BlogsClient() {
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
      const inKeywords = post.seo.keywords.some((k) => k.toLowerCase().includes(q));

      return inTitle || inExcerpt || inTags || inCategory || inAuthor || inKeywords;
    });
  }, [searchQuery, selectedCategory]);

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight mb-4">
            Tax Insights, Guides & Updates
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stay ahead of IRS policy shifts, maximize your deductions, and optimize your business tax strategy with expert-backed guides.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl mx-auto">
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
        </div>
      </section>

      {/* Main Content Area */}
      <section>
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
                  className="group flex flex-col justify-between overflow-hidden border border-border/80 bg-card hover:shadow-xl hover:border-primary/40 transition-all duration-300 rounded-xl"
                >
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold text-xs">
                        {post.category}
                      </Badge>
                      {post.trending && (
                        <Badge className="bg-amber-500/90 text-white font-semibold flex items-center gap-1 text-[11px] shadow-2xs">
                          <Flame className="h-3 w-3 fill-white" />
                          Trending
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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

                  <CardContent className="p-6 pt-0 flex-grow">
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
                  <CardFooter className="p-6 pt-3 border-t bg-muted/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {post.author.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {post.author.role}
                      </p>
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
  );
}
