import 'dotenv/config';
import sql from '../lib/db';

(async () => {
  const rows = await sql`
    SELECT 
      v1.id,
      v1.label as current_label,
      v1.next_version_id,
      v2.label as next_label,
      s.title as song_title
    FROM song_versions v1
    JOIN song_versions v2 ON v1.next_version_id = v2.id
    JOIN songs s ON v1.song_id = s.id
    WHERE v1.next_version_id IS NOT NULL
      AND v1.label != v2.label
      AND v1.archived = false
      AND v2.archived = false
    ORDER BY s.title, v1.label
  `;
  
  console.log('Versions with mismatched next_version labels:');
  console.log(JSON.stringify(rows, null, 2));
  console.log('Total:', rows.length);
  process.exit(0);
})();
