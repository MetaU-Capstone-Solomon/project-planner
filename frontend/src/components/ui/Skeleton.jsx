export default function Skeleton({ className = '', rounded = false }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  );
}
