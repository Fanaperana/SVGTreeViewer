// types.ts - Central location for all type definitions
export interface TreeNodeData {
  [key: string]: any;
}

export interface TreeNode {
  id: string | number;
  parent_id: string | number | null;
  collapsed: boolean;
  data: TreeNodeData;
  x?: number;
  y?: number;
  dragging?: boolean;
  // Store original position from layout algorithm
  origX?: number;
  origY?: number;
  // Track if this node has been manually positioned
  manuallyPositioned?: boolean;

  children: TreeNode[];
  parent: TreeNode | null;
  current_node_element: SVGGElement;
  parent_node_element: SVGGElement | null;
  child_node_elements: SVGGElement[];
  isSelected?: boolean;
}

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
  nodeDraggable?: boolean;
}

export interface TreeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Default configuration and constants
export const DefaultOptions: SVGTreeViewerOptions = {
  containerId: "tree-container",
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
  nodeDraggable: false,
};

// Responsible for building the tree structure
export class TreeBuilder {
  private options: SVGTreeViewerOptions;

  constructor(options: SVGTreeViewerOptions) {
    this.options = options;
  }

  public buildTree(data: TreeNodeData[]): TreeNode[] {
    const map = new Map<string | number, TreeNode>();
    const { idAlias, parentIdAlias } = this.options;

    const flat: TreeNode[] = data.map((d) => ({
      ...d,
      id: d[idAlias || "id"],
      parent_id: d[parentIdAlias || "parent_id"],
      collapsed: false,
      data: d,
      parent: null,
      children: [],
      manuallyPositioned: false,
      current_node_element: document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      ) as SVGGElement,
      parent_node_element: null,
      child_node_elements: [],
      isSelected: false,
    }));

    flat.forEach((n) => map.set(n.id, n));

    const roots: TreeNode[] = [];
    flat.forEach((n) => {
      if (n.parent_id == null) {
        n.parent = null;
        roots.push(n);
      } else {
        const parent = map.get(n.parent_id);
        if (parent) {
          n.parent = parent;
          n.parent_node_element = parent.current_node_element;
          parent.child_node_elements.push(n.current_node_element);
          parent.children.push(n);
        }
      }
    });

    return roots;
  }

  public getAllNodes(nodes: TreeNode[]): TreeNode[] {
    let result: TreeNode[] = [];

    const traverse = (node: TreeNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };

    nodes.forEach(traverse);
    return result;
  }

  public processTemplate(template: string, node: TreeNode): string {
    return template.replace(/\[data:(.+?)\]/g, (_, key) => {
      return node.data?.data?.[key] ?? "";
    });
  }
}

// Handles background patterns and styles
export class BackgroundRenderer {
  private options: SVGTreeViewerOptions;

  constructor(options: SVGTreeViewerOptions) {
    this.options = options;
  }

  public createDotPattern(): SVGDefsElement {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    const pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern"
    );
    pattern.setAttribute("id", "dotPattern");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");

    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    dot.setAttribute("cx", "2");
    dot.setAttribute("cy", "2");
    dot.setAttribute("r", "0.5");
    dot.setAttribute("fill", this.options.patternColor || "#cccccc");

    pattern.appendChild(dot);
    defs.appendChild(pattern);

    return defs;
  }

  public createGridPattern(): SVGDefsElement {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    const pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern"
    );
    pattern.setAttribute("id", "gridPattern");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");

    // Horizontal line
    const hLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    hLine.setAttribute("x1", "0");
    hLine.setAttribute("y1", "0");
    hLine.setAttribute("x2", "20");
    hLine.setAttribute("y2", "0");
    hLine.setAttribute("stroke", this.options.patternColor || "#cccccc");
    hLine.setAttribute("stroke-width", "0.5");
    hLine.setAttribute("stroke-dasharray", "3, 3");

    // Vertical line
    const vLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    vLine.setAttribute("x1", "0");
    vLine.setAttribute("y1", "0");
    vLine.setAttribute("x2", "0");
    vLine.setAttribute("y2", "20");
    vLine.setAttribute("stroke", this.options.patternColor || "#cccccc");
    vLine.setAttribute("stroke-width", "0.5");
    vLine.setAttribute("stroke-dasharray", "3, 3");

    pattern.appendChild(hLine);
    pattern.appendChild(vLine);
    defs.appendChild(pattern);

    return defs;
  }

  public applyBackgroundPattern(svg: SVGSVGElement): void {
    if (this.options.backgroundPattern === "none") {
      return;
    }

    let defs: SVGDefsElement;
    let patternId: string;

    // Create the pattern based on the option
    if (this.options.backgroundPattern === "dots") {
      defs = this.createDotPattern();
      patternId = "dotPattern";
    } else {
      defs = this.createGridPattern();
      patternId = "gridPattern";
    }

    svg.appendChild(defs);

    // Create the background rectangle with the pattern
    const patternRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    patternRect.setAttribute("width", "100%");
    patternRect.setAttribute("height", "100%");
    patternRect.setAttribute("fill", `url(#${patternId})`);
    svg.appendChild(patternRect);
  }
}

