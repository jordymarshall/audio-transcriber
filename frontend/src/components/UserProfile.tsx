import React, { useState } from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionStatus = () => {
    if (user.subscription_active) {
      return {
        text: `Active until ${formatDate(user.subscription_end)}`,
        color: 'text-green-600',
        bg: 'bg-green-50'
      };
    } else if (!user.has_used_free_transcription) {
      return {
        text: 'Free transcription available',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      };
    } else {
      return {
        text: 'Subscription needed',
        color: 'text-amber-600',
        bg: 'bg-amber-50'
      };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <img 
          src={user.picture} 
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="text-left hidden sm:block">
          <p className="font-medium text-gray-900 truncate max-w-32">{user.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-32">{user.transcription_count} transcriptions</p>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <img 
                src={user.picture} 
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Subscription Status */}
            <div className={`${subscriptionStatus.bg} rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Subscription</span>
                <span className={`text-xs font-medium ${subscriptionStatus.color}`}>
                  {subscriptionStatus.text}
                </span>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Total Transcriptions</span>
                <span className="text-sm font-bold text-blue-600">
                  {user.transcription_count}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setShowDropdown(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default UserProfile; 