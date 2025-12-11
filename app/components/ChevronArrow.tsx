const ChevronArrow = ({isExpanded, className, onClick}: {isExpanded: boolean, className?: string, onClick?: () => void}) => {
  return (
    <span className={className} onClick={onClick}>
      {isExpanded ? '▼' : '▶'}
    </span>
  );
};

export default ChevronArrow;


