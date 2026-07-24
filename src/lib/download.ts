export function safeFileName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'atlas-project';
}

export function versionedFileName(value: string, extension: string, date = new Date()): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `${safeFileName(value)}_${stamp}.${extension.replace(/^\./, '')}`;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

interface WritableFile {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface SaveFileHandle {
  createWritable: () => Promise<WritableFile>;
}

interface SavePickerOptions {
  suggestedName: string;
  types?: Array<{ description: string; accept: Record<string, string[]> }>;
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: SavePickerOptions) => Promise<SaveFileHandle>;
};

export async function saveBlobWithDialog(
  createBlob: () => Promise<Blob>,
  suggestedName: string,
  description = 'Archivo de Atlas Editor',
  mime = 'application/zip',
  extensions = ['.zip']
): Promise<boolean> {
  const picker = (window as SavePickerWindow).showSaveFilePicker;
  if (picker) {
    let handle: SaveFileHandle;
    try {
      handle = await picker.call(window, { suggestedName, types: [{ description, accept: { [mime]: extensions } }] });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      throw error;
    }
    const writable = await handle.createWritable();
    await writable.write(await createBlob());
    await writable.close();
    return true;
  }
  downloadBlob(await createBlob(), suggestedName);
  return true;
}

export function downloadText(text: string, name: string, type = 'text/plain'): void {
  downloadBlob(new Blob([text], { type }), name);
}
