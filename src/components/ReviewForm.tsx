"use client";

import { useActionState, useState } from "react";
import { saveReview } from "@/modules/reviews/actions";
import type { FormState } from "@/lib/forms";

const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ treeId, initial }: { treeId: string; initial?: { rating: number; comment: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveReview, {});
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="treeId" value={treeId} />
      <fieldset>
        <legend className="text-sm font-medium text-forest-900">Your rating</legend>
        <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="star-pick cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
              <svg viewBox="0 0 20 20" className={`h-8 w-8 transition ${n <= shown ? "scale-110 text-amber-400" : "text-stone-200"}`} fill="currentColor" aria-hidden="true">
                <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
              </svg>
            </label>
          ))}
          <span className="ml-2 text-sm text-stone-500">{WORDS[shown]}</span>
        </div>
        {state.errors?.rating && <p className="field-error">{state.errors.rating}</p>}
      </fieldset>
      <div>
        <label htmlFor="review-comment" className="text-sm font-medium text-forest-900">Your comment <span className="font-normal text-stone-400">(optional)</span></label>
        <textarea id="review-comment" name="comment" rows={3} maxLength={1000} defaultValue={initial?.comment} placeholder="How is it growing? Was the sapling healthy when it arrived?" className="input mt-1" />
        {state.errors?.comment && <p className="field-error">{state.errors.comment}</p>}
      </div>
      {state.message && <p role="status" className={`text-sm ${state.ok ? "text-forest-700" : "text-red-700"}`}>{state.message}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving..." : initial ? "Update review" : "Post review"}</button>
    </form>
  );
}
