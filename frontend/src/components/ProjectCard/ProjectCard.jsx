import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { getProjectDetailPath } from '@/constants/routes';
import { getProgressColor } from '@/constants/projectCard';
import { calculateOverallProgress } from '@/utils/roadmapUtils';
import { formatDate } from '@/utils/dateUtils';
import { COLOR_CLASSES } from '@/constants/colors';

/**
 * ProjectCard Component
 * 
 * Displays a roadmap project card with progress, metadata, and navigation.
 * 
 * Features:
 * - Parses JSON roadmap content to extract metadata and phases
 * - Calculates real-time progress using roadmap utilities
 * - Displays progress bar with dynamic color based on completion
 * - Provides click navigation to project detail page
 * - Handles missing or invalid roadmap data gracefully with null
 * 
 * 

 * @param {Object} props - Component props
 * @param {Object} props.project - Project data object
 * @param {string} props.project.id - Project unique identifier
 * @param {string} props.project.title - Project title
 * @param {string} props.project.content - Project roadmap content (JSON)
 * @param {string} props.project.created_at - Project creation date
 * @param {string} props.project.updated_at - Project last updated date
 */
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  // Parse roadmap content to get metadata and progress
  const getRoadmapData = () => {
    try {
      const parsed = JSON.parse(project.content);
      return {
        metadata: parsed.metadata,
        phases: parsed.phases,
        summary: parsed.summary,
      };
    } catch (error) {
      return null;
    }
  };

  const roadmapData = getRoadmapData();
  const progress = roadmapData?.phases ? calculateOverallProgress(roadmapData.phases) : 0;

  const handleCardClick = () => {
    navigate(getProjectDetailPath(project.id));
  };

  return (
    <div
      className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} cursor-pointer transition-shadow duration-200 hover:shadow-md`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg font-semibold ${COLOR_CLASSES.text.primary} truncate`}>
              {project.title}
            </h3>
          </div>
          <ArrowRight className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary} ml-2 flex-shrink-0`} />
        </div>

        {/* Summary */}
        {roadmapData?.summary && (
          <p className={`${COLOR_CLASSES.text.secondary} mb-4 line-clamp-2 text-sm`}>
            {roadmapData.summary}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-sm font-medium ${COLOR_CLASSES.text.secondary}`}>Progress</span>
            <span className={`text-sm font-semibold ${COLOR_CLASSES.text.primary}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {roadmapData?.metadata?.timeline && (
            <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>{roadmapData.metadata.timeline}</span>
            </div>
          )}

          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Updated {formatDate(project.updated_at || project.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
