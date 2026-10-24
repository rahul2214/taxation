"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BLOG_POSTS, TRENDING_SEARCH_TERMS, BlogPost } from "@/data/blogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Clock, 
  Eye, 
  ArrowRight, 
  Tag, 
  X,
  BookOpen,
  Calendar,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileText
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

  const isDefaultView = selectedCategory === "All" && !searchQuery.trim();
  const featuredPost: BlogPost | null = isDefaultView && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const gridPosts: BlogPost[] = isDefaultView && filteredPosts.length > 0 ? filteredPosts.slice(1) : filteredPosts;

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ========================================================= */}
      {/* HERO / SEARCH HEADER                                      */}
      {/* ========================================================= */}
      <section className="bg-slate-50 border-b border-slate-200 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>CPA RESEARCH &amp; REGULATORY INTELLIGENCE</span>
          </div>

          {/* Headline */}
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight mb-4">
            Tax Law Briefings, Regulatory Insights &amp; Guides
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Definitive analysis of IRS tax bracket shifts, small business structure optimizations, and wealth preservation strategies written by licensed CPAs.
          </p>

          {/* Search Input Bar */}
          <div className="relative max-w-2xl mx-auto mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by topic, tax code, or keyword (e.g. standard deduction, S-Corp, crypto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 text-sm rounded-xl border-slate-200 bg-white shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Trending Keywords Quick-Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-medium mr-1">Trending Topics:</span>
            {TRENDING_SEARCH_TERMS.slice(0, 5).map((term) => (
              <button
                key={term}
                onClick={() => handleTrendingClick(term)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-medium"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MAIN RESEARCH CATALOG AREA                                */}
      {/* ========================================================= */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-slate-100">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Results Count & Filter Status Header */}
          <div className="flex items-center justify-between mb-8 pb-3">
            <div className="text-xs sm:text-sm text-slate-600">
              Showing <strong className="text-slate-900 font-bold">{filteredPosts.length}</strong>{" "}
              {filteredPosts.length === 1 ? "article" : "articles"}
              {selectedCategory !== "All" && (
                <span>
                  {" "}in <span className="font-semibold text-slate-900">{selectedCategory}</span>
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}matching &ldquo;<span className="font-semibold text-slate-900">{searchQuery}</span>&rdquo;
                </span>
              )}
            </div>
            {(searchQuery || selectedCategory !== "All") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 h-8 px-2"
              >
                Reset filters
              </Button>
            )}
          </div>

          {/* ========================================================= */}
          {/* FEATURED FLAGSHIP ARTICLE (When in default overview mode) */}
          {/* ========================================================= */}
          {featuredPost && (
            <div className="mb-12">
              <div className="group bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 md:p-10 hover:border-slate-400 transition-all shadow-xs">
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {featuredPost.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <TrendingUp className="h-3 w-3" /> Flagship Analysis
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featuredPost.readTime}
                      </span>
                    </div>

                    <Link href={`/blogs/${featuredPost.slug}`}>
                      <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl line-clamp-3">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                      <span>By <strong className="text-slate-900">{featuredPost.author.name}</strong> • {featuredPost.author.role}</span>
                      <span>•</span>
                      <span>Published {featuredPost.date}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col justify-center items-start md:items-end">
                    <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 h-11 shadow-xs rounded-lg gap-2">
                      <Link href={`/blogs/${featuredPost.slug}`}>
                        <span>Read Full Briefing</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ARTICLE CARDS GRID                                        */}
          {/* ========================================================= */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <div
                  key={post.id}
                  className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white hover:border-slate-400 shadow-xs transition-all duration-200 rounded-xl p-6"
                >
                  <div>
                    {/* Category & Stats Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.views.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Article Title */}
                    <Link href={`/blogs/${post.slug}`}>
                      <h3 className="font-headline font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2.5">
                        {post.title}
                      </h3>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSearchQuery(tag)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Author & Read Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">
                        {post.author.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {post.author.role}
                      </p>
                    </div>

                    <Link
                      href={`/blogs/${post.slug}`}
                      className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Read Briefing</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 max-w-xl mx-auto">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Research Articles Found</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
                We could not find any guides matching &ldquo;{searchQuery}&rdquo;. Try another search keyword or browse our core practice areas.
              </p>
              <Button
                onClick={handleResetFilters}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 h-10"
              >
                Clear Search &amp; View All
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* BOTTOM ADVISORY CTA BANNER                                */}
      {/* ========================================================= */}
      <section className="bg-slate-950 text-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span>Direct CPA Engagement</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold tracking-tight">
            Need Tailored Guidance on Recent Tax Code Changes?
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Our CPAs can analyze how new state apportionment rules, IRS bracket adjustments, and statutory deductions impact your return or corporate entity.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-7 h-11 shadow-xs">
              <Link href="/book-appointment">Schedule Strategy Session</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-slate-700 text-white hover:bg-slate-900 font-semibold text-xs sm:text-sm px-7 h-11">
              <Link href="/services">Explore Practice Areas</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
