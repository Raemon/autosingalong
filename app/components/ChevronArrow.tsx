const ChevronArrow = ({isExpanded, className}: {isExpanded: boolean, className?: string}) => {
  return (
    <span className={className}>
      {isExpanded ? '▼' : '▶'}
    </span>
  );
};

export default ChevronArrow;


