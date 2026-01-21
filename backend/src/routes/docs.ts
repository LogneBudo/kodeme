import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
// use require for yamljs to avoid missing type declaration issues with ts-node-dev
const YAML = require('yamljs');
import path from 'path';
import fs from 'fs';

const router = Router();

const mergedPath = path.join(process.cwd(), 'openapi.merged.yaml');
const defaultPath = path.join(process.cwd(), 'openapi.yaml');
const specPath = fs.existsSync(mergedPath) ? mergedPath : defaultPath;
const swaggerSpec = YAML.load(specPath);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
