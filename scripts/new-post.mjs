import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPost } from './post-scaffold.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const title = process.argv.slice(2).join(' ');

if (!title.trim()) {
  console.error('Usage: npm run new:post -- "Post title"');
  process.exitCode = 1;
} else {
  try {
    const result = await createPost({
      title,
      contentDirectory: path.join(repositoryRoot, 'src/content/blog'),
      templatePath: path.join(repositoryRoot, 'templates/post.md'),
    });

    console.log(`Created ${path.relative(repositoryRoot, result.destination)}`);
    console.log(
      `Preview at http://localhost:4321/blog/${result.routeSlug}/ after running npm run dev`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
