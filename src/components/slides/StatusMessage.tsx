import { StatusType } from './types';

const StatusMessage = ({message, type}:{message: string, type: StatusType}) => {
  if (!type || !message) return null;
  
  return (
    <div className="mt-4 px-2 py-1 text-xs border-l-2 border-black">
      {message}
    </div>
  );
};

export default StatusMessage;