// Handles drawing connections between nodes
export class ConnectionRenderer {
  private options: SVGTreeViewerOptions;

  constructor(options: SVGTreeViewerOptions) {
    this.options = options;
  }

  public createSCurve(x1: number, y1: number, x2: number, y2: number): string {
    // Calculate the vertical distance for proper curve shaping
    const dy = y2 - y1;

    // Calculate control points - key to creating the S-curve effect
    // First control point is below starting point
    const cp1x = x1;
    const cp1y = y1 + dy * 0.5; // 50% down the vertical distance

    // Second control point is above ending point
    const cp2x = x2;
    const cp2y = y2 - dy * 0.5; // 50% up from the ending point

    // Create bezier curve command
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }

  public drawConnectionLines(
    flat: TreeNode[],
    map: Map<string | number, TreeNode>,
    group: SVGGElement
  ): void {
    flat.forEach((n) => {
      if (n.parent_id && map.get(n.parent_id)) {
        const parent = map.get(n.parent_id);
        if (parent && !parent.collapsed) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );

          const nodeWidthHalf = this.options.nodeWidth! / 2;
          const x1 = (parent.x || 0) + nodeWidthHalf;
          const y1 = (parent.y || 0) + this.options.nodeHeight!;
          const x2 = (n.x || 0) + nodeWidthHalf;
          const y2 = n.y || 0;

          const d = this.createSCurve(x1, y1, x2, y2);

          path.setAttribute("d", d);
          path.setAttribute("stroke", "#ccc");
          path.setAttribute("stroke-width", "2");
          path.setAttribute("fill", "none");
          path.setAttribute("data-from", String(parent.id));
          path.setAttribute("data-to", String(n.id));

          group.appendChild(path);
        }
      }
    });
  }

  public updateConnections(
    node: TreeNode,
    map: Map<string | number, TreeNode>,
    svg: SVGSVGElement
  ): void {
    // Update connections where the node is a parent
    node.children.forEach((child) => {
      if (!node.collapsed) {
        const connection = svg.querySelector(
          `path[data-from="${node.id}"][data-to="${child.id}"]`
        );
        if (connection) {
          // Use nodeWidth/2 for horizontal center
          const nodeWidthHalf = this.options.nodeWidth! / 2;

          const x1 = (node.x || 0) + nodeWidthHalf;
          const y1 = (node.y || 0) + this.options.nodeHeight!;
          const x2 = (child.x || 0) + nodeWidthHalf;
          const y2 = child.y || 0;

          // Create an S-shaped curve
          const d = this.createSCurve(x1, y1, x2, y2);

          connection.setAttribute("d", d);
        }
      }
    });

    // Update connection where the node is a child
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent && !parent.collapsed) {
        const connection = svg.querySelector(
          `path[data-from="${parent.id}"][data-to="${node.id}"]`
        );
        if (connection) {
          // Use nodeWidth/2 for horizontal center
          const nodeWidthHalf = this.options.nodeWidth! / 2;

          const x1 = (parent.x || 0) + nodeWidthHalf;
          const y1 = (parent.y || 0) + this.options.nodeHeight!;
          const x2 = (node.x || 0) + nodeWidthHalf;
          const y2 = node.y || 0;

          // Create an S-shaped curve
          const d = this.createSCurve(x1, y1, x2, y2);
          connection.setAttribute("d", d);
        }
      }
    }
  }
}

