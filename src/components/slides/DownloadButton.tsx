const DownloadButton = ({onClick, fileName}:{onClick: () => void, fileName: string}) => {
  return (
    <div className="mt-4">
      <button onClick={onClick} className="px-4 py-2 text-sm cursor-pointer w-full bg-green-600 text-white border-none hover:bg-green-700">
        <span>Download {fileName}</span>
      </button>
    </div>
  );
};

export default DownloadButton;

