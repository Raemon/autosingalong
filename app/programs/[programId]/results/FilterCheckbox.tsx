'use client';

import Tooltip from '@/app/components/Tooltip';

const FilterCheckbox = ({checked, onChange, label, tooltip}:{checked: boolean, onChange: () => void, label: string, tooltip?: string}) => {
  const checkbox = (
    <label className={`flex items-center gap-2 cursor-pointer ${checked ? 'text-white' : 'text-gray-500'}`} onClick={onChange}>
      <span className={`text-lg ${checked ? 'text-white' : 'text-gray-500'}`}>{checked ? '☑' : '☐'}</span>
      <span>{label}</span>
    </label>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{checkbox}</Tooltip>;
  }

  return checkbox;
};

export default FilterCheckbox;
