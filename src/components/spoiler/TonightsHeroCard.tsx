'use client';

import { Recipe, PantryItem, getUrgency } from '@/types/pantry';
import { useState } from 'react';
import { Flame, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface TonightsHeroCardProps {
  recipe: Recipe;
  redItems: PantryItem[];
}

export default function TonightsHeroCard({ recipe, redItems }: TonightsHeroCardProps) {
  const [expanded, setExpanded] = useState(false);

  const redNames = redItems.map(i => i.name.toLowerCase());

  const isMatchedByRedItem = (ingredient: string) =>
    redNames.some(
      name =>
        ingredient.toLowerCase().includes(name) || name.includes(ingredient.toLowerCase()),
    );

  const urgentLabel =
    redItems.length === 1
      ? `${redItems[0].name} ${getUrgency(redItems[0].expiry_date).label.toLowerCase()}`
      : `${redItems.length} items expire today or tomorrow`;

  return (
    <div className="bg-[#111111] border border-red-500/25 rounded-[10px] shadow-[0_0_24px_rgba(239,68,68,0.07)] overflow-hidden card-enter">
      {/* Banner */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0">
        <Flame size={13} className="text-red-400 flex-shrink-0" />
        <span className="font-crimson text-xs text-red-400 uppercase tracking-widest">
          Cook Tonight
        </span>
      </div>

      {/* Body */}
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-[88px] h-[88px] flex-shrink-0 rounded-[7px] overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <h3 className="font-playfair text-white font-semibold text-base leading-tight">
              {recipe.title}
            </h3>
            <p className="font-crimson text-xs text-red-400/60 mt-0.5">{urgentLabel}</p>
          </div>

          {recipe.matchedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.matchedIngredients.map(ing => (
                <span
                  key={ing}
                  className={`px-2 py-0.5 rounded-full text-xs font-crimson border ${
                    isMatchedByRedItem(ing)
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-white/[0.04] border-white/10 text-white/40'
                  }`}
                >
                  {ing}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-red-500/10 border border-red-500/25 text-red-400 font-crimson text-sm hover:bg-red-500/20 transition-all duration-200"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Close' : 'View Recipe'}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 flex flex-col gap-3">
          {recipe.allIngredients.length > 0 && (
            <div>
              <p className="font-crimson text-xs text-white/40 uppercase tracking-wider mb-2">
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recipe.allIngredients.map(ing => (
                  <span
                    key={ing}
                    className={`px-2 py-0.5 rounded-full text-xs font-crimson border ${
                      isMatchedByRedItem(ing)
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-white/[0.04] border-white/10 text-white/50'
                    }`}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {recipe.steps.length > 0 ? (
            <div>
              <p className="font-crimson text-xs text-white/40 uppercase tracking-wider mb-2">
                Steps
              </p>
              <ol className="flex flex-col gap-1.5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 font-crimson text-sm text-white/70">
                    <span className="font-playfair text-red-400 font-bold text-xs flex-shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-crimson text-sm text-red-400/60 hover:text-red-400 transition-colors duration-200"
            >
              <ExternalLink size={13} />
              View full recipe on Spoonacular
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
