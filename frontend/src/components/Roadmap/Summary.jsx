import React from 'react';
import { Calendar, User, Target } from 'lucide-react';
import { COLOR_CLASSES, getExperienceColor, getScopeColor } from '../../constants/colors';

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

  return (
    <div className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} p-6 mb-6`}>
      {/* Title and Summary Section */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${COLOR_CLASSES.text.primary} mb-3`}>{metadata.title}</h1>
        {summary && (
          <p className={`${COLOR_CLASSES.text.secondary} text-lg leading-relaxed`}>{summary}</p>
        )}
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-status-info-main" />
          <div>
            <div className={`text-sm ${COLOR_CLASSES.text.tertiary}`}>Timeline</div>
            <div className={`font-medium ${COLOR_CLASSES.text.primary}`}>{metadata.timeline}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-status-success-main" />
          <div>
            <div className={`text-sm ${COLOR_CLASSES.text.tertiary}`}>Experience</div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getExperienceColor(metadata.experienceLevel).bg} ${getExperienceColor(metadata.experienceLevel).text}`}>
              {metadata.experienceLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-primary-600" />
          <div>
            <div className={`text-sm ${COLOR_CLASSES.text.tertiary}`}>Scope</div>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getScopeColor(metadata.scope).bg} ${getScopeColor(metadata.scope).text}`}>
              {metadata.scope}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary; 