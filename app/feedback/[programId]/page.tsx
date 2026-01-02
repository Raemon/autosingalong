import { use } from 'react';
import { ProgramFeedback } from "../ProgramFeedback";

const ProgramFeedbackPage = ({params}:{params:Promise<{programId:string}>}) => {
  const { programId } = use(params);
  return <ProgramFeedback initialProgramId={programId} />;
};

export default ProgramFeedbackPage;
