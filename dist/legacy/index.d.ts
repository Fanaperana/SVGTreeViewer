interface TreeNodeData {
    [key: string]: any;
}
interface SVGTreeViewerOptions {
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
    backgroundPattern?: 'dots' | 'grid' | 'none';
    backgroundColor?: string;
    patternColor?: string;
}
export declare class SVGTreeViewer {
    private options;
    private nodes;
    private scale;
    private panX;
    private panY;
    private svg;
    private group;
    private isPanning;
    private startX;
    private startY;
    private draggedNode;
    private dragStartX;
    private dragStartY;
    private treeBounds;
    constructor(options: SVGTreeViewerOptions);
    /**
     * Create a dot pattern element
     * @returns SVG defs element containing a dot pattern
     */
    private _createDotPattern;
    /**
     * Create a grid pattern element
     * @returns SVG defs element containing a grid pattern
     */
    private _createGridPattern;
    /**
     * Apply the selected pattern to the SVG
     * @param svg The SVG element to apply the pattern to
     */
    private _applyBackgroundPattern;
    private _buildTree;
    /**
     *
     */
    private _renderActionButtons;
    private _renderSVG;
    private _attachEvents;
    private _setupNodeDragging;
    private _createSCurve;
    private _updateConnections;
    private _getAllNodes;
    private _updateTransform;
    private _renderTree;
    /**
     * Calculate the bounds of the entire tree
     * @param nodes List of all nodes in the tree
     */
    private _calculateTreeBounds;
    private _layoutTree;
    private _processTemplate;
    /**
     * Update the data and re-render the tree
     * @param data New data to render
     */
    updateData(data: TreeNodeData[]): void;
    /**
     * Reset view to initial state (center and scale)
     */
    resetView(): void;
    /**
     * Reset the positions of all nodes to their calculated positions
     */
    resetNodePositions(): void;
    /**
     * Toggle collapse state of a node by its id
     * @param id ID of the node to toggle
     */
    toggleNodeCollapse(id: string | number): void;
    /**
     * Center the tree in the viewport
     */
    centerTree(): void;
    /**
     * Zoom to fit all nodes in the view
     */
    zoomToFit(): void;
}
export {};
