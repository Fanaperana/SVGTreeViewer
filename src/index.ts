interface TreeNodeData {
  [key: string]: any;
}

interface TreeNode {
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
  // New option for background
  backgroundPattern?: "dots" | "grid" | "none";
  backgroundColor?: string;
  patternColor?: string;
}

class SVGTreeViewer {
  private options: {
    containerId: string;
    data: TreeNodeData[];
    idAlias: string;
    parentIdAlias: string;
    collapseChild: boolean;
    template: string;
    nodeWidth: number;
    nodeHeight: number;
    nodePadding: number;
    levelHeight: number;
    horizontalSpacing: number;
    backgroundPattern: "dots" | "grid" | "none";
    backgroundColor: string;
    patternColor: string;
  };

  private nodes: TreeNode[];
  private scale: number;
  private panX: number;
  private panY: number;
  private svg!: SVGSVGElement;
  private group!: SVGGElement;
  private isPanning: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private draggedNode: TreeNode | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  // Store the dimensions of the entire tree for centering
  private treeBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  constructor(options: SVGTreeViewerOptions) {
    this.options = {
      containerId: options.containerId,
      data: options.data || [],
      idAlias: options.idAlias || "id",
      parentIdAlias: options.parentIdAlias || "parent_id",
      collapseChild: options.collapseChild || false,
      template: options.template || "<div class='node'>[data:text]</div>",
      nodeWidth: options.nodeWidth || 160,
      nodeHeight: options.nodeHeight || 100,
      nodePadding: options.nodePadding || 40,
      levelHeight: options.levelHeight || 150,
      horizontalSpacing: options.horizontalSpacing || 200,
      backgroundPattern: options.backgroundPattern || "dots",
      backgroundColor: options.backgroundColor || "#f9f9f9",
      patternColor: options.patternColor || "#cccccc",
    };

    this.nodes = this._buildTree();
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;

    this._renderSVG();
    this._attachEvents();
    this._renderTree();

    // Center the tree after initial rendering
    this.centerTree();
  }

  /**
   * Create a dot pattern element
   * @returns SVG defs element containing a dot pattern
   */
  private _createDotPattern(): SVGDefsElement {
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
    dot.setAttribute("fill", this.options.patternColor);

    pattern.appendChild(dot);
    defs.appendChild(pattern);

    return defs;
  }

  /**
   * Create a grid pattern element
   * @returns SVG defs element containing a grid pattern
   */
  private _createGridPattern(): SVGDefsElement {
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
    hLine.setAttribute("stroke", this.options.patternColor);
    hLine.setAttribute("stroke-width", "0.5");
    hLine.setAttribute("stroke-dasharray", "5, 5");

    // Vertical line
    const vLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    vLine.setAttribute("x1", "0");
    vLine.setAttribute("y1", "0");
    vLine.setAttribute("x2", "0");
    vLine.setAttribute("y2", "20");
    vLine.setAttribute("stroke", this.options.patternColor);
    vLine.setAttribute("stroke-width", "0.5");
    vLine.setAttribute("stroke-dasharray", "5, 5");

    pattern.appendChild(hLine);
    pattern.appendChild(vLine);
    defs.appendChild(pattern);

    return defs;
  }

