import React from 'react';
import { Calendar, User, Target } from 'lucide-react';
import {
  COLOR_CLASSES,
  COLOR_PATTERNS,
  getExperienceColor,
  getScopeColor,
} from '../../constants/colors';

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
    <div className={`${COLOR_PATTERNS.landing.card}`}>
      {/* Title and Summary Section */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${COLOR_CLASSES.text.heading} mb-3`}>
          {metadata.title}
        </h1>
        {summary && (
          <p className={`${COLOR_CLASSES.text.body} text-lg leading-relaxed`}>{summary}</p>
        )}
      </div>

      {/* Project Details - Horizontal on mobile, Grid on larger screens */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex min-w-0 flex-1 items-center space-x-2">
          <Calendar className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <div className={`text-sm ${COLOR_CLASSES.text.body}`}>Timeline</div>
            <div className={`font-medium ${COLOR_CLASSES.text.heading} truncate`}>
              {metadata.timeline}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center space-x-2">
          <User className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <div className={`text-sm ${COLOR_CLASSES.text.body}`}>Experience</div>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getExperienceColor(metadata.experienceLevel).bg} ${getExperienceColor(metadata.experienceLevel).text}`}
            >
              {metadata.experienceLevel}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center space-x-2">
          <Target className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <div className={`text-sm ${COLOR_CLASSES.text.body}`}>Scope</div>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getScopeColor(metadata.scope).bg} ${getScopeColor(metadata.scope).text}`}
            >
              {metadata.scope}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
