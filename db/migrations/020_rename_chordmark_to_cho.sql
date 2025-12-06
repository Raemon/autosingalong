update song_versions
set label = replace(label, '.chordmark', '.cho')
where label like '%.chordmark%';

