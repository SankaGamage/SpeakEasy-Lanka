import React from 'react';
import { Topic } from '../types';
import { ChevronRight } from 'lucide-react';

interface TopicCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick }) => {
  return (
    <button
      onClick={() => onClick(topic)}
      className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow active:scale-[0.98] duration-150"
    >
      <div className="flex items-center space-x-4 text-left">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-2xl">
          {topic.emoji}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{topic.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{topic.description}</p>
        </div>
      </div>
      <div className="text-gray-300">
        <ChevronRight size={20} />
      </div>
    </button>
  );
};
