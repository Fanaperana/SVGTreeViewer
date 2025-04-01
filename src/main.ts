// Export main class
export { SVGTreeViewer } from './SVGTreeViewer';

// Export types and interfaces
export { TreeNode } from './TreeNode';
export type { 
  TreeNodeData, 
  SVGTreeViewerOptions,
  TreeBounds 
} from './interfaces';

// Export components for advanced usage
export { TreeDataManager } from './TreeDataManager';
export { TreeLayoutEngine } from './TreeLayoutEngine';
export { TreeRenderer } from './TreeRenderer';
export { InteractionManager } from './InteractionManager';

// Default export
import { SVGTreeViewer } from './SVGTreeViewer';
export default SVGTreeViewer;

// Optional: attach to window for global use
if (typeof window !== "undefined") {
  (window as any).SVGTreeViewer = SVGTreeViewer;
}