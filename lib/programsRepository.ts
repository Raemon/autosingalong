import sql from './db';

type ProgramRow = {
  id: string;
  title: string;
  element_ids: string[] | null;
  program_ids: string[] | null;
  created_by: string | null;
  created_at: string;
  archived: boolean;
  is_subprogram: boolean;
  video_url: string | null;
  print_program_foreword: string | null;
  print_program_epitaph: string | null;
  locked: boolean;
};

export type ProgramRecord = {
  id: string;
  title: string;
  elementIds: string[];
  programIds: string[];
  createdBy: string | null;
  createdAt: string;
  archived: boolean;
  isSubprogram: boolean;
  videoUrl: string | null;
  printProgramForeword: string | null;
  printProgramEpitaph: string | null;
  locked: boolean;
};

const mapProgramRow = (row: ProgramRow): ProgramRecord => ({
  id: row.id,
  title: row.title,
  elementIds: row.element_ids ?? [],
  programIds: row.program_ids ?? [],
  createdBy: row.created_by,
  createdAt: row.created_at,
  archived: row.archived,
  isSubprogram: row.is_subprogram,
  videoUrl: row.video_url,
  printProgramForeword: row.print_program_foreword,
  printProgramEpitaph: row.print_program_epitaph,
  locked: row.locked,
});

export const listPrograms = async (): Promise<ProgramRecord[]> => {
  const rows = await sql`
    with latest_versions as (
      select distinct on (program_id) *
      from program_versions
      order by program_id, created_at desc
    )
    select p.id, lv.title, lv.element_ids, lv.program_ids, lv.created_by, lv.created_at, lv.archived, lv.is_subprogram, lv.video_url, lv.print_program_foreword, lv.print_program_epitaph, lv.locked
    from programs p
    join latest_versions lv on lv.program_id = p.id
    where lv.archived = false
    order by lv.created_at desc
  `;
  return (rows as ProgramRow[]).map(mapProgramRow);
};

export const createProgram = async (title: string, createdBy?: string | null, isSubprogram?: boolean, locked?: boolean, createdAt?: string): Promise<ProgramRecord> => {
  const rows = createdAt
    ? await sql`
        insert into programs (title, created_by, is_subprogram, locked, created_at)
        values (${title}, ${createdBy ?? null}, ${isSubprogram ?? false}, ${locked ?? false}, ${createdAt})
        returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
      `
    : await sql`
        insert into programs (title, created_by, is_subprogram, locked)
        values (${title}, ${createdBy ?? null}, ${isSubprogram ?? false}, ${locked ?? false})
        returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
      `;
  return mapProgramRow((rows as ProgramRow[])[0]!);
};

export const getProgramById = async (programId: string): Promise<ProgramRecord | null> => {
  const rows = await sql`
    with latest_versions as (
      select distinct on (program_id) *
      from program_versions
      order by program_id, created_at desc
    )
    select p.id, lv.title, lv.element_ids, lv.program_ids, lv.created_by, lv.created_at, lv.archived, lv.is_subprogram, lv.video_url, lv.print_program_foreword, lv.print_program_epitaph, lv.locked
    from programs p
    join latest_versions lv on lv.program_id = p.id
    where p.id = ${programId} and lv.archived = false
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    return null;
  }
  return mapProgramRow(typedRows[0]);
};

export const getProgramByTitle = async (title: string): Promise<ProgramRecord | null> => {
  const rows = await sql`
    with latest_versions as (
      select distinct on (program_id) *
      from program_versions
      order by program_id, created_at desc
    )
    select p.id, lv.title, lv.element_ids, lv.program_ids, lv.created_by, lv.created_at, lv.archived, lv.is_subprogram, lv.video_url, lv.print_program_foreword, lv.print_program_epitaph, lv.locked
    from programs p
    join latest_versions lv on lv.program_id = p.id
    where LOWER(lv.title) = LOWER(${title}) and lv.archived = false
    limit 1
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    return null;
  }
  return mapProgramRow(typedRows[0]);
};

export const updateProgramElementIds = async (programId: string, elementIds: string[], programIds: string[]): Promise<ProgramRecord> => {
  const rows = await sql`
    update programs
    set element_ids = ${elementIds},
        program_ids = ${programIds}
    where id = ${programId} and archived = false
    returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    throw new Error(`Program ${programId} not found or archived`);
  }
  return mapProgramRow(typedRows[0]);
};

export const archiveProgram = async (programId: string): Promise<ProgramRecord> => {
  const rows = await sql`
    update programs
    set archived = true
    where id = ${programId} and archived = false
    returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    throw new Error(`Program ${programId} not found or already archived`);
  }
  return mapProgramRow(typedRows[0]);
};

export const updateProgramVideoUrl = async (programId: string, videoUrl: string): Promise<ProgramRecord> => {
  const rows = await sql`
    update programs
    set video_url = ${videoUrl}
    where id = ${programId} and archived = false
    returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    throw new Error(`Program ${programId} not found or archived`);
  }
  return mapProgramRow(typedRows[0]);
};

export const getProgramsContainingVersion = async (versionId: string): Promise<ProgramRecord[]> => {
  const rows = await sql`
    with latest_versions as (
      select distinct on (program_id) *
      from program_versions
      order by program_id, created_at desc
    ),
    programs_with_versions as (
      select p.id, lv.title, lv.element_ids, lv.program_ids, lv.created_by, lv.created_at, lv.archived, lv.is_subprogram, lv.video_url, lv.print_program_foreword, lv.print_program_epitaph, lv.locked
      from programs p
      join latest_versions lv on lv.program_id = p.id
      where lv.archived = false
    ),
    direct_programs as (
      select * from programs_with_versions
      where ${versionId} = ANY(element_ids)
    ),
    non_subprogram_direct as (
      select * from direct_programs where is_subprogram = false
    ),
    parent_programs as (
      select pv.*
      from programs_with_versions pv
      where exists (select 1 from direct_programs dp where dp.is_subprogram = true and dp.id = ANY(pv.program_ids))
    )
    select * from non_subprogram_direct
    union
    select * from parent_programs
    order by created_at desc
  `;
  return (rows as ProgramRow[]).map(mapProgramRow);
};

export const updateProgram = async (programId: string, updates: {title?: string; printProgramForeword?: string | null; printProgramEpitaph?: string | null; videoUrl?: string | null; isSubprogram?: boolean; locked?: boolean; createdBy?: string | null}): Promise<ProgramRecord> => {
  const program = await getProgramById(programId);
  if (!program) {
    throw new Error(`Program ${programId} not found or archived`);
  }
  const rows = await sql`
    update programs
    set title = ${updates.title ?? program.title},
        print_program_foreword = ${updates.printProgramForeword !== undefined ? updates.printProgramForeword : program.printProgramForeword},
        print_program_epitaph = ${updates.printProgramEpitaph !== undefined ? updates.printProgramEpitaph : program.printProgramEpitaph},
        video_url = ${updates.videoUrl !== undefined ? updates.videoUrl : program.videoUrl},
        is_subprogram = ${updates.isSubprogram !== undefined ? updates.isSubprogram : program.isSubprogram},
        locked = ${updates.locked !== undefined ? updates.locked : program.locked},
        created_by = ${updates.createdBy !== undefined ? updates.createdBy : program.createdBy}
    where id = ${programId} and archived = false
    returning id, title, element_ids, program_ids, created_by, created_at, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked
  `;
  const typedRows = rows as ProgramRow[];
  if (typedRows.length === 0) {
    throw new Error(`Program ${programId} not found or archived`);
  }
  return mapProgramRow(typedRows[0])
};