// Handles rendering and styling tree nodes
export class NodeRenderer {
  private options: SVGTreeViewerOptions;
  private connectionRenderer: ConnectionRenderer;
  private treeBuilder: TreeBuilder;

  constructor(
    options: SVGTreeViewerOptions,
    connectionRenderer: ConnectionRenderer,
    treeBuilder: TreeBuilder
  ) {
    this.options = options;
    this.connectionRenderer = connectionRenderer;
    this.treeBuilder = treeBuilder;
  }

  public setupNodeGroup(node: TreeNode): void {
    node.current_node_element.setAttribute("class", "node-group");
    node.current_node_element.setAttribute("data-id", String(node.id));
    node.current_node_element.setAttribute(
      "transform",
      `translate(${node.x || 0}, ${node.y || 0})`
    );
  }

  public setupNodeDragHandle(node: TreeNode): void {
    const dragHandle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    dragHandle.setAttribute("width", String(this.options.nodeWidth));
    dragHandle.setAttribute("height", String(this.options.nodeHeight));
    dragHandle.setAttribute("fill", "transparent");
    dragHandle.setAttribute("class", "drag-handle");
    dragHandle.setAttribute("cursor", "move");
    node.current_node_element.appendChild(dragHandle);
  }

  public setupNodeContent(node: TreeNode): void {
    const f = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    f.setAttribute("width", String(this.options.nodeWidth));
    f.setAttribute("height", String(this.options.nodeHeight));

    const div = document.createElement("div");
    div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    div.innerHTML = this.treeBuilder.processTemplate(
      this.options.template!,
      node
    );
    div.style.cssText = `
		  font-family: sans-serif;
		  background: white;
		  border: 1px solid #ccc;
		  border-radius: 6px;
		  padding: 10px;
		  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
		  width: 100%;
		  height: 100%;
		  box-sizing: border-box;
		  overflow: auto;
		  display: flex;
		  object-fit: contain;
		  flex-direction: column;
		  position: relative;
		  item-align: center;
		  justify-content: center;
	  `;

    if (this.options.collapseChild && node.children.length > 0) {
      this.addCollapseButton(node, div);
    }

    f.appendChild(div);
    node.current_node_element.appendChild(f);
  }

  public addCollapseButton(node: TreeNode, container: HTMLElement): void {
    const btnWrapper = document.createElement("div");
    btnWrapper.style.cssText = `
		  display: flex;
		  justify-content: center;
		  width: 100%;
	  `;

    const btn = document.createElement("button");
    btn.className = "collapse-btn";
    btn.innerHTML = node.collapsed
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.title = node.collapsed ? "Expand children" : "Collapse children";
    btn.style.cssText = `
		  margin-top: 8px;
		  padding: 4px 6px;
		  font-size: 12px;
		  background:rgb(246, 238, 226);
		  color: black;
		  border: none;
		  border-radius: 4px;
		  cursor: pointer;
	  `;

    // Use a custom event for collapsing to decouple from rendering logic
    btn.onclick = (e) => {
      e.stopPropagation();
      const event = new CustomEvent("node:toggle-collapse", {
        bubbles: true,
        detail: { nodeId: node.id },
      });
      btn.dispatchEvent(event);
    };

    btnWrapper.appendChild(btn);
    container.appendChild(btnWrapper);
  }

  public adjustNodeHeight(node: TreeNode): void {
    const div = node.current_node_element.querySelector("div") as HTMLElement;
    const f = node.current_node_element.querySelector(
      "foreignObject"
    ) as SVGForeignObjectElement;
    const dragHandle = node.current_node_element.querySelector(
      "rect"
    ) as SVGRectElement;

    requestAnimationFrame(() => {
      const contentHeight = div.getBoundingClientRect().height;
      const height = Math.max(contentHeight, 40);
      f.setAttribute("height", String(height));
      dragHandle.setAttribute("height", String(height));
    });
  }

  public drawNodes(flat: TreeNode[], group: SVGGElement): void {
    flat.forEach((n) => {
      this.setupNodeGroup(n);
      this.setupNodeDragHandle(n);
      this.setupNodeContent(n);

      group.appendChild(n.current_node_element);

      if (this.options.nodeHeight! <= 0) {
        this.adjustNodeHeight(n);
      }
    });
  }
}

