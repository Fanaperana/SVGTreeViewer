import { TreeBounds } from './interfaces';
import { TreeNode } from './TreeNode';
import { TreeRenderer } from './TreeRenderer';

/**
 * Handles all user interactions with the tree (panning, zooming, node dragging)
 */
export class InteractionManager {
  private svg: SVGSVGElement;
  private renderer: TreeRenderer;
  private treeContainer: HTMLElement;
  
  // State for transformations
  private scale: number = 1;
  private panX: number = 0;
  private panY: number = 0;
  
  // State for panning
  private isPanning: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  
  // State for dragging
  private draggedNode: TreeNode | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  
  // Callback functions
  private onNodeDraggedCallback: ((node: TreeNode) => void) | null = null;
  private onNodeCollapsedCallback: ((node: TreeNode) => void) | null = null;
  
  constructor(
    renderer: TreeRenderer, 
    container: HTMLElement
  ) {
    this.svg = renderer.svg;
    this.renderer = renderer;
    this.treeContainer = container;
  }
  
  /**
   * Attach event listeners for all interactions
   */
  attachEvents(): void {
    this._attachPanningEvents();
    this._attachZoomEvents();
    this._attachButtonEvents();
  }
  
  /**
   * Set callbacks for interaction events
   */
  setCallbacks(
    onNodeDragged: (node: TreeNode) => void,
    onNodeCollapsed: (node: TreeNode) => void
  ): void {
    this.onNodeDraggedCallback = onNodeDragged;
    this.onNodeCollapsedCallback = onNodeCollapsed;
  }
  