  /**
   * Apply the selected pattern to the SVG
   * @param svg The SVG element to apply the pattern to
   */
  private _applyBackgroundPattern(svg: SVGSVGElement): void {
    if (this.options.backgroundPattern === "none") {
      return;
    }

    let defs: SVGDefsElement;
    let patternId: string;

    // Create the pattern based on the option
    if (this.options.backgroundPattern === "dots") {
      defs = this._createDotPattern();
      patternId = "dotPattern";
    } else {
      defs = this._createGridPattern();
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

  private _buildTree(): TreeNode[] {
    const map = new Map<string | number, TreeNode>();
    const { idAlias, parentIdAlias, data } = this.options;

    const flat: TreeNode[] = data.map((d) => ({
      ...d,
      id: d[idAlias],
      parent_id: d[parentIdAlias],
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
      child_node_elements: [], // Added missing property
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

  /**
   *
   */
  private _renderActionButtons(wrapper: HTMLElement): void {
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

    zoomeInBtn.onmouseenter = () => {
      zoomeInBtn.style.opacity = "0.9";
    };
    zoomeInBtn.onmouseleave = () => {
      zoomeInBtn.style.opacity = ".3";
    };

    zoomOutBtn.onmouseenter = () => {
      zoomOutBtn.style.opacity = "0.9";
    };
    zoomOutBtn.onmouseleave = () => {
      zoomOutBtn.style.opacity = ".3";
    };

    resetBtn.onmouseenter = () => {
      resetBtn.style.opacity = "0.9";
    };
    resetBtn.onmouseleave = () => {
      resetBtn.style.opacity = ".3";
    };

    centerBtn.onmouseenter = () => {
      centerBtn.style.opacity = "0.9";
    };
    centerBtn.onmouseleave = () => {
      centerBtn.style.opacity = ".3";
    };

    zoomeInBtn.style.cssText = `
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
        `;

    zoomOutBtn.style.cssText = `
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
        `;

    resetBtn.style.cssText = `
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
        `;

    centerBtn.style.cssText = `
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
        `;

    zoomeInBtn.onclick = () => {
      this.scale *= 1.1;
      this._updateTransform();
    };

    zoomOutBtn.onclick = () => {
      this.scale /= 1.1;
      this._updateTransform();
    };

    resetBtn.onclick = () => {
      this.resetView();
    };

    centerBtn.onclick = () => {
      this.centerTree();
    };

    const btn_wrapper = document.createElement("div");

    wrapper.style.position = "relative";

    // wrapper.onmouseenter = () => {
    //     btn_wrapper.style.opacity = '0.5';
    // }

    // wrapper.onmouseleave = () => {
    //     btn_wrapper.style.opacity = '0.1';
    // }

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
    wrapper.append(btn_wrapper);
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
    svg.style.background = this.options.backgroundColor;

    // Apply the background pattern
    this._applyBackgroundPattern(svg);

    // Add action buttons
    this._renderActionButtons(container);

    this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.group.setAttribute("id", "panZoomGroup");
    svg.appendChild(this.group);

    container.appendChild(svg);
    this.svg = svg;
  }

  private _attachEvents(): void {
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
      // Handle node dragging
      if (this.draggedNode) {
        const dx = (e.clientX - this.dragStartX) / this.scale;
        const dy = (e.clientY - this.dragStartY) / this.scale;

        if (
          this.draggedNode.x !== undefined &&
          this.draggedNode.y !== undefined
        ) {
          // Mark this node as manually positioned
          this.draggedNode.manuallyPositioned = true;

          // Get the node group
          const nodeGroup = this.svg.querySelector(
            `[data-id="${this.draggedNode.id}"]`
          ) as SVGGElement;
          if (nodeGroup) {
            // Update node coordinates
            this.draggedNode.x += dx;
            this.draggedNode.y += dy;

            // Update the node position in the DOM
            nodeGroup.setAttribute(
              "transform",
              `translate(${this.draggedNode.x}, ${this.draggedNode.y})`
            );

            // Update the connecting lines for just this node
            this._updateConnections(this.draggedNode);
          }
        }

        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        return;
      }

      // Handle canvas panning
      if (this.isPanning) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this._updateTransform();
      }
    });

    this.svg.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.draggedNode = null;
    });

    this.svg.addEventListener("mouseleave", () => {
      this.isPanning = false;
      this.draggedNode = null;
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

      this._updateTransform();
    });
  }

  private _setupNodeDragging(
    nodeGroup: SVGGElement,
    node: TreeNode,
    handle: SVGRectElement
  ): void {
    handle.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation(); // Prevent canvas panning
      e.preventDefault(); // Prevent text selection

      // Set the dragged node
      this.draggedNode = node;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;

      // Add a "dragging" class to the node for visual feedback
      nodeGroup.classList.add("dragging");

      // Bring the node to front while dragging
      this.group.appendChild(nodeGroup);
    });

