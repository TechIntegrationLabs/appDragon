import type { PathWatcherEvent, WebContainer } from '@webcontainer/api';
import { getEncoding } from 'istextorbinary';
import { map, type MapStore } from 'nanostores';
import { bufferWatchEvents } from '~/utils/buffer';
import { WORK_DIR } from '~/utils/constants';
import { computeFileModifications } from '~/utils/diff';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';

const logger = createScopedLogger('FilesStore');

const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Dirent {
  type: 'directory';
  children: FileMap;
}

export type FileMap = Record<string, File | Dirent>;

export class FilesStore {
  #webcontainer: Promise<WebContainer>;
  #size = 0;
  #modifiedFiles: Map<string, string> = import.meta.hot?.data.modifiedFiles ?? new Map();
  files: MapStore<FileMap> = import.meta.hot?.data.files ?? map({});

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;

    if (import.meta.hot) {
      import.meta.hot.data.files = this.files;
      import.meta.hot.data.modifiedFiles = this.#modifiedFiles;
    }

    this.#init();
  }

  async #init() {
    const webcontainer = await this.#webcontainer;
    const files = await this.#listFiles(WORK_DIR);
    this.files.set(files);

    webcontainer.on('server-ready', (port, url) => {
      logger.info('Server ready', { port, url });
    });

    webcontainer.on('error', error => {
      logger.error('Error from WebContainer', error);
    });

    webcontainer.fs.watch(WORK_DIR, { recursive: true }, events => {
      const bufferedEvents = bufferWatchEvents(events);
      this.#handleWatchEvents(bufferedEvents);
    });
  }

  filesCount() {
    return this.#size;
  }

  getFile(filePath: string): File | undefined {
    const parts = filePath.split('/').filter(Boolean);
    let current: FileMap = this.files.get();

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const entry = current[part];

      if (!entry) {
        return undefined;
      }

      if (i === parts.length - 1) {
        return entry.type === 'file' ? entry : undefined;
      }

      if (entry.type === 'directory') {
        current = entry.children;
      } else {
        return undefined;
      }
    }

    return undefined;
  }

  getFileModifications() {
    const modifications = new Map<string, string>();

    for (const [filePath, content] of this.#modifiedFiles) {
      const file = this.getFile(filePath);
      if (!file) continue;

      const diff = computeFileModifications(file.content, content);
      if (diff) {
        modifications.set(filePath, diff);
      }
    }

    return modifications;
  }

  resetFileModifications() {
    this.#modifiedFiles.clear();
  }

  async saveFile(filePath: string, content: string) {
    const webcontainer = await this.#webcontainer;
    await webcontainer.fs.writeFile(filePath, content, { encoding: 'utf-8' });
  }

  async #handleWatchEvents(events: PathWatcherEvent[]) {
    const webcontainer = await this.#webcontainer;

    for (const event of events) {
      const path = event.path.startsWith('/') ? event.path.slice(1) : event.path;

      switch (event.type) {
        case 'create':
        case 'modify': {
          try {
            const file = await webcontainer.fs.readFile(path);
            const isBinary = isBinaryFile(file);
            const content = isBinary ? '' : utf8TextDecoder.decode(file);

            this.#upsertFile(path, { type: 'file', content, isBinary });
          } catch (error) {
            logger.error('Failed to read file', { error, path });
          }
          break;
        }

        case 'delete': {
          this.#deleteFile(path);
          break;
        }

        default:
          unreachable(event);
      }
    }
  }

  #upsertFile(path: string, file: File) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];

    let current = this.files.get();
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath += `/${part}`;

      if (!current[part]) {
        current[part] = { type: 'directory', children: {} };
        this.#size++;
      }

      const entry = current[part];
      if (entry.type !== 'directory') {
        throw new Error(
          `Cannot create file "${path}" because "${currentPath}" is not a directory`,
        );
      }

      current = entry.children;
    }

    if (!current[fileName]) {
      this.#size++;
    }

    current[fileName] = file;
    this.files.notify();
  }

  #deleteFile(path: string) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];

    let current = this.files.get();
    let parent: FileMap | undefined;
    let parentKey: string | undefined;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const entry = current[part];

      if (!entry || entry.type !== 'directory') {
        return;
      }

      parent = current;
      parentKey = part;
      current = entry.children;
    }

    const file = current[fileName];
    if (!file) {
      return;
    }

    if (file.type === 'directory') {
      this.#size -= Object.keys(file.children).length;
    }

    this.#size--;
    delete current[fileName];

    if (parent && parentKey && Object.keys(current).length === 0) {
      delete parent[parentKey];
    }

    this.files.notify();
  }

  async #listFiles(dir: string): Promise<FileMap> {
    const webcontainer = await this.#webcontainer;
    const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
    const files: FileMap = {};

    for (const entry of entries) {
      const path = `${dir}/${entry.name}`;

      if (entry.isDirectory()) {
        files[entry.name] = {
          type: 'directory',
          children: await this.#listFiles(path),
        };
        this.#size++;
      } else {
        try {
          const file = await webcontainer.fs.readFile(path);
          const isBinary = isBinaryFile(file);
          const content = isBinary ? '' : utf8TextDecoder.decode(file);

          files[entry.name] = { type: 'file', content, isBinary };
          this.#size++;
        } catch (error) {
          logger.error('Failed to read file', { error, path });
        }
      }
    }

    return files;
  }
}

function isBinaryFile(buffer: Uint8Array | undefined): boolean {
  if (!buffer?.length) return false;
  return getEncoding(undefined, buffer) === 'binary';
}
