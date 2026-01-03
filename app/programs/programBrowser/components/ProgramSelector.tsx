import ChevronDropdown from '@/app/components/ChevronDropdown';
import type { Program } from '../../types';
import { useUser } from '@/app/contexts/UserContext';
import { handleCreateProgram } from './NewProgramButton';

const CREATE_PROGRAM_VALUE = '__create_program__';

const ProgramSelector = ({programs, selectedProgramId, onSelect, onProgramCreated}: {programs: Array<Program & { isSubprogram: boolean }>, selectedProgramId: string | null, onSelect: (id: string | null) => void, onProgramCreated?: (program: Program) => void}) => {
  const selectedProgram = programs.find(p => p.id === selectedProgramId);
  const availablePrograms = programs.filter((p) => !p.isSubprogram || p.id === selectedProgramId);
  const options = availablePrograms.map(p => ({value: p.id, label: p.title}));
  
  const { userName, canEdit } = useUser();
  if (userName && canEdit) {
    options.push({value: CREATE_PROGRAM_VALUE, label: 'Create program...'});
  }
  
  return (
    <div className="flex items-center gap-1">
      {selectedProgram && (
        <div className="text-4xl mb-1" style={{fontFamily: 'Georgia, serif'}}>
          {selectedProgram.title}
        </div>
      )}
      <ChevronDropdown
        value={selectedProgramId}
        options={options}
        onChange={async (id) => {
          if (id === CREATE_PROGRAM_VALUE) {
            await handleCreateProgram(userName, onProgramCreated, onSelect);
            return;
          }
          onSelect(id);
        }}
        placeholder="Select a program"
      />
    </div>
  );
};

export default ProgramSelector;

