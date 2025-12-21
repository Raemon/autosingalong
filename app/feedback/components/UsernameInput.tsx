'use client';

import Tooltip from '@/app/components/Tooltip';
import { useUser } from '../../contexts/UserContext';

const UsernameInput = ({lightMode = false}: {lightMode?: boolean}) => {
  const { userName, setUserName, user } = useUser();
  console.log(user);
  const containerClasses = lightMode
    ? "flex items-center border border-gray-300 rounded-md pl-2 sm:py-1 mb-2 sm:mb-0"
    : "flex items-center border border-gray-700 rounded-md pl-2 sm:py-1 mb-2 sm:mb-0";
  const inputClasses = lightMode
    ? "px- py-1 bg-white text-black w-[75px] sm:w-auto text-sm border-none radius-sm focus:outline-none"
    : "px- py-1 bg-black w-[75px] sm:w-auto text-sm border-none radius-sm focus:outline-none";
  return (
    <Tooltip content={"Edit your username"} placement="bottom">  
      <div className={containerClasses}>
        <span className="mr-2 saturate-0" aria-label="user" role="img">👤</span>
        <input
            id="username-input"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className={inputClasses}
          />
      </div>
    </Tooltip>
  );
};

export default UsernameInput;
