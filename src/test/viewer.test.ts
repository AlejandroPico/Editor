import { describe, expect, it } from 'vitest';
import { createBlankProject } from '../model/project';
import { interactiveViewerHtml } from '../lib/viewer';

describe('visor portable', () => {
  it('genera un HTML autónomo con el proyecto incrustado', () => {
    const project=createBlankProject();project.title='Prueba portable';
    const html=interactiveViewerHtml(project);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Prueba portable');
    expect(html).toContain('const project=');
  });
});