  /**
   * Setup dragging for a specific node
   */
  setupNodeDragging(node: TreeNode): void {
    const nodeElement = this.svg.querySelector(`[data-id="${node.id}"]`) as SVGGElement;
    if (!nodeElement) return;
    
    const dragHandle = nodeElement.querySelector('.drag-handle') as SVGRectElement;
    if (!dragHandle) return;
    
    // Add mousedown event for dragging
    dragHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.stopPropagation(); // Prevent canvas panning
      e.preventDefault(); // Prevent text selection
      
      // Set the dragged node
      this.draggedNode = node;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      
      // Add a "dragging" class for visual feedback
      nodeElement.classList.add('dragging');
      
      // Bring node to front while dragging
      this.renderer.group.appendChild(nodeElement);
    });
    
    // Setup collapse button if it exists
    if (node.children.length > 0) {
      const collapseBtn = nodeElement.querySelector('.collapse-btn') as HTMLButtonElement;
      if (collapseBtn) {
        collapseBtn.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          
          // Toggle the node's collapsed state
          node.toggleCollapse();
          
          // Notify using callback
          if (this.onNodeCollapsedCallback) {
            this.onNodeCollapsedCallback(node);
          }
        });
      }
    }
  }
  
  /**
   * Set the transform values
   */
  setTransform(panX: number, panY: number, scale: number): void {
    this.panX = panX;
    this.panY = panY;
    this.scale = scale;
    this.updateTransform();
  }
  
  /**
   * Update the SVG transform
   */
  updateTransform(): void {
    this.renderer.updateTransform(this.panX, this.panY, this.scale);
  }
  
  /**
   * Center the tree in the viewport
   */
  centerTree(treeBounds: TreeBounds): void {
    // Get container dimensions
    const containerRect = this.svg.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calculate tree width and height
    const treeWidth = treeBounds.maxX - treeBounds.minX;
    const treeHeight = treeBounds.maxY - treeBounds.minY;
    
    // Calculate the scale to fit, but not exceeding 1:1
    const scaleX = containerWidth / (treeWidth + 100); // Add padding
    const scaleY = containerHeight / (treeHeight + 100); // Add padding
    this.scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 1:1
    
    // Calculate the pan to center
    this.panX = (containerWidth - treeWidth * this.scale) / 2 - treeBounds.minX * this.scale;
    this.panY = (containerHeight - treeHeight * this.scale) / 2 - treeBounds.minY * this.scale;
    
    this.updateTransform();
  }
  
  /**
   * Reset the view (pan and zoom)
   */
  resetView(): void {
    this.scale = 1;
    this.panX = 50;
    this.panY = 50;
    this.updateTransform();
  }
  
  /**
   * Attach events for panning
   */
  private _attachPanningEvents(): void {
    this.svg.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Skip if clicking a button or handle
      if (
        target.closest('.collapse-btn') || 
        target.closest('.drag-handle')
      ) {
        return;
      }
      
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });
    
    this.svg.addEventListener('mousemove', (e: MouseEvent) => {
      // Handle node dragging
      if (this.draggedNode) {
        const dx = (e.clientX - this.dragStartX) / this.scale;
        const dy = (e.clientY - this.dragStartY) / this.scale;
        
        if (
          this.draggedNode.x !== undefined &&
          this.draggedNode.y !== undefined
        ) {
          // Mark node as manually positioned
          this.draggedNode.manuallyPositioned = true;
          
          // Update node coordinates
          this.draggedNode.x += dx;
          this.draggedNode.y += dy;
          
          // Update the node position in the DOM
          const nodeGroup = this.svg.querySelector(
            `[data-id="${this.draggedNode.id}"]`
          ) as SVGGElement;
          
          if (nodeGroup) {
            nodeGroup.setAttribute(
              'transform',
              `translate(${this.draggedNode.x}, ${this.draggedNode.y})`
            );
            
            // Update connecting lines
            this.renderer.updateConnections(this.draggedNode);
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
        this.updateTransform();
      }
    });
    
    // Mouse up handler - works for both panning and dragging
    this.svg.addEventListener('mouseup', () => {
      // If we were dragging a node, trigger the callback
      if (this.draggedNode && this.onNodeDraggedCallback) {
        this.onNodeDraggedCallback(this.draggedNode);
        
        // Remove the dragging class
        const nodeGroup = this.svg.querySelector(
          `[data-id="${this.draggedNode.id}"]`
        ) as SVGGElement;
        
        if (nodeGroup) {
          nodeGroup.classList.remove('dragging');
        }
      }
      
      this.isPanning = false;
      this.draggedNode = null;
    });
    
    this.svg.addEventListener('mouseleave', () => {
      this.isPanning = false;
      this.draggedNode = null;
    });
  }
  
  /**
   * Attach events for zooming
   */
  private _attachZoomEvents(): void {
    this.svg.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const direction = e.deltaY > 0 ? -1 : 1;
      const zoomAmount = direction > 0 ? zoomFactor : 1 / zoomFactor;
      
      // Get cursor position relative to SVG
      const rect = this.svg.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // Calculate point in SVG space
      const svgX = (offsetX - this.panX) / this.scale;
      const svgY = (offsetY - this.panY) / this.scale;
      
      // Update scale
      this.scale *= zoomAmount;
      
      // New pan to keep the pointer under cursor
      this.panX = offsetX - svgX * this.scale;
      this.panY = offsetY - svgY * this.scale;
      
      this.updateTransform();
    });
  }
  
  /**
   * Attach events for the control buttons
   */
  private _attachButtonEvents(): void {
    this.treeContainer.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as Element;
      const button = target.closest('button');
      
      if (!button) return;
      
      // Check which action to perform based on data attribute
      const action = button.getAttribute('data-action');
      
      switch (action) {
        case 'zoom-in':
          this.scale *= 1.1;
          this.updateTransform();
          break;
          
        case 'zoom-out':
          this.scale /= 1.1;
          this.updateTransform();
          break;
          
        case 'reset':
          this.resetView();
          break;
          
        case 'center':
          // This requires the tree bounds, so we delegate to callback
          const centerEvent = new CustomEvent('center-tree');
          this.treeContainer.dispatchEvent(centerEvent);
          break;
      }
    });
  }
}