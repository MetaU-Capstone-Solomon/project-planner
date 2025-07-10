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
        summary: parsed.summary
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
      className={`${COLOR_CLASSES.surface.card} rounded-lg shadow-sm ${COLOR_CLASSES.border.primary} hover:shadow-md transition-shadow duration-200 cursor-pointer`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${COLOR_CLASSES.text.primary} truncate`}>
              {project.title}
            </h3>
          </div>
          <ArrowRight className={`h-5 w-5 ${COLOR_CLASSES.text.tertiary} flex-shrink-0 ml-2`} />
        </div>

        {/* Summary */}
        {roadmapData?.summary && (
          <p className={`${COLOR_CLASSES.text.secondary} text-sm mb-4 line-clamp-2`}>
            {roadmapData.summary}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${COLOR_CLASSES.text.secondary}`}>Progress</span>
            <span className={`text-sm font-semibold ${COLOR_CLASSES.text.primary}`}>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
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
              <Calendar className="h-4 w-4 mr-2" />
              <span>{roadmapData.metadata.timeline}</span>
            </div>
          )}
          
          <div className={`flex items-center text-sm ${COLOR_CLASSES.text.secondary}`}>
            <Clock className="h-4 w-4 mr-2" />
            <span>Updated {formatDate(project.updated_at || project.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 