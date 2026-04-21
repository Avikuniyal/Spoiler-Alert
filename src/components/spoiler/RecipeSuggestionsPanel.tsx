'use client';

import { Recipe, RecipeDetail } from '@/types/pantry';
import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import { fetchRecipeDetails } from '@/app/recipe-actions';

interface RecipeSuggestionsPanelProps {
  recipes: Recipe[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-[10px] overflow-hidden animate-pulse">
      <div className="h-32 bg-white/[0.04]" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-white/[0.06] rounded w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-white/[0.04] rounded-full w-16" />
          <div className="h-5 bg-white/[0.04] rounded-full w-20" />
        </div>
        <div className="h-8 bg-white/[0.04] rounded-[7px] w-full mt-1" />
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);

  const handleToggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail && !detailLoading && !detailFailed) {
      setDetailLoading(true);
      const d = await fetchRecipeDetails(recipe.id);
      if (d) {
        setDetail(d);
      } else {
        setDetailFailed(true);
      }
      setDetailLoading(false);
    }
  };

  const ingredients = detail ? detail.ingredients : recipe.allIngredients;

  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-200 hover:border-white/[0.15]">
      {/* Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
        {detail && detail.cookTime > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
            <Clock size={10} className="text-white/60" />
            <span className="font-crimson text-xs text-white/60">{detail.cookTime} min</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-playfair text-base font-semibold text-white leading-tight">
          {recipe.title}
        </h3>

        {/* Matched ingredients */}
        {recipe.matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.matchedIngredients.map(ing => (
              <span
                key={ing}
                className="px-2 py-0.5 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-full text-xs font-crimson text-[#0D9488]"
              >
                {ing}
              </span>
            ))}
          </div>
        )}

        {/* Expanded section */}
        {expanded && (
          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-3">
            {detailLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin border-t-transparent border-2 rounded-full w-4 h-4 border-[#0D9488]" />
              </div>
            )}

            {detailFailed && (
              <p className="font-crimson text-sm text-white/40 text-center py-2">
                Couldn&apos;t load recipe details
              </p>
            )}

            {!detailLoading && !detailFailed && ingredients.length > 0 && (
              <div>
                <p className="font-crimson text-xs text-white/40 uppercase tracking-wider mb-2">
                  Ingredients
                </p>
                <ul className="flex flex-col gap-1">
                  {ingredients.map((ing, idx) => {
                    const isMatched = recipe.matchedIngredients.some(m =>
                      ing.toLowerCase().includes(m.toLowerCase()),
                    );
                    return (
                      <li
                        key={idx}
                        className="font-crimson text-sm text-white/70 flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#0D9488]/60 flex-shrink-0" />
                        <span className={isMatched ? 'text-[#0D9488]' : ''}>{ing}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {!detailLoading && !detailFailed && detail && detail.steps.length > 0 && (
              <div>
                <p className="font-crimson text-xs text-white/40 uppercase tracking-wider mb-2">
                  Steps
                </p>
                <ol className="flex flex-col gap-2">
                  {detail.steps.map((step, idx) => (
                    <li key={idx} className="font-crimson text-sm text-white/70 flex gap-2">
                      <span className="font-playfair text-[#0D9488] font-bold flex-shrink-0 text-xs mt-0.5">
                        {idx + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleToggle}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-[7px] bg-[#0D9488] text-white font-crimson text-sm font-medium hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(13,148,136,0.3)] transition-all duration-200"
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Close Recipe
            </>
          ) : (
            <>
              <Utensils size={14} />
              Cook This
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function RecipeSuggestionsPanel({
  recipes,
  loading = false,
}: RecipeSuggestionsPanelProps) {
  if (!loading && recipes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-playfair text-xl font-bold text-white">Recipe Suggestions</h2>
        <span className="font-crimson text-sm text-white/40">
          {loading ? 'Finding recipes…' : 'Based on your pantry'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          recipes.map((recipe, i) => (
            <div
              key={recipe.id}
              className="card-enter"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <RecipeCard recipe={recipe} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
