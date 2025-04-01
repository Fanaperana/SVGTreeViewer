import {
  SVGTreeViewerOptions,
  TreeNodeData,
  DEFAULT_OPTIONS,
  TreeBounds,
} from "./interfaces";
import { TreeNode } from "./TreeNode";
import { TreeDataManager } from "./TreeDataManager";
import { TreeRenderer } from "./TreeRenderer";
import { InteractionManager } from "./InteractionManager";
import { TreeLayoutEngine } from "./TreeLayoutEngine";

/**
 * Main SVGTreeViewer class that coordinates all components
 */
export class SVGTreeViewer {
  private options: Required<SVGTreeViewerOptions>;
  private dataManager: TreeDataManager;
  private layoutEngine: TreeLayoutEngine;
  private renderer: TreeRenderer;
  private interactionManager: InteractionManager;
  private treeBounds: TreeBounds = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  constructor(options: SVGTreeViewerOptions) {
    // Merge with default options
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Initialize components
    this.dataManager = new TreeDataManager(this.options);
    this.layoutEngine = new TreeLayoutEngine(this.options);
    this.renderer = new TreeRenderer(this.options);

    // Get the container element
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      throw new Error(
        `Container with ID "${this.options.containerId}" not found`
      );
    }

    this.interactionManager = new InteractionManager(this.renderer, container);

    // Initialize the viewer
    this._initialize();
  }

  /**
   * Initialize the tree viewer
   */
  private _initialize(): void {
    // Set up the SVG canvas
    this.renderer.initializeSVG();

    // Attach interaction events
    this.interactionManager.attachEvents();

    // Set up interaction callbacks
    this.interactionManager.setCallbacks(
      // Node dragged callback
      (node: TreeNode) => {
        this.renderer.updateConnections(node);
      },
      // Node collapsed callback
      (node: TreeNode) => {
        this._refreshTree();
        this.centerTree();
      }
    );

    // Attach custom events
    const container = document.getElementById(this.options.containerId);
    if (container) {
      container.addEventListener("center-tree", () => {
        this.centerTree();
      });
    }

    // Initial rendering
    this._refreshTree();

    // Center the tree for initial view
    this.centerTree();
  }

  /**
   * Refresh the tree layout and rendering
   */
  private _refreshTree(): void {
    // Get all nodes
    const rootNodes = this.dataManager.getRootNodes();

    // Layout the tree
    const nodes = this.layoutEngine.layoutTree(rootNodes);

    // Render the tree
    this.renderer.renderTree(nodes);

    // Calculate tree bounds
    this.treeBounds = this.layoutEngine.calculateTreeBounds(
      this.dataManager.getAllNodes()
    );

    // Set up node dragging for all nodes
    nodes.forEach((node) => {
      this.interactionManager.setupNodeDragging(node);
    });
  }

  /**
   * Update the data and re-render the tree
   * @param data New data to render
   */
  public updateData(data: TreeNodeData[]): void {
    this.options.data = data;
    this.dataManager.updateData(data);
    this._refreshTree();
    this.centerTree();
  }

  /**
   * Reset view to initial state (center and scale)
   */
  public resetView(): void {
    this.interactionManager.resetView();
  }

  /**
   * Reset the positions of all nodes to their calculated positions
   */
  public resetNodePositions(): void {
    this.dataManager.resetPositions();
    this._refreshTree();
    this.centerTree();
  }

  /**
   * Toggle collapse state of a node by its id
   * @param id ID of the node to toggle
   */
  public toggleNodeCollapse(id: string | number): void {
    if (this.dataManager.toggleCollapse(id)) {
      this._refreshTree();
      this.centerTree();
    }
  }

  /**
   * Center the tree in the viewport
   */
  public centerTree(): void {
    this.interactionManager.centerTree(this.treeBounds);
  }

  /**
   * Zoom to fit all nodes in the view
   */
  public zoomToFit(): void {
    this.interactionManager.centerTree(this.treeBounds);
  }
}

// Export types
export { TreeNode, TreeNodeData, SVGTreeViewerOptions };

// Optional: attach to window for global use
if (typeof window !== "undefined") {
  (window as any).SVGTreeViewer = SVGTreeViewer;
}

export default SVGTreeViewer;
