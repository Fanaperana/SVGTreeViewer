import { SVGTreeViewerOptions } from './interfaces';
import { TreeNode } from './TreeNode';

/**
 * Handles rendering the tree to the SVG canvas
 */
export class TreeRenderer {
  private options: Required<SVGTreeViewerOptions>;
  private container: HTMLElement;
  public svg: SVGSVGElement;
  public group: SVGGElement;

  constructor(options: Required<SVGTreeViewerOptions>) {
    this.options = options;
    this.container = document.getElementById(options.containerId) as HTMLElement;
    
    if (!this.container) {
      throw new Error(`Container with ID "${options.containerId}" not found`);
    }
    
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  }

  /**
   * Initialize the SVG canvas
   */
  initializeSVG(): void {
    this.container.innerHTML = "";

    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.style.background = this.options.backgroundColor;

    this._applyBackgroundPattern();

    this.group.setAttribute("id", "panZoomGroup");
    this.svg.appendChild(this.group);

    this.container.appendChild(this.svg);
    this._renderActionButtons();
  }

  /**
   * Render the entire tree
   */
  renderTree(nodes: TreeNode[]): void {
    // Clear the existing tree
    this.group.innerHTML = "";
    
    // Draw connections between nodes
    this._drawConnectionLines(nodes);
    
    // Draw nodes
    nodes.forEach(node => {
      this._drawNode(node);
    });
  }

  /**
   * Update the transformation (pan & zoom)
   */
  updateTransform(panX: number, panY: number, scale: number): void {
    this.group.setAttribute(
      "transform",
      `translate(${panX}, ${panY}) scale(${scale})`
    );
  }

