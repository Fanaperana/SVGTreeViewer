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
declare class SVGTreeViewer {
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
    private _createDotPattern;
    private _createGridPattern;
    private _applyBackgroundPattern;
    private _buildTree;
    private _renderActionButtons;
    private _renderSVG;
    private _attachEvents;
    private _setupNodeDragging;
    private _createSCurve;
    private _updateConnections;
    private _getAllNodes;
    private _updateTransform;
    private _renderTree;
    private _calculateTreeBounds;
    private _layoutTree;
    private _processTemplate;
    updateData(data: TreeNodeData[]): void;
    resetView(): void;
    resetNodePositions(): void;
    toggleNodeCollapse(id: string | number): void;
    centerTree(): void;
    zoomToFit(): void;
}
export { SVGTreeViewer };
export default SVGTreeViewer;
