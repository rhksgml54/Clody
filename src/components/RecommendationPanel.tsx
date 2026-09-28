
import React from 'react';
// FIX: Implement the RecommendationPanel component to display AI-generated outfit suggestions.
import type { PageData, ClothingItem } from '../types';

interface RecommendationPanelProps {
  pageData: PageData;
}

const ItemCard: React.FC<{ item: ClothingItem; category: string }> = ({ item, category }) => (
    <div className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
        <img src={item.image_path} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
        <div className="flex-1">
            <p className="text-xs font-bold uppercase text-yellow-300">{category}</p>
            <p className="text-sm font-semibold text-white">{item.name}</p>
            <p className="text-xs text-gray-400">{`${item.color} | ${item.pattern} | ${item.material}`}</p>
        </div>
    </div>
);

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ pageData }) => {
  // FIX: Property 'reason' does not exist on type 'PageData'. Removed it from destructuring.
  const { recommendation, tpo } = pageData;
  const recommendedItems = Object.entries(recommendation).filter(([, item]) => item) as [string, ClothingItem][];
  
  return (
    <div className="text-white space-y-4">
        <div>
            <h2 className="text-lg font-bold text-yellow-300">{tpo ? `For your ${tpo.toLowerCase()} occasion` : "Today's OOTD Recommendation"}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedItems.map(([category, item]) => (
                <ItemCard key={`${category}-${item.name}`} item={item} category={category} />
            ))}
        </div>
    </div>
  );
};
