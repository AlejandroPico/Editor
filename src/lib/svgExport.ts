import { edgePath } from './geometry';
import type { AtlasProject, NodeEntity } from '../model/project';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

function nodeShape(node: NodeEntity): string {
  const { x, y, width: w, height: h } = node;
  if (node.shape === 'circle') return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}"/>`;
  if (node.shape === 'diamond') return `<path d="M ${x + w / 2} ${y} L ${x + w} ${y + h / 2} L ${x + w / 2} ${y + h} L ${x} ${y + h / 2} Z"/>`;
  const radius = node.shape === 'pill' ? h / 2 : node.shape === 'rounded' ? 14 : 0;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/>`;
}

export function projectSvg(project: AtlasProject, includeReferences = false): string {
  const nodeMap = new Map(project.nodes.map(node => [node.id, node]));
  const gradients = project.edges.filter(edge => edge.colors.length > 1).map(edge => `<linearGradient id="gradient-${esc(edge.id)}"><stop offset="0" stop-color="${esc(edge.colors[0])}"/><stop offset="1" stop-color="${esc(edge.colors.at(-1))}"/></linearGradient>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${project.board.width}" height="${project.board.height}" viewBox="0 0 ${project.board.width} ${project.board.height}">
  <defs>${gradients}</defs>
  <rect width="100%" height="100%" fill="${esc(project.board.background)}" fill-opacity="${project.board.backgroundOpacity}"/>
  ${includeReferences ? project.references.filter(item => item.visible).map(item => `<image href="${esc(item.dataUrl)}" x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" opacity="${item.opacity}" transform="rotate(${item.rotation} ${item.x + item.width / 2} ${item.y + item.height / 2})"/>`).join('') : ''}
  ${project.areas.map(area => `<rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" rx="${area.radius}" fill="${area.fill}" fill-opacity="${area.fillOpacity}" stroke="${area.stroke}" stroke-width="${area.strokeWidth}"/>`).join('')}
  ${project.edges.map(edge => { const source = nodeMap.get(edge.sourceId), target = nodeMap.get(edge.targetId); if (!source || !target) return ''; return `<path d="${edgePath(edge, source, target)}" fill="none" stroke="${edge.colors.length > 1 ? `url(#gradient-${esc(edge.id)})` : esc(edge.color)}" stroke-width="${edge.width}" stroke-dasharray="${esc(edge.dash)}" opacity="${edge.opacity}"/>`; }).join('')}
  ${project.events.map(event => `<g><line x1="${event.x}" x2="${event.x + event.width}" y1="${event.y}" y2="${event.y}" stroke="${event.color}" stroke-width="${event.lineWidth}" stroke-dasharray="${esc(event.dash)}"/><text x="${event.x}" y="${event.y - 10}" fill="${event.color}" font-family="Inter,Arial" font-size="16">${esc(event.title)}</text></g>`).join('')}
  ${project.nodes.map(node => `<g fill="${node.fill}" stroke="${node.stroke}" stroke-width="${node.strokeWidth}" opacity="${node.opacity}">${nodeShape(node)}${node.iconDataUrl ? `<image href="${esc(node.iconDataUrl)}" x="${node.x + node.width / 2 - 20}" y="${node.y + 8}" width="40" height="40"/>` : ''}<text x="${node.x + node.width / 2}" y="${node.y + node.height + 20}" text-anchor="middle" fill="#0f172a" stroke="none" font-family="Inter,Arial" font-weight="700" font-size="15">${esc(node.title)}</text><text x="${node.x + node.width / 2}" y="${node.y + node.height + 38}" text-anchor="middle" fill="#64748b" stroke="none" font-family="Inter,Arial" font-size="12">${esc(node.subtitle)}</text><text x="${node.x + node.width / 2}" y="${node.y + node.height + 54}" text-anchor="middle" fill="#64748b" stroke="none" font-family="Inter,Arial" font-size="11">${esc(node.visibleValue)}</text></g>`).join('')}
  ${project.texts.map(text => `<text x="${text.x}" y="${text.y}" text-anchor="${text.align}" fill="${text.color}" font-family="Inter,Arial" font-size="${text.fontSize}" font-weight="${text.fontWeight}">${esc(text.text)}</text>`).join('')}
</svg>`;
}