// Handles the layout algorithm
export class TreeLayoutEngine {
  private options: SVGTreeViewerOptions;

  constructor(options: SVGTreeViewerOptions) {
    this.options = options;
  }

  public layoutTree(nodes: TreeNode[]): TreeNode[] {
    const { levelHeight, horizontalSpacing, nodePadding } = this.options;
    let flat: TreeNode[] = [];

    // First pass: calculate positions using the improved layout algorithm
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
        return { node, width: Math.max(horizontalSpacing || 200, totalWidth) };
      }

      // For normal nodes or first-time layout
      if (!node.children.length || node.collapsed) {
        node.x = x;
        node.y = depth * (levelHeight || 150);
        node.origX = x; // Store original position
        node.origY = depth * (levelHeight || 150);
        flat.push(node);
        return { node, width: horizontalSpacing || 200 };
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
        totalWidth = horizontalSpacing || 200;
      }

      // Center the parent over its children
      const leftMostChild = childResults[0].node;
      const rightMostChild = childResults[childResults.length - 1].node;

      const leftEdge = leftMostChild.x || 0;
      const rightEdge =
        (rightMostChild.x || 0) + (this.options.nodeWidth || 160);
      const center =
        leftEdge +
        (rightEdge - leftEdge) / 2 -
        (this.options.nodeWidth || 160) / 2;

      node.x = center;
      node.y = depth * (levelHeight || 150);
      node.origX = center; // Store original position
      node.origY = depth * (levelHeight || 150);

      flat.push(node);
      return { node, width: totalWidth };
    };

    // Process each root node
    let xOffset = 0;
    nodes.forEach((root) => {
      const result = calculatePositions(root, 0, xOffset);
      xOffset += result.width + (nodePadding || 40); // Add extra padding between trees
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

  public calculateTreeBounds(nodes: TreeNode[]): TreeBounds {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + (this.options.nodeWidth || 160));
      }

      if (node.y !== undefined) {
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + (this.options.nodeHeight || 100));
      }
    });

    return { minX, minY, maxX, maxY };
  }
}

// Handles UI controls and interactions
export class UIController {
  private options: SVGTreeViewerOptions;
  private container: HTMLElement;

  constructor(options: SVGTreeViewerOptions) {
    this.options = options;
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      throw new Error(
        `Container with ID "${this.options.containerId}" not found`
      );
    }
    this.container = container;
  }

  public renderActionButtons(
    onZoomIn: () => void,
    onZoomOut: () => void,
    onReset: () => void,
    onCenter: () => void
  ): void {
    const zoomeInBtn = document.createElement("button");
    const zoomOutBtn = document.createElement("button");
    const resetBtn = document.createElement("button");
    const centerBtn = document.createElement("button");

    zoomeInBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-in"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`; // Plus
    zoomOutBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-out"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`; // Minus
    resetBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`; // Reset
    centerBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`; // center

    zoomeInBtn.title = "Zoom in";
    zoomOutBtn.title = "Zoom out";
    resetBtn.title = "Reset view";
    centerBtn.title = "Center tree";

    const buttonStyle = `
		margin: 4px;
		padding: 4px 6px;
		font-size: 12px;
		background:rgb(246, 238, 226, 0.5);
		box-shadow: 0 2px 5px rgba(0,0,0,0.1);
		color: black;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		opacity: 0.3;
		transition: opacity 0.2s ease-in-out;
	  `;

    [zoomeInBtn, zoomOutBtn, resetBtn, centerBtn].forEach((btn) => {
      btn.style.cssText = buttonStyle;
      btn.onmouseenter = () => {
        btn.style.opacity = "0.9";
      };
      btn.onmouseleave = () => {
        btn.style.opacity = "0.3";
      };
    });

    zoomeInBtn.onclick = onZoomIn;
    zoomOutBtn.onclick = onZoomOut;
    resetBtn.onclick = onReset;
    centerBtn.onclick = onCenter;

    const btn_wrapper = document.createElement("div");
    this.container.style.position = "relative";

    btn_wrapper.style.cssText = `
		display: flex;
		flex-direction: column;
		gap: 5px;
		justify-content: center;
		width: 100%;
		position: absolute;
		top: 5px;
		right: 5px;
		width: 40px;
		z-index: 100;
		pointer-events: auto;
		transition: opacity 0.3s ease-in-out, transform 0.3s ease;
	  `;

    btn_wrapper.append(zoomeInBtn, zoomOutBtn, resetBtn, centerBtn);
    this.container.append(btn_wrapper);
  }
}

