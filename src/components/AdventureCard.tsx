import React from 'react';

interface AdventureCardProps {
  date: string;
  weather: string;
  suggestion: string;
  location?: string;
  isToday?: boolean;
  isYesterday?: boolean;
}

const AdventureCard: React.FC<AdventureCardProps> = ({
  date,
  weather,
  suggestion,
  location = "Boston",
  isToday = false,
  isYesterday = false
}) => {
  // Determine the display date and text color
  const displayDate = isToday ? 'Today' : isYesterday ? 'Yesterday' : date;
  const dateColor = isToday ? 'text-blue-600' : 'text-gray-600';

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className={`font-bold ${dateColor}`}>{displayDate}</span>
        <div className="text-right">
          <span className="text-sm text-gray-500 block">{location}</span>
          <span className="text-sm text-gray-500 block">{weather}</span>
        </div>
      </div>
      <p>{suggestion}</p>
    </div>
  );
};

export default AdventureCard; 