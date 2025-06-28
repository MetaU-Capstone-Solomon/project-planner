// Configuration constants for text processing
const DEFAULT_TARGET_LENGTH = parseInt(process.env.DEFAULT_TARGET_LENGTH) || 1500;
const MAX_SENTENCES = parseInt(process.env.MAX_SENTENCES) || 500;

// Keywords for intelligent summarization
const IMPORTANT_KEYWORDS = [
  'project',
  'goal',
  'objective',
  'target',
  'aim',
  'purpose',
  'requirement',
  'specification',
  'feature',
  'functionality',
  'timeline',
  'deadline',
  'milestone',
  'deliverable',
  'budget',
  'cost',
  'resource',
  'team',
  'stakeholder',
  'risk',
  'challenge',
  'constraint',
  'assumption',
  'success',
  'outcome',
  'result',
  'impact',
  'technology',
  'tool',
  'platform',
  'framework',
  'methodology',
  'approach',
  'strategy',
  'plan',
];

// Keywords that indicate less important content
const LESS_IMPORTANT_KEYWORDS = [
  'example',
  'instance',
  'case',
  'scenario',
  'background',
  'context',
  'overview',
  'introduction',
  'conclusion',
  'summary',
  'wrap-up',
  'note',
  'remark',
  'comment',
  'aside',
  'optional',
  'additional',
  'extra',
  'bonus',
];

module.exports = {
  IMPORTANT_KEYWORDS,
  LESS_IMPORTANT_KEYWORDS,
  DEFAULT_TARGET_LENGTH,
  MAX_SENTENCES,
};