// Handles node dragging functionality
export class DragManager {
  private options: SVGTreeViewerOptions;
  private svg: SVGSVGElement;
  private connectionRenderer: ConnectionRenderer;
  private nodeMap: Map<string | number, TreeNode> = new Map();

  constructor(
    options: SVGTreeViewerOptions,
    svg: SVGSVGElement,
    connectionRenderer: ConnectionRenderer
  ) {
    this.options = options;
    this.svg = svg;
    this.connectionRenderer = connectionRenderer;
  }

  public setNodeMap(map: Map<string | number, TreeNode>): void {
    this.nodeMap = map;
  }

  public enableNodeDragging(node: TreeNode): void {
    // Return early if node dragging is disabled
    if (!this.options.nodeDraggable) return;

    const element = node.current_node_element;

    // Clean up existing listeners if any
    const cleanupKey = `drag_cleanup_${node.id}`;
    if ((element as any)[cleanupKey]) {
      (element as any)[cleanupKey]();
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scale = 1; // Will be updated by SVGTreeViewer

    const onMouseDown = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest(".collapse-btn")) {
        return; // Ignore if clicking collapse button
      }
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      element.classList.add("dragging");

      // Bring node to front
      const parent = element.parentNode;
      if (parent) {
        parent.appendChild(element);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;

      if (node.x !== undefined && node.y !== undefined) {
        // Mark this node as manually positioned
        node.manuallyPositioned = true;

        // Update node coordinates
        node.x += dx;
        node.y += dy;

        // Update the node position in the DOM
        element.setAttribute("transform", `translate(${node.x}, ${node.y})`);

        // Update the connecting lines for just this node
        this.connectionRenderer.updateConnections(node, this.nodeMap, this.svg);
      }

      startX = e.clientX;
      startY = e.clientY;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      element.classList.remove("dragging");
    };

    // Attach listeners
    element.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // Store cleanup function
    (element as any)[cleanupKey] = () => {
      element.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }

  private scale: number = 1;

  public setScale(scale: number): void {
    this.scale = scale;
  }
}

// Main SVGTreeViewer class - Orchestrates all modules
export class SVGTreeViewer {
  private options: SVGTreeViewerOptions;
  private nodes: TreeNode[];
  private svg!: SVGSVGElement;
  private group!: SVGGElement;
  private treeBounds: TreeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  // Module instances
  private treeBuilder: TreeBuilder;
  private backgroundRenderer: BackgroundRenderer;
  private nodeRenderer: NodeRenderer;
  private connectionRenderer: ConnectionRenderer;
  private layoutEngine: TreeLayoutEngine;
  private uiController: UIController;
  private dragManager: DragManager;
  private eventManager: EventManager;

  constructor(options: SVGTreeViewerOptions) {
    this.options = {
      ...DefaultOptions,
      ...options,
    };

    // Initialize modules
    this.treeBuilder = new TreeBuilder(this.options);
    this.backgroundRenderer = new BackgroundRenderer(this.options);
    this.connectionRenderer = new ConnectionRenderer(this.options);
    this.layoutEngine = new TreeLayoutEngine(this.options);

    // Build initial tree structure
    this.nodes = this.treeBuilder.buildTree(this.options.data || []);

    // Initialize UI components and SVG
    this._renderSVG();

    // Initialize remaining modules that need SVG reference
    this.nodeRenderer = new NodeRenderer(
      this.options,
      this.connectionRenderer,
      this.treeBuilder
    );
    this.dragManager = new DragManager(
      this.options,
      this.svg,
      this.connectionRenderer
    );
    this.eventManager = new EventManager(this.svg, this.group);
    this.uiController = new UIController(this.options);

    // Set up event handlers
    this._setupEventHandlers();

    // Render tree and center
    this._renderTree();
    this.centerTree();
  }

