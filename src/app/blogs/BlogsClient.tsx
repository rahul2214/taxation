"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BLOG_POSTS, TRENDING_SEARCH_TERMS, BlogPost } from "@/data/blogs";
import { Search, X, ArrowRight } from "lucide-react";
import { ClosingCta } from "@/components/public/ClosingCta";

const CATEGORIES = [
  "All",
  "IRS Updates",
  "Small Business",
  "Tax Deductions",
  "Crypto & Investments",
  "Retirement & Planning",
] as const;

export function BlogsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Read ?q= and ?category= after mount so the full article list is server-rendered for crawlers.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const category = params.get("category");
    if (q) setSearchQuery(q);
    if (category) setSelectedCategory(category);
  }, []);

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
    <div>
      <section className="border-b border-paper-line">
        <div className="site-container grid gap-10 pb-12 pt-14 md:pb-16 md:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">Articles</p>
            <h1 className="mt-5 font-display text-[40px] font-normal leading-[1.08] text-ink sm:text-[54px] lg:text-[64px]">
              Notes on tax, from the people who file it.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft">
              New IRS rules, business structure, deductions people miss, and what to do about them. Written by our CPAs.
            </p>
          </div>

          <div className="lg:col-span-5 lg:self-end">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                aria-label="Search articles"
                placeholder="Search articles"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field h-12 pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px]">
              <span className="text-ink-muted">Popular:</span>
              {TRENDING_SEARCH_TERMS.slice(0, 4).map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingClick(term)}
                  className="text-ink-soft underline decoration-paper-line underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-container py-12 lg:py-16">
        <div className="flex flex-col gap-4 border-b border-paper-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-[3px] px-3 py-1.5 text-[14px] transition-colors ${
                    isSelected ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[13.5px] text-ink-muted">
            <span>
              {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
              {searchQuery && <> matching &ldquo;{searchQuery}&rdquo;</>}
            </span>
            {(searchQuery || selectedCategory !== "All") && (
              <button onClick={handleResetFilters} className="text-ink underline underline-offset-4">
                Reset
              </button>
            )}
          </div>
        </div>

        {featuredPost && (
          <Link
            href={`/blogs/${featuredPost.slug}`}
            className="group grid gap-6 border-b border-paper-line py-12 lg:grid-cols-12 lg:gap-10"
          >
            <div className="lg:col-span-8">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-brass-dark">
                Latest · {featuredPost.category}
              </p>
              <h2 className="mt-4 font-display text-[32px] leading-[1.12] text-ink transition-colors group-hover:text-brass-dark sm:text-[42px]">
                {featuredPost.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-ink-soft">{featuredPost.excerpt}</p>
            </div>
            <div className="flex flex-col justify-end gap-1 text-[14px] text-ink-muted lg:col-span-4 lg:items-end lg:text-right">
              <span className="font-semibold text-ink">{featuredPost.author.name}</span>
              <span>
                {featuredPost.date} · {featuredPost.readTime}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-ink">
                Read the article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        {filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <article key={post.id} className="flex flex-col border-b border-paper-line py-8 md:pr-8">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-muted">
                  {post.category} · {post.readTime}
                </p>
                <Link href={`/blogs/${post.slug}`} className="group">
                  <h3 className="mt-3 font-display text-[23px] leading-snug text-ink transition-colors group-hover:text-brass-dark">
                    {post.title}
                  </h3>
                </Link>
                <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-muted">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="text-[12.5px] text-ink-muted hover:text-ink"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                <p className="mt-auto pt-5 text-[13.5px] text-ink-muted">
                  {post.author.name} · {post.date}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-display text-[28px] text-ink">Nothing matches that yet.</p>
            <p className="mt-3 text-[15px] text-ink-muted">
              Try a different word, or{" "}
              <button onClick={handleResetFilters} className="link-under">
                see all articles
              </button>
              .
            </p>
          </div>
        )}
      </section>

      <ClosingCta
        title="Wondering how this applies to you?"
        body="Articles cover the general rule. A CPA can tell you what it means for your return or your business."
        secondary={{ href: "/services", label: "See our services" }}
      />
    </div>
  );
}
