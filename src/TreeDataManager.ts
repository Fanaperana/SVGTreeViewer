import { TreeNodeData, SVGTreeViewerOptions } from './interfaces';
import { TreeNode } from './TreeNode';

/**
 * Manages tree data, including building the tree structure,
 * maintaining relationships, and providing access to nodes
 */
export class TreeDataManager {
  private options: Required<SVGTreeViewerOptions>;
  private nodes: TreeNode[] = [];
  private nodeMap: Map<string | number, TreeNode> = new Map();

  constructor(options: Required<SVGTreeViewerOptions>) {
    this.options = options;
    this.buildTree();
  }

  /**
   * Build the tree structure from flat data
   */
  buildTree(): TreeNode[] {
    this.nodes = [];
    this.nodeMap.clear();
    
    const { idAlias, parentIdAlias, data } = this.options;
    
    // Create nodes without relationships first
    const flatNodes: TreeNode[] = data.map(d => 
      new TreeNode(d[idAlias], d[parentIdAlias], d)
    );
    
    // Build the node map for quick lookups
    flatNodes.forEach(node => {
      this.nodeMap.set(node.id, node);
    });
    
    // Set up parent-child relationships
    flatNodes.forEach(node => {
      if (node.parent_id == null) {
        // This is a root node
        node.parent = null;
        this.nodes.push(node);
      } else {
        // Find the parent and add this as a child
        const parent = this.nodeMap.get(node.parent_id);
        if (parent) {
          parent.addChild(node);
        } else {
          // If parent is not found, treat as root
          this.nodes.push(node);
        }
      }
    });
    
    return this.nodes;
  }

  /**
   * Update the data and rebuild the tree
   */
  updateData(data: TreeNodeData[]): TreeNode[] {
    this.options.data = data;
    return this.buildTree();
  }

  /**
   * Get all nodes (flattened tree)
   */
  getAllNodes(): TreeNode[] {
    const result: TreeNode[] = [];
    
    const traverse = (node: TreeNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };
    
    this.nodes.forEach(traverse);
    return result;
  }

  /**
   * Get a node by ID
   */
  getNodeById(id: string | number): TreeNode | undefined {
    return this.nodeMap.get(id);
  }

  /**
   * Toggle collapse state of a node by ID
   */
  toggleCollapse(id: string | number): boolean {
    const node = this.nodeMap.get(id);
    if (node) {
      node.toggleCollapse();
      return true;
    }
    return false;
  }

  /**
   * Reset positions of all nodes
   */
  resetPositions(): void {
    this.getAllNodes().forEach(node => {
      node.resetPosition();
    });
  }

  /**
   * Get the root nodes
   */
  getRootNodes(): TreeNode[] {
    return this.nodes;
  }
}