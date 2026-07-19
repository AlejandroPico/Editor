import { describe, expect, it } from 'vitest';
import { createBlankProject, normalizeProject, PROJECT_FORMAT, PROJECT_VERSION } from '../model/project';

describe('formato de proyecto', () => {
  it('empieza realmente vacío y sin eje obligatorio', () => {
    const project = createBlankProject();
    expect(project.format).toBe(PROJECT_FORMAT);
    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.nodes).toEqual([]);
    expect(project.edges).toEqual([]);
    expect(project.events).toEqual([]);
    expect(project.areas).toEqual([]);
    expect(project.references).toEqual([]);
    expect(project.board.axis.mode).toBe('none');
  });
  it('normaliza colecciones opcionales sin perder el documento', () => {
    const project = createBlankProject();
    const normalized = normalizeProject({ ...project, texts: undefined, metadata: undefined });
    expect(normalized.texts).toEqual([]);
    expect(normalized.metadata).toEqual({});
    expect(normalized.id).toBe(project.id);
  });
  it('rechaza JSON ajeno al editor', () => expect(() => normalizeProject({ title: 'otro formato' })).toThrow(/Formato/));
});
