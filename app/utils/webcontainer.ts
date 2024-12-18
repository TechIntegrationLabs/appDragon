// Basic file system operations for the WebContainer
import { webcontainer } from '~/lib/webcontainer';
import type { WebContainer } from '@webcontainer/api';

async function getWebContainerInstance(): Promise<WebContainer> {
  return await webcontainer;
}

export async function getAllFiles(dir = '/'): Promise<string[]> {
  const instance = await getWebContainerInstance();
  const files: string[] = [];

  async function traverseDirectory(currentPath: string) {
    const entries = await instance.fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      
      if (entry.isDirectory()) {
        await traverseDirectory(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await traverseDirectory(dir);
  return files;
}

export async function writeFile(path: string, content: string): Promise<void> {
  const instance = await getWebContainerInstance();
  
  try {
    // Ensure the directory exists
    const dirPath = path.split('/').slice(0, -1).join('/');
    if (dirPath) {
      await mkdir(dirPath);
    }
    
    await instance.fs.writeFile(path, content);
    console.log('Successfully wrote to file:', path);
  } catch (error) {
    console.error('Error writing file:', path, error);
    throw error;
  }
}

export async function readFile(path: string): Promise<string> {
  const instance = await getWebContainerInstance();
  try {
    const content = await instance.fs.readFile(path, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', path, error);
    throw error;
  }
}

export async function mkdir(path: string): Promise<void> {
  const instance = await getWebContainerInstance();
  try {
    await instance.fs.mkdir(path, { recursive: true });
    console.log('Successfully created directory:', path);
  } catch (error) {
    console.error('Error creating directory:', path, error);
    throw error;
  }
}

export async function exists(path: string): Promise<boolean> {
  const instance = await getWebContainerInstance();
  try {
    await instance.fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function rm(path: string, options: { recursive?: boolean; force?: boolean } = {}): Promise<void> {
  const instance = await getWebContainerInstance();
  await instance.fs.rm(path, options);
}
