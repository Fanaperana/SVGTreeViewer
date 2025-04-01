import { SVGTreeViewerOptions, TreeBounds } from './interfaces';
import { TreeNode } from './TreeNode';

/**
 * Handles the layout calculations for the tree structure
 */
export class TreeLayoutEngine {
  private options: Required<SVGTreeViewerOptions>;
  
  constructor(options: Required<SVGTreeViewerOptions>) {
    this.options = options;
  }

  /**
   * Calculate positions for all nodes in the tree
   */
  layoutTree(rootNodes: TreeNode[]): TreeNode[] {
    const { levelHeight, horizontalSpacing, nodePadding, nodeWidth } = this.options;
    let flat: TreeNode[] = [];

    // First pass: calculate positions
    const calculatePositions = (
      node: TreeNode,
      depth: number = 0,
      x: number = 0
    ): { node: TreeNode; width: number } => {
      // Skip manually positioned nodes in the calculation
      if (
        node.manuallyPositioned &&
        node.x !== undefined &&
        node.y !== undefined
      ) {
        // Still need to process children
        let totalWidth = 0;
        if (!node.collapsed) {
          node.children.forEach((child) => {
            const result = calculatePositions(child, depth + 1, x + totalWidth);
            totalWidth += result.width;
          });
        }

        flat.push(node);
        return { node, width: Math.max(horizontalSpacing, totalWidth) };
      }

      // For normal nodes or first-time layout
      if (!node.children.length || node.collapsed) {
        node.x = x;
        node.y = depth * levelHeight;
        node.origX = x; // Store original position
        node.origY = depth * levelHeight;
        flat.push(node);
        return { node, width: horizontalSpacing };
      }

      let totalWidth = 0;
      const childResults = [];

      // Calculate all children first
      for (const child of node.children) {
        const result = calculatePositions(child, depth + 1, x + totalWidth);
        childResults.push(result);
        totalWidth += result.width;
      }

      // If no children, use default spacing
      if (totalWidth === 0) {
        totalWidth = horizontalSpacing;
      }

      // Center the parent over its children
      const leftMostChild = childResults[0].node;
      const rightMostChild = childResults[childResults.length - 1].node;

      const leftEdge = leftMostChild.x || 0;
      const rightEdge = (rightMostChild.x || 0) + nodeWidth;
      const center = leftEdge + (rightEdge - leftEdge) / 2 - nodeWidth / 2;

      node.x = center;
      node.y = depth * levelHeight;
      node.origX = center; // Store original position
      node.origY = depth * levelHeight;

      flat.push(node);
      return { node, width: totalWidth };
    };

    // Process each root node
    let xOffset = 0;
    rootNodes.forEach((root) => {
      const result = calculatePositions(root, 0, xOffset);
      xOffset += result.width + nodePadding; // Add extra padding between trees
    });

    // Apply minimum x position to avoid negative coordinates
    const minX = Math.min(...flat.map((n) => n.x || 0));
    if (minX < 0) {
      flat.forEach((n) => {
        if (n.x !== undefined) n.x -= minX;
        if (n.origX !== undefined) n.origX -= minX;
      });
    }

    return flat;
  }

  /**
   * Calculate the bounds of the entire tree
   */
  calculateTreeBounds(nodes: TreeNode[]): TreeBounds {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const { nodeWidth, nodeHeight } = this.options;
    
    let minX = Infinity,
        minY = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity;

    nodes.forEach((node) => {
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + nodeWidth);
      }

      if (node.y !== undefined) {
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + nodeHeight);
      }
    });

    return { minX, minY, maxX, maxY };
  }
}