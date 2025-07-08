import React from 'react';
import { Calendar, User, Target } from 'lucide-react';

/**
 * Summary Component
 * 
 * Displays project information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.metadata - Project metadata object
 * @param {string} props.metadata.title - Project title
 * @param {string} props.metadata.timeline - Project timeline
 * @param {string} props.metadata.experienceLevel - Developer experience level
 * @param {string} props.metadata.scope - Project scope
 * @param {string} props.summary - Project summary text
 */
const Summary = ({ metadata, summary }) => {
  if (!metadata) {
    return null;
  }

  const getExperienceColor = (level) => {
    const colors = {
      'Beginner': 'bg-green-100 text-green-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Advanced': 'bg-orange-100 text-orange-800',
      'Expert': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getScopeColor = (scope) => {
    const colors = {
      'MVP': 'bg-blue-100 text-blue-800',
      'Full-featured': 'bg-purple-100 text-purple-800',
      'Enterprise-level': 'bg-indigo-100 text-indigo-800'
    };
    return colors[scope] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Title and Summary Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{metadata.title}</h1>
        {summary && (
          <p className="text-gray-600 text-lg leading-relaxed">{summary}</p>
        )}
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <div className="text-sm text-gray-500">Timeline</div>
            <div className="font-medium text-gray-900">{metadata.timeline}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-green-600" />
          <div>
            <div className="text-sm text-gray-500">Experience</div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getExperienceColor(metadata.experienceLevel)}`}>
              {metadata.experienceLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-purple-600" />
          <div>
            <div className="text-sm text-gray-500">Scope</div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(metadata.scope)}`}>
              {metadata.scope}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary; 