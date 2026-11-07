"use client";

import { useState } from "react";
import { HelpCircle, MessageCircleQuestion } from "lucide-react";
import type { Product, QAItem } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";

const SEED_QA: QAItem[] = [
  { id: "q1", author: "Rahul", question: "Is this available in medium size?", answer: "Yes, Medium is currently available.", date: "1 week ago" },
  { id: "q2", author: "Sneha", question: "What is the return policy?", answer: "You can return within 7 days of delivery.", date: "3 weeks ago" },
  { id: "q3", author: "Amit", question: "Is the quality good for the price?", date: "1 month ago" },
];

export function ProductQA({ product }: { product: Product }) {
  const { questions, addQuestion } = useStore();
  const [text, setText] = useState("");
  const userQA = questions[product.id] ?? [];
  const all = [...userQA, ...SEED_QA];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addQuestion(product.id, text.trim());
    setText("");
  };

  return (
    <div className="mt-5 sm:mt-6 rounded-lg border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-neutral-200 p-4 sm:px-5 sm:py-4">
        <HelpCircle size={18} />
        <h3 className="text-sm sm:text-base font-bold text-black">Questions & Answers</h3>
        <span className="ml-auto text-xs sm:text-sm text-neutral-400">({all.length})</span>
      </div>

      <form onSubmit={submit} className="border-b border-neutral-100 p-4 sm:px-5 sm:py-4">
        <label className="mb-1.5 block text-xs sm:text-sm font-medium text-black">
          Ask a question
        </label>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Ask about ${product.name}...`}
            className="h-10 sm:h-11 w-full rounded-md border border-neutral-300 px-3 text-xs sm:text-sm outline-none focus:border-black"
          />
          <Button type="submit" size="sm" className="h-10 sm:h-11 shrink-0 px-4 text-xs sm:text-sm touch-manipulation" disabled={!text.trim()}>
            Post
          </Button>
        </div>
      </form>

      <div className="divide-y divide-neutral-100">
        {all.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-500">No questions yet. Ask the first one!</p>
        )}
        {all.map((q) => (
          <div key={q.id} className="p-4 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2.5">
              <MessageCircleQuestion size={16} className="mt-0.5 shrink-0 text-neutral-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-black">
                  Q: {q.question}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-xs font-normal text-neutral-400">
                  {q.author} · {q.date}
                </p>
                {q.answer ? (
                  <p className="mt-1.5 border-l-2 border-neutral-200 pl-2.5 sm:pl-3 text-xs sm:text-sm text-neutral-600">A: {q.answer}</p>
                ) : (
                  <p className="mt-1.5 border-l-2 border-neutral-200 pl-2.5 sm:pl-3 text-xs text-neutral-400">Waiting for an answer...</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
