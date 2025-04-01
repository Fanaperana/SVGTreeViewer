/**
 * Generic interface for tree node data
 */
export interface TreeNodeData {
    [key: string]: any;
  }
  
  /**
   * Configuration options for SVGTreeViewer
   */
  export interface SVGTreeViewerOptions {
    containerId: string;
    data?: TreeNodeData[];
    idAlias?: string;
    parentIdAlias?: string;
    collapseChild?: boolean;
    template?: string;
    nodeWidth?: number;
    nodeHeight?: number;
    nodePadding?: number;
    levelHeight?: number;
    horizontalSpacing?: number;
    backgroundPattern?: "dots" | "grid" | "none";
    backgroundColor?: string;
    patternColor?: string;
  }
  
  /**
   * Default options with sensible defaults
   */
  export const DEFAULT_OPTIONS: Required<SVGTreeViewerOptions> = {
    containerId: "",
    data: [],
    idAlias: "id",
    parentIdAlias: "parent_id",
    collapseChild: false,
    template: "<div class='node'>[data:text]</div>",
    nodeWidth: 160,
    nodeHeight: 100,
    nodePadding: 40,
    levelHeight: 150,
    horizontalSpacing: 200,
    backgroundPattern: "dots",
    backgroundColor: "#f9f9f9",
    patternColor: "#cccccc",
  };
  
  /**
   * Tree bounds definition for calculating the tree size
   */
  export interface TreeBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }