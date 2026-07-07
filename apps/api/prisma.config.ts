import { defineConfig } from 'prisma/config';
import fs from 'node:fs';
import path from 'node:path';

function findSchemaPath(): string {
  let currentDir = __dirname;
  while (true) {
    const candidate = path.join(currentDir, 'prisma', 'schema.prisma');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(
        'Could not resolve prisma/schema.prisma from ' + __dirname,
      );
    }
    currentDir = parentDir;
  }
}

export default defineConfig({
  schema: findSchemaPath(),
});