  /**
   * Draw connecting lines between nodes
   */
  private _drawConnectionLines(nodes: TreeNode[]): void {
    const { nodeWidth, nodeHeight } = this.options;
    
    nodes.forEach(node => {
      if (node.parent && !node.parent.collapsed) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        const nodeWidthHalf = nodeWidth / 2;
        const x1 = (node.parent.x || 0) + nodeWidthHalf;
        const y1 = (node.parent.y || 0) + nodeHeight;
        const x2 = (node.x || 0) + nodeWidthHalf;
        const y2 = node.y || 0;
        
        const d = this._createSCurve(x1, y1, x2, y2);
        
        path.setAttribute("d", d);
        path.setAttribute("stroke", "#ccc");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        path.setAttribute("data-from", String(node.parent.id));
        path.setAttribute("data-to", String(node.id));
        
        this.group.appendChild(path);
      }
    });
  }

  /**
   * Update connections for a specific node
   */
  updateConnections(node: TreeNode): void {
    const { nodeWidth, nodeHeight } = this.options;
    
    // Update connections where the node is a parent
    node.children.forEach(child => {
      if (!node.collapsed) {
        const connection = this.svg.querySelector(
          `path[data-from="${node.id}"][data-to="${child.id}"]`
        );
        
        if (connection) {
          const nodeWidthHalf = nodeWidth / 2;
          const x1 = (node.x || 0) + nodeWidthHalf;
          const y1 = (node.y || 0) + nodeHeight;
          const x2 = (child.x || 0) + nodeWidthHalf;
          const y2 = child.y || 0;
          
          const d = this._createSCurve(x1, y1, x2, y2);
          connection.setAttribute("d", d);
        }
      }
    });
    
    // Update connection where the node is a child
    if (node.parent) {
      if (!node.parent.collapsed) {
        const connection = this.svg.querySelector(
          `path[data-from="${node.parent.id}"][data-to="${node.id}"]`
        );
        
        if (connection) {
          const nodeWidthHalf = nodeWidth / 2;
          const x1 = (node.parent.x || 0) + nodeWidthHalf;
          const y1 = (node.parent.y || 0) + nodeHeight;
          const x2 = (node.x || 0) + nodeWidthHalf;
          const y2 = node.y || 0;
          
          const d = this._createSCurve(x1, y1, x2, y2);
          connection.setAttribute("d", d);
        }
      }
    }
  }

  /**
   * Draw a single node
   */
  private _drawNode(node: TreeNode): void {
    this._setupNodeGroup(node);
    this._setupNodeContent(node);
    
    this.group.appendChild(node.current_node_element);
  }

  /**
   * Set up the node group element
   */
  private _setupNodeGroup(node: TreeNode): void {
    const element = node.current_node_element;
    element.setAttribute("class", "node-group");
    element.setAttribute("data-id", String(node.id));
    element.setAttribute("transform", `translate(${node.x || 0}, ${node.y || 0})`);
  }

  /**
   * Set up the content of a node
   */
  private _setupNodeContent(node: TreeNode): void {
    // Create drag handle
    const dragHandle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    dragHandle.setAttribute("width", String(this.options.nodeWidth));
    dragHandle.setAttribute("height", String(this.options.nodeHeight));
    dragHandle.setAttribute("fill", "transparent");
    dragHandle.setAttribute("class", "drag-handle");
    dragHandle.setAttribute("cursor", "move");
    node.current_node_element.appendChild(dragHandle);

    // Create foreign object for HTML content
    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObject.setAttribute("width", String(this.options.nodeWidth));
    foreignObject.setAttribute("height", String(this.options.nodeHeight));

    // Create container div
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
        align-items: center;
        justify-content: center;
    `;

    // Add collapse button if needed
    if (this.options.collapseChild && node.children.length > 0) {
      this._addCollapseButton(node, div);
    }

    foreignObject.appendChild(div);
    node.current_node_element.appendChild(foreignObject);
  }

  /**
   * Add a collapse/expand button to a node
   */
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
    
    // We'll attach handlers in the interaction manager
    btn.setAttribute("data-node-id", String(node.id));

    btnWrapper.appendChild(btn);
    container.appendChild(btnWrapper);
  }

  /**
   * Process the template string with node data
   */
  private _processTemplate(template: string, node: TreeNode): string {
    return template.replace(/\[data:(.+?)\]/g, (_, key) => {
      return node.data[key] !== undefined ? String(node.data[key]) : '';
    });
  }

  /**
   * Create an S-shaped curve between two points
   */
  private _createSCurve(x1: number, y1: number, x2: number, y2: number): string {
    // Calculate the vertical distance
    const dy = y2 - y1;

    // Calculate control points for S-curve
    const cp1x = x1;
    const cp1y = y1 + dy * 0.5; // 50% down the vertical distance
    const cp2x = x2;
    const cp2y = y2 - dy * 0.5; // 50% up from the ending point

    // Create bezier curve command
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }

  /**
   * Render the action buttons for zooming and panning
   */
  private _renderActionButtons(): void {
    const btnWrapper = document.createElement("div");
    btnWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        justify-content: center;
        position: absolute;
        top: 5px;
        right: 5px;
        width: 40px;
        z-index: 100;
        pointer-events: auto;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease;
    `;

    // Create zoom in button
    const zoomInBtn = this._createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`,
      "Zoom in"
    );
    
    // Create zoom out button
    const zoomOutBtn = this._createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`,
      "Zoom out"
    );
    
    // Create reset button
    const resetBtn = this._createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
      "Reset view"
    );
    
    // Create center button
    const centerBtn = this._createActionButton(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
      "Center tree"
    );
    
    // Add data attributes for event handling
    zoomInBtn.setAttribute("data-action", "zoom-in");
    zoomOutBtn.setAttribute("data-action", "zoom-out");
    resetBtn.setAttribute("data-action", "reset");
    centerBtn.setAttribute("data-action", "center");
    
    // Add buttons to wrapper
    btnWrapper.append(zoomInBtn, zoomOutBtn, resetBtn, centerBtn);
    this.container.append(btnWrapper);
  }
  
  /**
   * Create an action button with hover effects
   */
  private _createActionButton(svg: string, title: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = svg;
    button.title = title;
    
    button.style.cssText = `
      margin: 4px;
      padding: 4px 6px;
      font-size: 12px;
      background: rgba(246, 238, 226, 0.5);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      color: black;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      opacity: 0.3;
      transition: opacity 0.2s ease;
    `;
    
    button.onmouseenter = () => {
      button.style.opacity = "0.9";
    };
    
    button.onmouseleave = () => {
      button.style.opacity = "0.3";
    };
    
    return button;
  }
  
  /**
   * Create and apply a dot pattern background
   */
  private _createDotPattern(): SVGDefsElement {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", "dotPattern");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", "2");
    dot.setAttribute("cy", "2");
    dot.setAttribute("r", "0.5");
    dot.setAttribute("fill", this.options.patternColor);
    
    pattern.appendChild(dot);
    defs.appendChild(pattern);
    
    return defs;
  }
  
  /**
   * Create and apply a grid pattern background
   */
  private _createGridPattern(): SVGDefsElement {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", "gridPattern");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    
    // Horizontal line
    const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hLine.setAttribute("x1", "0");
    hLine.setAttribute("y1", "0");
    hLine.setAttribute("x2", "20");
    hLine.setAttribute("y2", "0");
    hLine.setAttribute("stroke", this.options.patternColor);
    hLine.setAttribute("stroke-width", "0.5");
    
    // Vertical line
    const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vLine.setAttribute("x1", "0");
    vLine.setAttribute("y1", "0");
    vLine.setAttribute("x2", "0");
    vLine.setAttribute("y2", "20");
    vLine.setAttribute("stroke", this.options.patternColor);
    vLine.setAttribute("stroke-width", "0.5");
    
    pattern.appendChild(hLine);
    pattern.appendChild(vLine);
    defs.appendChild(pattern);
    
    return defs;
  }
  
  /**
   * Apply the selected background pattern to the SVG
   */
  private _applyBackgroundPattern(): void {
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
    
    this.svg.appendChild(defs);
    
    // Create the background rectangle with the pattern
    const patternRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    patternRect.setAttribute("width", "100%");
    patternRect.setAttribute("height", "100%");
    patternRect.setAttribute("fill", `url(#${patternId})`);
    this.svg.appendChild(patternRect);
  }
}