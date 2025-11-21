const GenerateButton = ({onClick, disabled, isGenerating}:{onClick: () => void, disabled: boolean, isGenerating: boolean}) => {
  return (
    <div className="mt-4">
      <button onClick={onClick} disabled={disabled} className="px-4 py-2 text-sm cursor-pointer w-full disabled:opacity-60 disabled:cursor-not-allowed bg-black text-white border-none">
        <span>{isGenerating ? 'Generating...' : 'Generate Presentation'}</span>
      </button>
    </div>
  );
};

export default GenerateButton;