  private _renderSVG(): void {
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      throw new Error(
        `Container with ID "${this.options.containerId}" not found`
      );
    }

    container.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Set the background color
    svg.style.background = this.options.backgroundColor || "#f9f9f9";

    // Apply the background pattern
    this.backgroundRenderer.applyBackgroundPattern(svg);

    // Create the main group for panning and zooming
    this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.group.setAttribute("id", "panZoomGroup");
    svg.appendChild(this.group);

    container.appendChild(svg);
    this.svg = svg;
  }

  private _setupEventHandlers(): void {
    // Set up UI controls
    this.uiController.renderActionButtons(
      () => this._handleZoomIn(),
      () => this._handleZoomOut(),
      () => this.resetView(),
      () => this.centerTree()
    );

    // Set up pan and zoom events
    this.eventManager.attachPanAndZoomEvents((scale, panX, panY) => {
      this._updateTransform(scale, panX, panY);
      // Update scale in drag manager for proper dragging
      this.dragManager.setScale(scale);
    });

    // Set up node collapse event listener
    this.svg.addEventListener("node:toggle-collapse", (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.nodeId) {
        this.toggleNodeCollapse(customEvent.detail.nodeId);
      }
    });
  }

  private _updateTransform(scale: number, panX: number, panY: number): void {
    this.group.setAttribute(
      "transform",
      `translate(${panX}, ${panY}) scale(${scale})`
    );
  }

  private _handleZoomIn(): void {
    const transform = this.eventManager.getTransform();
    this.eventManager.setTransform(
      transform.scale * 1.1,
      transform.panX,
      transform.panY
    );
    this._updateTransform(
      transform.scale * 1.1,
      transform.panX,
      transform.panY
    );
  }

  private _handleZoomOut(): void {
    const transform = this.eventManager.getTransform();
    this.eventManager.setTransform(
      transform.scale / 1.1,
      transform.panX,
      transform.panY
    );
    this._updateTransform(
      transform.scale / 1.1,
      transform.panX,
      transform.panY
    );
  }

  private _renderTree(): void {
    this.group.innerHTML = "";

    // Calculate layout and get flat array of nodes
    const flat = this.layoutEngine.layoutTree(this.nodes);

    // Create node map for faster lookups
    const nodeMap = new Map(flat.map((n) => [n.id, n]));

    // Update node map in drag manager
    this.dragManager.setNodeMap(nodeMap);

    // Draw connections and nodes
    this.connectionRenderer.drawConnectionLines(flat, nodeMap, this.group);
    this.nodeRenderer.drawNodes(flat, this.group);

    // Enable dragging for nodes if option is enabled
    if (this.options.nodeDraggable) {
      flat.forEach((node) => {
        this.dragManager.enableNodeDragging(node);
      });
    }

    // Calculate tree bounds for centering
    const allNodes = this.treeBuilder.getAllNodes(this.nodes);
    this.treeBounds = this.layoutEngine.calculateTreeBounds(allNodes);

    // Apply current transform
    const transform = this.eventManager.getTransform();
    this._updateTransform(transform.scale, transform.panX, transform.panY);
  }

  // Public API methods

  /**
   * Update the data and re-render the tree
   * @param data New data to render
   */
  public updateData(data: TreeNodeData[]): void {
    this.options.data = data;
    this.nodes = this.treeBuilder.buildTree(data);
    this._renderTree();
    this.centerTree();
  }

  /**
   * Reset view to initial state (scale and position)
   */
  public resetView(): void {
    this.eventManager.resetView();
    const transform = this.eventManager.getTransform();
    this._updateTransform(transform.scale, transform.panX, transform.panY);
  }

  /**
   * Reset the positions of all nodes to their calculated positions
   */
  public resetNodePositions(): void {
    const allNodes = this.treeBuilder.getAllNodes(this.nodes);
    allNodes.forEach((node) => {
      node.manuallyPositioned = false;
    });
    this._renderTree();
    this.centerTree();
  }

  /**
   * Toggle collapse state of a node by its id
   * @param id ID of the node to toggle
   */
  public toggleNodeCollapse(id: string | number): void {
    const allNodes = this.treeBuilder.getAllNodes(this.nodes);
    const node = allNodes.find((n) => n.id === id);

    if (node) {
      node.collapsed = !node.collapsed;
      this._renderTree();
    }
  }

  /**
   * Center the tree in the viewport
   */
  public centerTree(): void {
    // Get container dimensions
    const containerRect = this.svg.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate tree width and height
    const treeWidth = this.treeBounds.maxX - this.treeBounds.minX;
    const treeHeight = this.treeBounds.maxY - this.treeBounds.minY;

    // Calculate the scale to fit, but not exceeding 1:1
    const scaleX = containerWidth / (treeWidth + 100); // Add padding
    const scaleY = containerHeight / (treeHeight + 100); // Add padding
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 1:1

    // Calculate the pan to center
    const panX =
      (containerWidth - treeWidth * scale) / 2 - this.treeBounds.minX * scale;
    const panY =
      (containerHeight - treeHeight * scale) / 2 - this.treeBounds.minY * scale;

    // Update the transform
    this.eventManager.setTransform(scale, panX, panY);
    this._updateTransform(scale, panX, panY);
  }

  /**
   * Zoom to fit all nodes in the view
   */
  public zoomToFit(): void {
    const allNodes = this.treeBuilder.getAllNodes(this.nodes);

    if (allNodes.length === 0) return;

    // Use the tree bounds
    // Add padding
    const minX = this.treeBounds.minX - 50;
    const minY = this.treeBounds.minY - 50;
    const maxX = this.treeBounds.maxX + 50;
    const maxY = this.treeBounds.maxY + 50;

    // Get container dimensions
    const containerRect = this.svg.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate scale to fit
    const scaleX = containerWidth / (maxX - minX);
    const scaleY = containerHeight / (maxY - minY);
    const scale = Math.min(scaleX, scaleY, 1); // Limit max scale to 1

    // Calculate pan to center
    const panX = (containerWidth - (maxX - minX) * scale) / 2 - minX * scale;
    const panY = (containerHeight - (maxY - minY) * scale) / 2 - minY * scale;

    // Update the transform
    this.eventManager.setTransform(scale, panX, panY);
    this._updateTransform(scale, panX, panY);
  }
}

