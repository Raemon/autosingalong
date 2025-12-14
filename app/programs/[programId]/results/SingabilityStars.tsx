'use client';

import Tooltip from '@/app/components/Tooltip';

const Star = ({fill}:{fill: number}) => {
  const clampedFill = Math.max(0, Math.min(1, fill));
  const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.369 2.448a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.05 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z";

  return (
    <span className="relative inline-block w-3 h-3" aria-hidden="true">
      <svg viewBox="0 0 20 20" className="absolute inset-0 w-3 h-3" style={{color:'#6b7280'}}>
        <path d={starPath} fill="currentColor" />
      </svg>
      <span className="absolute inset-0 overflow-hidden block" style={{width: `${clampedFill * 100}%`}}>
        <svg viewBox="0 0 20 20" className="w-3 h-3" style={{color:'#fff'}}>
          <path d={starPath} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
};

const SingabilityStars = ({value, max=3}:{value: number, max?: number}) => {
  const tooltip = `${value.toFixed(2)}`;
  return (
    <Tooltip content={tooltip} placement="top" inlineBlock>
      <span className="inline-flex items-center justify-center gap-0.5">
        {Array.from({length: max}).map((_, i) => (
          <Star key={i} fill={value - i} />
        ))}
      </span>
    </Tooltip>
  );
};

export default SingabilityStars;
