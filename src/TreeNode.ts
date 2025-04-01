import { TreeNodeData } from './interfaces';

/**
 * Represents a node in the tree structure
 */
export class TreeNode {
  id: string | number;
  parent_id: string | number | null;
  collapsed: boolean = false;
  data: TreeNodeData;
  
  // Position
  x?: number;
  y?: number;
  origX?: number;
  origY?: number;
  
  // Interaction state
  dragging?: boolean = false;
  manuallyPositioned: boolean = false;
  isSelected?: boolean = false;
  
  // Relationships
  children: TreeNode[] = [];
  parent: TreeNode | null = null;
  
  // DOM elements
  current_node_element: SVGGElement;
  parent_node_element: SVGGElement | null = null;
  child_node_elements: SVGGElement[] = [];

  constructor(id: string | number, parent_id: string | number | null, data: TreeNodeData) {
    this.id = id;
    this.parent_id = parent_id;
    this.data = data;
    this.current_node_element = document.createElementNS("http://www.w3.org/2000/svg", "g");
  }

  /**
   * Add a child node to this node
   */
  addChild(child: TreeNode): void {
    this.children.push(child);
    child.parent = this;
    child.parent_node_element = this.current_node_element;
    this.child_node_elements.push(child.current_node_element);
  }

  /**
   * Toggle the collapsed state of this node
   */
  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  /**
   * Reset this node to its original position from the layout algorithm
   */
  resetPosition(): void {
    if (this.origX !== undefined && this.origY !== undefined) {
      this.x = this.origX;
      this.y = this.origY;
      this.manuallyPositioned = false;
    }
  }
}