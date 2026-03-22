"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

export function MarketplaceReviewForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    setSubmitting(true);
    try {
      await csrfFetch<{ review: { id: string } }>(`/api/marketplace/${slug}/reviews`, {
        method: "POST",
        body: {
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        },
      });
      toast.success("Review submitted.");
      setRating(5);
      setTitle("");
      setBody("");
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to submit review.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Write a Review</h3>
        <p className="text-sm text-muted-foreground">Share your experience with this business.</p>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const active = value <= rating;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-md p-1 transition-transform hover:scale-105"
              aria-label={`Rate ${value} stars`}
            >
              <Star
                className={`h-5 w-5 ${active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            </button>
          );
        })}
      </div>

      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Review title"
      />
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What stood out about this business?"
      />
      <Button type="button" disabled={submitting} onClick={() => void submitReview()}>
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
