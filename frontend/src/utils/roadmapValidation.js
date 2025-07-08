/**
 * Roadmap Validation Utility using Zod
 * 
 * Validates AI-generated roadmap JSON structure before saving to database.
 * Handles markdown code block stripping and schema validation
 * prevent unexpected data from being stored.
 * 
 * @module roadmapValidation
 * @requires zod
 * @requires @/constants/messages
 * @requires @/constants/roadmap
 */

import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';

/**
 * Zod schema definitions for roadmap validation
 * 
 * Each schema defines the structure and validation rules for different
 * components of the roadmap data structure.
 */

/**
 * Resource schema for learning materials and tools
 * @type {z.ZodObject}
 */
const ResourceSchema = z.object({
  name: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  url: z.string().optional() // AI provides URLs, but they might not always be valid
});

/**
 * Task schema for individual project tasks
 * @type {z.ZodObject}
 */
const TaskSchema = z.object({
  id: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  title: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  description: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  resources: z.array(ResourceSchema).default([]),
  status: z.string().default('pending'), // AI always sets to "pending"
  estimatedHours: z.union([z.string().min(1), z.number().positive()]).transform(val => 
    typeof val === 'number' ? val.toString() : val
  )
});

/**
 * Milestone schema for project milestones
 * @type {z.ZodObject}
 */
const MilestoneSchema = z.object({
  id: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  title: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  timeline: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  order: z.number(), // AI provides numbers, no need for positive integer validation
  tasks: z.array(TaskSchema).min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE)
});

/**
 * Phase schema for project phases
 * @type {z.ZodObject}
 */
const PhaseSchema = z.object({
  id: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  title: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  timeline: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  order: z.number(), // AI provides numbers, no need for positive integer validation
  milestones: z.array(MilestoneSchema).min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE)
});

/**
 * Metadata schema for project information
 * @type {z.ZodObject}
 */
const MetadataSchema = z.object({
  title: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  description: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  timeline: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  experienceLevel: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  technologies: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  scope: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  version: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE)
});

/**
 * Main roadmap schema that validates the complete roadmap structure
 * @type {z.ZodObject}
 */
const RoadmapSchema = z.object({
  metadata: MetadataSchema,
  summary: z.string().min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE),
  phases: z.array(PhaseSchema).min(1, MESSAGES.VALIDATION.ROADMAP_INCOMPLETE)
});

/**
 * Strips markdown code blocks from content
 * 
 * Removes markdown formatting from AI responses that wrap JSON in code blocks.
 * AI consistently uses ```json format for JSON responses so I strip it 
 * 
 * @param {string} content - Content that may contain markdown code blocks
 * @returns {string} Content with markdown code blocks removed
 */
const stripMarkdownCodeBlocks = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  return content
    .replace(/^```json\s*\n?/i, '')  // Remove opening ```json
    .replace(/\n?```\s*$/i, '')      // Remove closing ```
    .trim();
};

/**
 * Validates AI-generated roadmap JSON content
 * 
 * Performs comprehensive validation of roadmap data including:
 * Markdown code block stripping
 * JSON parsing validation
 * Schema structure validation using Zod
 * 
 * @param {string} content - Raw AI response content that may contain markdown
 * @returns {Object} Validation result object
 * @returns {boolean} returns.isValid - Whether the content passed all validations
 * @returns {string[]} returns.errors - Array of validation error messages
 * @returns {string[]} returns.warnings - Array of validation warning messages
 */
export const validateRoadmapContent = (content) => {
  const result = {
    isValid: false,
    errors: [],
    warnings: []
  };

  if (!content || typeof content !== 'string') {
    result.errors.push(MESSAGES.VALIDATION.ROADMAP_INCOMPLETE);
    return result;
  }

  // Strip markdown code blocks
  const cleanedContent = stripMarkdownCodeBlocks(content);

  // Validate JSON parsing
  let parsedContent;
  try {
    parsedContent = JSON.parse(cleanedContent);
  } catch (error) {
    result.errors.push(`${MESSAGES.VALIDATION.INVALID_ROADMAP_CONTENT}: ${error.message}`);
    return result;
  }

  // Validate with Zod schema
  const validationResult = RoadmapSchema.safeParse(parsedContent);
  
  if (!validationResult.success) {
    // Convert Zod errors to proper format
    result.errors = validationResult.error.issues.map(issue => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });
  } else {
    result.isValid = true;
  }

  return result;
};

/**
 *error message for validation failures
 * 
 * Converts technical validation errors into user-readable messages.
 * Limits the number of errors shown to avoid overwhelming the user.
 * 
 * @param {Object} validationResult - Result from validateRoadmapContent
 * @param {boolean} validationResult.isValid - Whether validation passed
 * @param {string[]} validationResult.errors - Array of validation errors
 * @param {string[]} validationResult.warnings - Array of validation warnings
 * @returns {string|null} error message or null if validation passed
 */
export const getValidationErrorMessage = (validationResult) => {
  if (validationResult.isValid) {
    return null;
  }

  if (validationResult.errors.length === 0) {
    return MESSAGES.VALIDATION.ROADMAP_INCOMPLETE;
  }

  //  validation message 
  return MESSAGES.VALIDATION.ROADMAP_VALIDATION_FAILED;
}; 