// Handles events and their propagation
export class EventManager {
  private svg: SVGSVGElement;
  private group: SVGGElement;
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  private isPanning: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  constructor(svg: SVGSVGElement, group: SVGGElement) {
    this.svg = svg;
    this.group = group;
  }

  public attachPanAndZoomEvents(
    onTransformUpdate: (scale: number, panX: number, panY: number) => void
  ): void {
    this.svg.addEventListener("mousedown", (e: MouseEvent) => {
      const target = e.target as Element;
      // Skip if we're clicking a collapse button or a drag handle
      if (target.closest(".collapse-btn") || target.closest(".drag-handle"))
        return;

      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    this.svg.addEventListener("mousemove", (e: MouseEvent) => {
      // Handle canvas panning
      if (this.isPanning) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        onTransformUpdate(this.scale, this.panX, this.panY);
      }
    });

    this.svg.addEventListener("mouseup", () => {
      this.isPanning = false;
    });

    this.svg.addEventListener("mouseleave", () => {
      this.isPanning = false;
    });

    this.svg.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const zoomAmount = direction > 0 ? zoomFactor : 1 / zoomFactor;

      const rect = this.svg.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const svgX = (offsetX - this.panX) / this.scale;
      const svgY = (offsetY - this.panY) / this.scale;

      // Update scale
      this.scale *= zoomAmount;

      // New pan to keep the pointer under cursor
      this.panX = offsetX - svgX * this.scale;
      this.panY = offsetY - svgY * this.scale;

      onTransformUpdate(this.scale, this.panX, this.panY);
    });
  }

  public resetView(): void {
    this.scale = 1;
    this.panX = 50;
    this.panY = 50;
  }

  public getTransform(): { scale: number; panX: number; panY: number } {
    return {
      scale: this.scale,
      panX: this.panX,
      panY: this.panY,
    };
  }

  public setTransform(scale: number, panX: number, panY: number): void {
    this.scale = scale;
    this.panX = panX;
    this.panY = panY;
  }
}

if (typeof window !== "undefined") {
  (window as any).SVGTreeViewer = SVGTreeViewer;
}

export default SVGTreeViewer;
