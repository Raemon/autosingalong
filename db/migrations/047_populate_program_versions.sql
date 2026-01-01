-- Populate program_versions from existing programs data
INSERT INTO program_versions (program_id, title, element_ids, archived, program_ids,
  video_url, print_program_foreword, print_program_epitaph, is_subprogram, locked,
  created_at, created_by)
SELECT id, title, element_ids, archived, program_ids,
  video_url, print_program_foreword, print_program_epitaph, is_subprogram, locked,
  created_at, created_by
FROM programs;
