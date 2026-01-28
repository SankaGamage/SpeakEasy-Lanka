import React from 'react';
import { AppView } from '../types';
import { Home, Mic, BarChart3, User } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  inSession: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, inSession }) => {
  if (inSession) return null; // Hide nav during active call

  const navItems = [
    { view: AppView.HOME, icon: Home, label: 'Practice' },
    { view: AppView.PROGRESS, icon: BarChart3, label: 'Progress' },
    // { view: AppView.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center w-16 space-y-1 ${
                isActive ? 'text-teal-600' : 'text-gray-400'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