    // Add double-click event for collapsing/expanding
    if (node.children.length > 0) {
      handle.addEventListener("dblclick", (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        node.collapsed = !node.collapsed;
        this._renderTree();
        this.centerTree();
      });
    }
  }

  // Method to create an S-shaped curve
  private _createSCurve(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string {
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

  private _updateConnections(node: TreeNode): void {
    const flat = this._getAllNodes(this.nodes);
    const map = new Map(flat.map((n) => [n.id, n]));

    // Update connections where the node is a parent
    node.children.forEach((child) => {
      if (!node.collapsed) {
        const connection = this.svg.querySelector(
          `path[data-from="${node.id}"][data-to="${child.id}"]`
        );
        if (connection) {
          // Use nodeWidth/2 for horizontal center
          const nodeWidthHalf = this.options.nodeWidth / 2;

          const x1 = (node.x || 0) + nodeWidthHalf;
          const y1 = (node.y || 0) + this.options.nodeHeight;
          const x2 = (child.x || 0) + nodeWidthHalf;
          const y2 = child.y || 0;

          // Create an S-shaped curve
          const d = this._createSCurve(x1, y1, x2, y2);

          connection.setAttribute("d", d);
        }
      }
    });

    // Update connection where the node is a child
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent && !parent.collapsed) {
        const connection = this.svg.querySelector(
          `path[data-from="${parent.id}"][data-to="${node.id}"]`
        );
        if (connection) {
          // Use nodeWidth/2 for horizontal center
          const nodeWidthHalf = this.options.nodeWidth / 2;

          const x1 = (parent.x || 0) + nodeWidthHalf;
          const y1 = (parent.y || 0) + this.options.nodeHeight;
          const x2 = (node.x || 0) + nodeWidthHalf;
          const y2 = node.y || 0;
          // const dx = (x2 - x1) / 2;

          // const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          // Create an S-shaped curve
          const d = this._createSCurve(x1, y1, x2, y2);
          connection.setAttribute("d", d);
        }
      }
    }
  }

  private _getAllNodes(nodes: TreeNode[]): TreeNode[] {
    let result: TreeNode[] = [];

    const traverse = (node: TreeNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };

    nodes.forEach(traverse);
    return result;
  }

  private _updateTransform(): void {
    this.group.setAttribute(
      "transform",
      `translate(${this.panX}, ${this.panY}) scale(${this.scale})`
    );
  }

  private _renderTree(): void {
    this.group.innerHTML = "";
    const flat = this._layoutTree(this.nodes);
    const map = new Map(flat.map((n) => [n.id, n]));

    this._drawConnectionLines(flat, map);
    this._drawNodes(flat);

    console.log(flat);

    this._updateTransform();
    const allNodes = this._getAllNodes(this.nodes);
    this._calculateTreeBounds(allNodes);
  }

  private _drawConnectionLines(
    flat: TreeNode[],
    map: Map<string | number, TreeNode>
  ): void {
    flat.forEach((n) => {
      if (n.parent_id && map.get(n.parent_id)) {
        const parent = map.get(n.parent_id);
        if (parent && !parent.collapsed) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );

          const nodeWidthHalf = this.options.nodeWidth / 2;
          const x1 = (parent.x || 0) + nodeWidthHalf;
          const y1 = (parent.y || 0) + this.options.nodeHeight;
          const x2 = (n.x || 0) + nodeWidthHalf;
          const y2 = n.y || 0;

          const d = this._createSCurve(x1, y1, x2, y2);

          path.setAttribute("d", d);
          path.setAttribute("stroke", "#ccc");
          path.setAttribute("stroke-width", "2");
          path.setAttribute("fill", "none");
          path.setAttribute("data-from", String(parent.id));
          path.setAttribute("data-to", String(n.id));

          this.group.appendChild(path);
        }
      }
    });
  }

  private _drawNodes(flat: TreeNode[]): void {
    flat.forEach((n) => {
      this._setupNodeGroup(n);
      this._setupNodeDragHandle(n);
      this._setupNodeContent(n);

      this.group.appendChild(n.current_node_element);

      if (this.options.nodeHeight <= 0) {
        this._adjustNodeHeight(n);
      }
    });
  }

  private _setupNodeGroup(node: TreeNode): void {
    node.current_node_element.setAttribute("class", "node-group");
    node.current_node_element.setAttribute("data-id", String(node.id));
    node.current_node_element.setAttribute(
      "transform",
      `translate(${node.x || 0}, ${node.y || 0})`
    );

    // Enable dragging for this node
    this._enableNodeDragging(node);
  }

  private _enableNodeDragging(node: TreeNode): void {
    const element = node.current_node_element;

    // Clean up existing listeners if any
    const cleanupKey = `drag_cleanup_${node.id}`;
    if ((element as any)[cleanupKey]) {
      (element as any)[cleanupKey]();
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;

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
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = (e.clientX - startX) / this.scale;
      const dy = (e.clientY - startY) / this.scale;

      if (node.x !== undefined && node.y !== undefined) {
        node.x += dx;
        node.y += dy;
        element.setAttribute("transform", `translate(${node.x}, ${node.y})`);
        this._updateConnections(node);
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

  private _setupNodeDragHandle(node: TreeNode): void {
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

    this._setupNodeDragging(node.current_node_element, node, dragHandle);
  }

  private _setupNodeContent(node: TreeNode): void {
    const f = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    f.setAttribute("width", String(this.options.nodeWidth));
    f.setAttribute("height", String(this.options.nodeHeight));

    const div = document.createElement("div");
    div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    div.innerHTML = this._processTemplate(this.options.template, node);
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
      this._addCollapseButton(node, div);
    }

    f.appendChild(div);
    node.current_node_element.appendChild(f);
  }

  private _addCollapseButton(node: TreeNode, container: HTMLElement): void {
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
    btn.onclick = (e) => {
      e.stopPropagation();
      node.collapsed = !node.collapsed;
      this._renderTree();
    };

    btnWrapper.appendChild(btn);
    container.appendChild(btnWrapper);
  }

  private _adjustNodeHeight(node: TreeNode): void {
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

  /**
   * Calculate the bounds of the entire tree
   * @param nodes List of all nodes in the tree
   */
  private _calculateTreeBounds(nodes: TreeNode[]): void {
    if (nodes.length === 0) {
      this.treeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      return;
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + this.options.nodeWidth);
      }

      if (node.y !== undefined) {
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + this.options.nodeHeight);
      }
    });

    this.treeBounds = { minX, minY, maxX, maxY };
  }

  private _layoutTree(nodes: TreeNode[]): TreeNode[] {
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
      const rightEdge = (rightMostChild.x || 0) + this.options.nodeWidth;
      const center =
        leftEdge + (rightEdge - leftEdge) / 2 - this.options.nodeWidth / 2;

      node.x = center;
      node.y = depth * levelHeight;
      node.origX = center; // Store original position
      node.origY = depth * levelHeight;

      flat.push(node);
      return { node, width: totalWidth };
    };

    // Process each root node
    let xOffset = 0;
    nodes.forEach((root) => {
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

  private _processTemplate(template: string, node: TreeNode): string {
    return template.replace(/\[data:(.+?)\]/g, (_, key) => {
      // return dataObj[key] !== undefined ? String(dataObj[key]) : '';
      return node.data?.data?.[key] ?? "";
    });
  }

  // Public methods for external control

  /**
   * Update the data and re-render the tree
   * @param data New data to render
   */
  public updateData(data: TreeNodeData[]): void {
    this.options.data = data;
    this.nodes = this._buildTree();
    this._renderTree();
    this.centerTree();
  }

  /**
   * Reset view to initial state (center and scale)
   */
  public resetView(): void {
    this.scale = 1;
    this.panX = 50;
    this.panY = 50;
    this._updateTransform();
  }

  /**
   * Reset the positions of all nodes to their calculated positions
   */
  public resetNodePositions(): void {
    const allNodes = this._getAllNodes(this.nodes);
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
    const allNodes = this._getAllNodes(this.nodes);
    const node = allNodes.find((n) => n.id === id);

    if (node) {
      node.collapsed = !node.collapsed;
      this._renderTree();
      this.centerTree();
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
    this.scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 1:1

    // Calculate the pan to center
    this.panX =
      (containerWidth - treeWidth * this.scale) / 2 -
      this.treeBounds.minX * this.scale;
    this.panY =
      (containerHeight - treeHeight * this.scale) / 2 -
      this.treeBounds.minY * this.scale;

    this._updateTransform();
  }

  /**
   * Zoom to fit all nodes in the view
   */
  public zoomToFit(): void {
    // Implementation would calculate the bounds of all nodes
    // and set scale and pan to fit everything in view
    const allNodes = this._getAllNodes(this.nodes);

    if (allNodes.length === 0) return;

    // Find min/max coordinates
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    allNodes.forEach((node) => {
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + 160); // Node width
      }

      if (node.y !== undefined) {
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + 90); // Approximate node height
      }
    });

    // Add padding
    minX -= 50;
    minY -= 50;
    maxX += 50;
    maxY += 50;

    // Get container dimensions
    const containerRect = this.svg.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate scale to fit
    const scaleX = containerWidth / (maxX - minX);
    const scaleY = containerHeight / (maxY - minY);
    this.scale = Math.min(scaleX, scaleY, 1); // Limit max scale to 1

    // Calculate pan to center
    this.panX =
      (containerWidth - (maxX - minX) * this.scale) / 2 - minX * this.scale;
    this.panY =
      (containerHeight - (maxY - minY) * this.scale) / 2 - minY * this.scale;

    this._updateTransform();
  }
}

// Optional: attach to window for global use
if (typeof window !== "undefined") {
  (window as any).SVGTreeViewer = SVGTreeViewer;
}

export { SVGTreeViewer };

export default SVGTreeViewer;
