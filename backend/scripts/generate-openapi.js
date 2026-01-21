const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const jsYaml = require('js-yaml');

const generatedPath = path.join(process.cwd(), 'openapi.generated.yaml');
const mergedPath = path.join(process.cwd(), 'openapi.merged.yaml');

const options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'Kodeme Backend API', version: '1.0.0' },
  },
  // Scan controllers and routes for JSDoc @openapi blocks
  apis: ['./src/controllers/**/*.ts', './src/routes/**/*.ts'],
};

const generatedSpec = swaggerJSDoc(options);
fs.writeFileSync(generatedPath, jsYaml.dump(generatedSpec, { noRefs: true }), 'utf8');
console.log('Generated', generatedPath);

// If a manual openapi.yaml exists, merge generated paths into it to resolve $refs
const basePath = path.join(process.cwd(), 'openapi.yaml');
let baseSpec = {};
if (fs.existsSync(basePath)) {
  baseSpec = jsYaml.load(fs.readFileSync(basePath, 'utf8')) || {};
} else {
  baseSpec = { openapi: '3.0.3', info: { title: 'Kodeme Backend API', version: '1.0.0' } };
}

function deepMerge(a, b) {
  const out = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    if (k in out && typeof out[k] === 'object' && typeof b[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], b[k]);
    } else {
      out[k] = b[k];
    }
  }
  return out;
}

// Merge paths
baseSpec.paths = deepMerge(baseSpec.paths || {}, generatedSpec.paths || {});

// Merge components
baseSpec.components = deepMerge(baseSpec.components || {}, generatedSpec.components || {});

// Merge tags (unique by name)
const baseTags = Array.isArray(baseSpec.tags) ? baseSpec.tags : [];
const genTags = Array.isArray(generatedSpec.tags) ? generatedSpec.tags : [];
const tagMap = new Map();
baseTags.concat(genTags).forEach((t) => {
  if (t && t.name) tagMap.set(t.name, t);
});
baseSpec.tags = Array.from(tagMap.values());

fs.writeFileSync(mergedPath, jsYaml.dump(baseSpec, { noRefs: true }), 'utf8');
console.log('Merged spec written to', mergedPath);
