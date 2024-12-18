import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getWebContainerInstance } from '~/utils/webcontainer';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const webcontainer = await getWebContainerInstance();
    const files = await getAllProjectFiles(webcontainer);

    // Create a zip file structure
    interface ZipFile {
      files: Record<string, string>;
      generateAsync(): Promise<Blob>;
    }

    const zip: ZipFile = {
      files: {},
      async generateAsync() {
        // Convert files to a single blob
        const encoder = new TextEncoder();
        const fileBlobs = await Promise.all(
          Object.entries(this.files).map(async ([path, content]) => {
            const blob = new Blob([encoder.encode(content as string)], {
              type: 'application/octet-stream',
            });
            return { path, blob };
          })
        );

        // Combine all blobs into a single one
        const zipBlob = new Blob(
          await Promise.all(fileBlobs.map(({ blob }) => blob)),
          { type: 'application/zip' }
        );

        return zipBlob;
      },
    };

    // Add files to the zip
    for (const [path, content] of Object.entries(files)) {
      zip.files[path] = content;
    }

    // Generate zip file
    const zipContent = await zip.generateAsync();

    // Return the zip file with appropriate headers
    return new Response(zipContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="masBolt.zip"',
      },
    });
  } catch (error) {
    console.error('Error creating zip file:', error);
    return new Response('Error creating zip file', { status: 500 });
  }
};

// Helper function to recursively get all project files
async function getAllProjectFiles(webcontainer: any, dir = '/') {
  const files: Record<string, string> = {};
  
  try {
    const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const path = `${dir}${entry.name}`;
      
      // Skip node_modules and hidden files/directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Recursively get files from subdirectory
        const subFiles = await getAllProjectFiles(webcontainer, path + '/');
        Object.assign(files, subFiles);
      } else {
        // Read file content
        try {
          const file = await webcontainer.fs.readFile(path, 'utf-8');
          files[path.startsWith('/') ? path.slice(1) : path] = file;
        } catch (error) {
          console.error(`Error reading file ${path}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}
