const fs = require('fs');
let c = fs.readFileSync('src/pages/Settings/index.tsx', 'utf8');

c = c.replace(
  '{isAdmin && <ImportExportCard />}',
  '<fieldset disabled={!isAdmin} className={!isAdmin ? "opacity-50 grayscale pointer-events-none" : ""}>\\n                  <ImportExportCard />\\n                </fieldset>'
);

c = c.replace(
  '{isAdmin && <PhotoImportCard />}',
  '<fieldset disabled={!isAdmin} className={!isAdmin ? "opacity-50 grayscale pointer-events-none" : ""}>\\n                  <PhotoImportCard />\\n                </fieldset>'
);

fs.writeFileSync('src/pages/Settings/index.tsx', c, 'utf8');
