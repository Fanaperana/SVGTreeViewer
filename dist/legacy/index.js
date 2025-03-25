"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGTreeViewer = void 0;
var SVGTreeViewer = /** @class */ (function () {
    function SVGTreeViewer(options) {
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.draggedNode = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        // Store the dimensions of the entire tree for centering
        this.treeBounds = {
            minX: 0, minY: 0, maxX: 0, maxY: 0
        };
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
            backgroundPattern: options.backgroundPattern || 'dots',
            backgroundColor: options.backgroundColor || '#f9f9f9',
            patternColor: options.patternColor || '#cccccc'
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
    SVGTreeViewer.prototype._createDotPattern = function () {
        var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        var pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        pattern.setAttribute("id", "dotPattern");
        pattern.setAttribute("width", "20");
        pattern.setAttribute("height", "20");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", "2");
        dot.setAttribute("cy", "2");
        dot.setAttribute("r", "1.0");
        dot.setAttribute("fill", this.options.patternColor);
        pattern.appendChild(dot);
        defs.appendChild(pattern);
        return defs;
    };
    /**
     * Create a grid pattern element
     * @returns SVG defs element containing a grid pattern
     */
    SVGTreeViewer.prototype._createGridPattern = function () {
        var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        var pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        pattern.setAttribute("id", "gridPattern");
        pattern.setAttribute("width", "20");
        pattern.setAttribute("height", "20");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        // Horizontal line
        var hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute("x1", "0");
        hLine.setAttribute("y1", "0");
        hLine.setAttribute("x2", "20");
        hLine.setAttribute("y2", "0");
        hLine.setAttribute("stroke", this.options.patternColor);
        hLine.setAttribute("stroke-width", "0.5");
        // Vertical line
        var vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
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
    };
    /**
     * Apply the selected pattern to the SVG
     * @param svg The SVG element to apply the pattern to
     */
    SVGTreeViewer.prototype._applyBackgroundPattern = function (svg) {
        if (this.options.backgroundPattern === 'none') {
            return;
        }
        var defs;
        var patternId;
        // Create the pattern based on the option
        if (this.options.backgroundPattern === 'dots') {
            defs = this._createDotPattern();
            patternId = "dotPattern";
        }
        else {
            defs = this._createGridPattern();
            patternId = "gridPattern";
        }
        svg.appendChild(defs);
        // Create the background rectangle with the pattern
        var patternRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        patternRect.setAttribute("width", "100%");
        patternRect.setAttribute("height", "100%");
        patternRect.setAttribute("fill", "url(#".concat(patternId, ")"));
        svg.appendChild(patternRect);
    };
    SVGTreeViewer.prototype._buildTree = function () {
        var map = new Map();
        var _a = this.options, idAlias = _a.idAlias, parentIdAlias = _a.parentIdAlias, data = _a.data;
        var flat = data.map(function (d) { return (__assign(__assign({}, d), { id: d[idAlias], parent_id: d[parentIdAlias], children: [], collapsed: false, data: d, manuallyPositioned: false })); });
        flat.forEach(function (n) { return map.set(n.id, n); });
        var roots = [];
        flat.forEach(function (n) {
            if (n.parent_id == null) {
                roots.push(n);
            }
            else {
                var parent_1 = map.get(n.parent_id);
                if (parent_1)
                    parent_1.children.push(n);
            }
        });
        return roots;
    };
    /**
     *
     */
    SVGTreeViewer.prototype._renderActionButtons = function (wrapper) {
        var _this = this;
        var zoomeInBtn = document.createElement("button");
        var zoomOutBtn = document.createElement("button");
        var resetBtn = document.createElement("button");
        var centerBtn = document.createElement("button");
        zoomeInBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-zoom-in\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" x2=\"16.65\" y1=\"21\" y2=\"16.65\"/><line x1=\"11\" x2=\"11\" y1=\"8\" y2=\"14\"/><line x1=\"8\" x2=\"14\" y1=\"11\" y2=\"11\"/></svg>"; // Plus
        zoomOutBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-zoom-out\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" x2=\"16.65\" y1=\"21\" y2=\"16.65\"/><line x1=\"8\" x2=\"14\" y1=\"11\" y2=\"11\"/></svg>"; // Minus  
        resetBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-refresh-cw\"><path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/></svg>"; // Reset 
        centerBtn.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-maximize\"><path d=\"M8 3H5a2 2 0 0 0-2 2v3\"/><path d=\"M21 8V5a2 2 0 0 0-2-2h-3\"/><path d=\"M3 16v3a2 2 0 0 0 2 2h3\"/><path d=\"M16 21h3a2 2 0 0 0 2-2v-3\"/></svg>"; // center   
        zoomeInBtn.title = "Zoom in";
        zoomOutBtn.title = "Zoom out";
        resetBtn.title = "Reset view";
        centerBtn.title = "Center tree";
        zoomeInBtn.onmouseenter = function () {
            zoomeInBtn.style.opacity = '0.9';
        };
        zoomeInBtn.onmouseleave = function () {
            zoomeInBtn.style.opacity = '.3';
        };
        zoomOutBtn.onmouseenter = function () {
            zoomOutBtn.style.opacity = '0.9';
        };
        zoomOutBtn.onmouseleave = function () {
            zoomOutBtn.style.opacity = '.3';
        };
        resetBtn.onmouseenter = function () {
            resetBtn.style.opacity = '0.9';
        };
        resetBtn.onmouseleave = function () {
            resetBtn.style.opacity = '.3';
        };
        centerBtn.onmouseenter = function () {
            centerBtn.style.opacity = '0.9';
        };
        centerBtn.onmouseleave = function () {
            centerBtn.style.opacity = '.3';
        };
        zoomeInBtn.style.cssText = "\n            margin: 4px;\n            padding: 4px 6px;\n            font-size: 12px;\n            background:rgb(246, 238, 226, 0.5);\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n            color: black;\n            border: none;\n            border-radius: 5px;\n            cursor: pointer;\n            opacity: 0.3;\n        ";
        zoomOutBtn.style.cssText = "\n            margin: 4px;\n            padding: 4px 6px;\n            font-size: 12px;\n            background:rgb(246, 238, 226, 0.5);\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n            color: black;\n            border: none;\n            border-radius: 5px;\n            cursor: pointer;\n            opacity: 0.3;\n        ";
        resetBtn.style.cssText = "\n            margin: 4px;\n            padding: 4px 6px;\n            font-size: 12px;\n            background:rgb(246, 238, 226, 0.5);\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n            color: black;\n            border: none;\n            border-radius: 5px;\n            cursor: pointer;\n            opacity: 0.3;\n        ";
        centerBtn.style.cssText = "\n            margin: 4px;\n            padding: 4px 6px;\n            font-size: 12px;\n            background:rgb(246, 238, 226, 0.5);\n            box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n            color: black;\n            border: none;\n            border-radius: 5px;\n            cursor: pointer;\n            opacity: 0.3;\n        ";
        zoomeInBtn.onclick = function () {
            _this.scale *= 1.1;
            _this._updateTransform();
        };
        zoomOutBtn.onclick = function () {
            _this.scale /= 1.1;
            _this._updateTransform();
        };
        resetBtn.onclick = function () {
            _this.resetView();
        };
        centerBtn.onclick = function () {
            _this.centerTree();
        };
        var btn_wrapper = document.createElement("div");
        wrapper.style.position = 'relative';
        // wrapper.onmouseenter = () => {
        //     btn_wrapper.style.opacity = '0.5';
        // }
        // wrapper.onmouseleave = () => {
        //     btn_wrapper.style.opacity = '0.1';
        // }
        btn_wrapper.style.cssText = "\n            display: flex; \n            flex-direction: column;\n            gap: 5px;\n            justify-content: center;\n            width: 100%;\n            position: absolute;\n            top: 5px;\n            right: 5px;\n            width: 40px;\n            z-index: 100;\n            pointer-events: auto;\n            transition: opacity 0.3s ease-in-out, transform 0.3s ease;\n        ";
        btn_wrapper.append(zoomeInBtn, zoomOutBtn, resetBtn, centerBtn);
        wrapper.append(btn_wrapper);
    };
    SVGTreeViewer.prototype._renderSVG = function () {
        var container = document.getElementById(this.options.containerId);
        if (!container) {
            throw new Error("Container with ID \"".concat(this.options.containerId, "\" not found"));
        }
        container.innerHTML = "";
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    };
    SVGTreeViewer.prototype._attachEvents = function () {
        var _this = this;
        this.svg.addEventListener('mousedown', function (e) {
            var target = e.target;
            // Skip if we're clicking a collapse button or a drag handle
            if (target.closest(".collapse-btn") || target.closest(".drag-handle"))
                return;
            _this.isPanning = true;
            _this.startX = e.clientX - _this.panX;
            _this.startY = e.clientY - _this.panY;
        });
        this.svg.addEventListener('mousemove', function (e) {
            // Handle node dragging
            if (_this.draggedNode) {
                var dx = (e.clientX - _this.dragStartX) / _this.scale;
                var dy = (e.clientY - _this.dragStartY) / _this.scale;
                if (_this.draggedNode.x !== undefined && _this.draggedNode.y !== undefined) {
                    // Mark this node as manually positioned
                    _this.draggedNode.manuallyPositioned = true;
                    // Get the node group
                    var nodeGroup = _this.svg.querySelector("[data-id=\"".concat(_this.draggedNode.id, "\"]"));
                    if (nodeGroup) {
                        // Update node coordinates
                        _this.draggedNode.x += dx;
                        _this.draggedNode.y += dy;
                        // Update the node position in the DOM
                        nodeGroup.setAttribute("transform", "translate(".concat(_this.draggedNode.x, ", ").concat(_this.draggedNode.y, ")"));
                        // Update the connecting lines for just this node
                        _this._updateConnections(_this.draggedNode);
                    }
                }
                _this.dragStartX = e.clientX;
                _this.dragStartY = e.clientY;
                return;
            }
            // Handle canvas panning
            if (_this.isPanning) {
                _this.panX = e.clientX - _this.startX;
                _this.panY = e.clientY - _this.startY;
                _this._updateTransform();
            }
        });
        this.svg.addEventListener('mouseup', function () {
            _this.isPanning = false;
            _this.draggedNode = null;
        });
        this.svg.addEventListener('mouseleave', function () {
            _this.isPanning = false;
            _this.draggedNode = null;
        });
        this.svg.addEventListener('wheel', function (e) {
            e.preventDefault();
            var zoomFactor = 1.1;
            var direction = e.deltaY > 0 ? -1 : 1;
            var zoomAmount = direction > 0 ? zoomFactor : 1 / zoomFactor;
            var rect = _this.svg.getBoundingClientRect();
            var offsetX = e.clientX - rect.left;
            var offsetY = e.clientY - rect.top;
            var svgX = (offsetX - _this.panX) / _this.scale;
            var svgY = (offsetY - _this.panY) / _this.scale;
            // Update scale
            _this.scale *= zoomAmount;
            // New pan to keep the pointer under cursor
            _this.panX = offsetX - svgX * _this.scale;
            _this.panY = offsetY - svgY * _this.scale;
            _this._updateTransform();
        });
    };
    SVGTreeViewer.prototype._setupNodeDragging = function (nodeGroup, node, handle) {
        var _this = this;
        handle.addEventListener('mousedown', function (e) {
            e.stopPropagation(); // Prevent canvas panning
            e.preventDefault(); // Prevent text selection
            // Set the dragged node
            _this.draggedNode = node;
            _this.dragStartX = e.clientX;
            _this.dragStartY = e.clientY;
            // Add a "dragging" class to the node for visual feedback
            nodeGroup.classList.add("dragging");
            // Bring the node to front while dragging
            _this.group.appendChild(nodeGroup);
        });
        // Add double-click event for collapsing/expanding
        if (node.children.length > 0) {
            handle.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                e.preventDefault();
                node.collapsed = !node.collapsed;
                _this._renderTree();
                _this.centerTree();
            });
        }
    };
    // Method to create an S-shaped curve
    SVGTreeViewer.prototype._createSCurve = function (x1, y1, x2, y2) {
        // Calculate the vertical distance for proper curve shaping
        var dy = y2 - y1;
        // Calculate control points - key to creating the S-curve effect
        // First control point is below starting point
        var cp1x = x1;
        var cp1y = y1 + dy * 0.3; // 30% down the vertical distance
        // Second control point is above ending point
        var cp2x = x2;
        var cp2y = y2 - dy * 0.3; // 30% up from the ending point
        // Create bezier curve command
        return "M ".concat(x1, " ").concat(y1, " C ").concat(cp1x, " ").concat(cp1y, ", ").concat(cp2x, " ").concat(cp2y, ", ").concat(x2, " ").concat(y2);
    };
    SVGTreeViewer.prototype._updateConnections = function (node) {
        var _this = this;
        var flat = this._getAllNodes(this.nodes);
        var map = new Map(flat.map(function (n) { return [n.id, n]; }));
        // Update connections where the node is a parent
        node.children.forEach(function (child) {
            if (!node.collapsed) {
                var connection = _this.svg.querySelector("path[data-from=\"".concat(node.id, "\"][data-to=\"").concat(child.id, "\"]"));
                if (connection) {
                    // Use nodeWidth/2 for horizontal center
                    var nodeWidthHalf = _this.options.nodeWidth / 2;
                    var x1 = (node.x || 0) + nodeWidthHalf;
                    var y1 = (node.y || 0) + _this.options.nodeHeight;
                    var x2 = (child.x || 0) + nodeWidthHalf;
                    var y2 = (child.y || 0);
                    var dx = (x2 - x1) / 2;
                    //const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                    // Create an S-shaped curve
                    var d = _this._createSCurve(x1, y1, x2, y2);
                    connection.setAttribute("d", d);
                }
            }
        });
        // Update connection where the node is a child
        if (node.parent_id) {
            var parent_2 = map.get(node.parent_id);
            if (parent_2 && !parent_2.collapsed) {
                var connection = this.svg.querySelector("path[data-from=\"".concat(parent_2.id, "\"][data-to=\"").concat(node.id, "\"]"));
                if (connection) {
                    // Use nodeWidth/2 for horizontal center
                    var nodeWidthHalf = this.options.nodeWidth / 2;
                    var x1 = (parent_2.x || 0) + nodeWidthHalf;
                    var y1 = (parent_2.y || 0) + this.options.nodeHeight;
                    var x2 = (node.x || 0) + nodeWidthHalf;
                    var y2 = (node.y || 0);
                    // const dx = (x2 - x1) / 2;
                    // const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                    // Create an S-shaped curve
                    var d = this._createSCurve(x1, y1, x2, y2);
                    connection.setAttribute("d", d);
                }
            }
        }
    };
    SVGTreeViewer.prototype._getAllNodes = function (nodes) {
        var result = [];
        var traverse = function (node) {
            result.push(node);
            node.children.forEach(traverse);
        };
        nodes.forEach(traverse);
        return result;
    };
    SVGTreeViewer.prototype._updateTransform = function () {
        this.group.setAttribute("transform", "translate(".concat(this.panX, ", ").concat(this.panY, ") scale(").concat(this.scale, ")"));
    };
    SVGTreeViewer.prototype._renderTree = function () {
        var _this = this;
        this.group.innerHTML = "";
        var flat = this._layoutTree(this.nodes);
        var map = new Map(flat.map(function (n) { return [n.id, n]; }));
        // Draw connection lines first so they appear behind the nodes
        flat.forEach(function (n) {
            if (n.parent_id && map.get(n.parent_id)) {
                var parent_3 = map.get(n.parent_id);
                if (parent_3 && !parent_3.collapsed) {
                    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    // Use nodeWidth/2 for horizontal center
                    var nodeWidthHalf = _this.options.nodeWidth / 2;
                    var x1 = (parent_3.x || 0) + nodeWidthHalf;
                    var y1 = (parent_3.y || 0) + _this.options.nodeHeight;
                    var x2 = (n.x || 0) + nodeWidthHalf;
                    var y2 = (n.y || 0);
                    // const dx = (x2 - x1) / 2;
                    // const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                    // Create an S-shaped curve using the new method
                    var d = _this._createSCurve(x1, y1, x2, y2);
                    path.setAttribute("d", d);
                    path.setAttribute("stroke", "#ccc");
                    path.setAttribute("stroke-width", "2");
                    path.setAttribute("fill", "none");
                    path.setAttribute("data-from", String(parent_3.id));
                    path.setAttribute("data-to", String(n.id));
                    _this.group.appendChild(path);
                }
            }
        });
        // Draw nodes on top of the connection lines
        flat.forEach(function (n) {
            // Create a group for each node to make dragging easier
            var nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            nodeGroup.setAttribute("class", "node-group");
            nodeGroup.setAttribute("data-id", String(n.id));
            nodeGroup.setAttribute("transform", "translate(".concat(n.x || 0, ", ").concat(n.y || 0, ")"));
            // Add invisible drag handle that's larger than the visible node for easier dragging
            var dragHandle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            dragHandle.setAttribute("width", String(_this.options.nodeWidth));
            dragHandle.setAttribute("height", String(_this.options.nodeHeight));
            dragHandle.setAttribute("fill", "transparent");
            dragHandle.setAttribute("class", "drag-handle");
            dragHandle.setAttribute("cursor", "move");
            nodeGroup.appendChild(dragHandle);
            // Set up dragging for this specific node
            _this._setupNodeDragging(nodeGroup, n, dragHandle);
            var f = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            f.setAttribute("width", String(_this.options.nodeWidth));
            f.setAttribute("height", String(_this.options.nodeHeight));
            var div = document.createElement("div");
            div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
            div.innerHTML = _this._processTemplate(_this.options.template, n);
            div.style.cssText = "\n          font-family: sans-serif;\n          background: white;\n          border: 1px solid #ccc;\n          border-radius: 6px;\n          padding: 10px;\n          box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n          width: 100%;\n          height: 100%;\n          box-sizing: border-box;\n          overflow: auto;\n          display: flex;\n          object-fit: contain;\n          flex-direction: column;\n          position: relative;\n          item-align: center;\n          justify-content: center;\n        ";
            if (_this.options.collapseChild && n.children.length > 0) {
                var btn_wrapper = document.createElement("div");
                btn_wrapper.style.cssText = "\n            display: flex; \n            justify-content: center;\n            width: 100%;\n        ";
                var btn = document.createElement("button");
                btn.className = "collapse-btn";
                btn.innerHTML = n.collapsed
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' // Chevron down
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // Chevron up
                btn.title = n.collapsed ? "Expand children" : "Collapse children";
                btn.style.cssText = "\n            margin-top: 8px;\n            padding: 4px 6px;\n            font-size: 12px;\n            background:rgb(246, 238, 226);\n            color: black;\n            border: none;\n            border-radius: 4px;\n            cursor: pointer;\n          ";
                btn.onclick = function (e) {
                    e.stopPropagation(); // Prevent dragging when clicking the button
                    n.collapsed = !n.collapsed;
                    _this._renderTree();
                };
                btn_wrapper.appendChild(btn);
                div.appendChild(btn_wrapper);
            }
            f.appendChild(div);
            nodeGroup.appendChild(f);
            // Add the node group to the main group
            _this.group.appendChild(nodeGroup);
            // Adjust height if needed - this is optional since we're using fixed dimensions now
            if (_this.options.nodeHeight <= 0) {
                requestAnimationFrame(function () {
                    var contentHeight = div.getBoundingClientRect().height;
                    var height = Math.max(contentHeight, 40); // Ensure minimum height
                    f.setAttribute("height", String(height));
                    dragHandle.setAttribute("height", String(height));
                });
            }
        });
        this._updateTransform();
        var allNodes = this._getAllNodes(this.nodes);
        this._calculateTreeBounds(allNodes);
    };
    /**
     * Calculate the bounds of the entire tree
     * @param nodes List of all nodes in the tree
     */
    SVGTreeViewer.prototype._calculateTreeBounds = function (nodes) {
        var _this = this;
        if (nodes.length === 0) {
            this.treeBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
            return;
        }
        var minX = Infinity, minY = Infinity;
        var maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(function (node) {
            if (node.x !== undefined) {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + _this.options.nodeWidth);
            }
            if (node.y !== undefined) {
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + _this.options.nodeHeight);
            }
        });
        this.treeBounds = { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    };
    SVGTreeViewer.prototype._layoutTree = function (nodes) {
        var _this = this;
        var _a = this.options, levelHeight = _a.levelHeight, horizontalSpacing = _a.horizontalSpacing, nodePadding = _a.nodePadding;
        var flat = [];
        // First pass: calculate positions using the improved layout algorithm
        var calculatePositions = function (node, depth, x) {
            var e_1, _a;
            if (depth === void 0) { depth = 0; }
            if (x === void 0) { x = 0; }
            // Skip manually positioned nodes in the calculation
            if (node.manuallyPositioned && node.x !== undefined && node.y !== undefined) {
                // Still need to process children
                var totalWidth_1 = 0;
                if (!node.collapsed) {
                    node.children.forEach(function (child) {
                        var result = calculatePositions(child, depth + 1, x + totalWidth_1);
                        totalWidth_1 += result.width;
                    });
                }
                flat.push(node);
                return { node: node, width: Math.max(horizontalSpacing, totalWidth_1) };
            }
            // For normal nodes or first-time layout
            if (!node.children.length || node.collapsed) {
                node.x = x;
                node.y = depth * levelHeight;
                node.origX = x; // Store original position
                node.origY = depth * levelHeight;
                flat.push(node);
                return { node: node, width: horizontalSpacing };
            }
            var totalWidth = 0;
            var childResults = [];
            try {
                // Calculate all children first
                for (var _b = __values(node.children), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var child = _c.value;
                    var result = calculatePositions(child, depth + 1, x + totalWidth);
                    childResults.push(result);
                    totalWidth += result.width;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // If no children, use default spacing
            if (totalWidth === 0) {
                totalWidth = horizontalSpacing;
            }
            // Center the parent over its children
            var leftMostChild = childResults[0].node;
            var rightMostChild = childResults[childResults.length - 1].node;
            var leftEdge = leftMostChild.x || 0;
            var rightEdge = (rightMostChild.x || 0) + _this.options.nodeWidth;
            var center = leftEdge + (rightEdge - leftEdge) / 2 - _this.options.nodeWidth / 2;
            node.x = center;
            node.y = depth * levelHeight;
            node.origX = center; // Store original position
            node.origY = depth * levelHeight;
            flat.push(node);
            return { node: node, width: totalWidth };
        };
        // Process each root node
        var xOffset = 0;
        nodes.forEach(function (root) {
            var result = calculatePositions(root, 0, xOffset);
            xOffset += result.width + nodePadding; // Add extra padding between trees
        });
        // Apply minimum x position to avoid negative coordinates
        var minX = Math.min.apply(Math, __spreadArray([], __read(flat.map(function (n) { return n.x || 0; })), false));
        if (minX < 0) {
            flat.forEach(function (n) {
                if (n.x !== undefined)
                    n.x -= minX;
                if (n.origX !== undefined)
                    n.origX -= minX;
            });
        }
        return flat;
    };
    SVGTreeViewer.prototype._processTemplate = function (template, node) {
        return template.replace(/\[data:(.+?)\]/g, function (_, key) {
            var _a, _b, _c;
            // return dataObj[key] !== undefined ? String(dataObj[key]) : '';
            return (_c = (_b = (_a = node.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[key]) !== null && _c !== void 0 ? _c : '';
        });
    };
    // Public methods for external control
    /**
     * Update the data and re-render the tree
     * @param data New data to render
     */
    SVGTreeViewer.prototype.updateData = function (data) {
        this.options.data = data;
        this.nodes = this._buildTree();
        this._renderTree();
        this.centerTree();
    };
    /**
     * Reset view to initial state (center and scale)
     */
    SVGTreeViewer.prototype.resetView = function () {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this._updateTransform();
    };
    /**
     * Reset the positions of all nodes to their calculated positions
     */
    SVGTreeViewer.prototype.resetNodePositions = function () {
        var allNodes = this._getAllNodes(this.nodes);
        allNodes.forEach(function (node) {
            node.manuallyPositioned = false;
        });
        this._renderTree();
        this.centerTree();
    };
    /**
     * Toggle collapse state of a node by its id
     * @param id ID of the node to toggle
     */
    SVGTreeViewer.prototype.toggleNodeCollapse = function (id) {
        var allNodes = this._getAllNodes(this.nodes);
        var node = allNodes.find(function (n) { return n.id === id; });
        if (node) {
            node.collapsed = !node.collapsed;
            this._renderTree();
            this.centerTree();
        }
    };
    /**
     * Center the tree in the viewport
     */
    SVGTreeViewer.prototype.centerTree = function () {
        // Get container dimensions
        var containerRect = this.svg.getBoundingClientRect();
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        // Calculate tree width and height
        var treeWidth = this.treeBounds.maxX - this.treeBounds.minX;
        var treeHeight = this.treeBounds.maxY - this.treeBounds.minY;
        // Calculate the scale to fit, but not exceeding 1:1
        var scaleX = containerWidth / (treeWidth + 100); // Add padding
        var scaleY = containerHeight / (treeHeight + 100); // Add padding
        this.scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 1:1
        // Calculate the pan to center
        this.panX = (containerWidth - treeWidth * this.scale) / 2 - this.treeBounds.minX * this.scale;
        this.panY = (containerHeight - treeHeight * this.scale) / 2 - this.treeBounds.minY * this.scale;
        this._updateTransform();
    };
    /**
     * Zoom to fit all nodes in the view
     */
    SVGTreeViewer.prototype.zoomToFit = function () {
        // Implementation would calculate the bounds of all nodes
        // and set scale and pan to fit everything in view
        var allNodes = this._getAllNodes(this.nodes);
        if (allNodes.length === 0)
            return;
        // Find min/max coordinates
        var minX = Infinity, minY = Infinity;
        var maxX = -Infinity, maxY = -Infinity;
        allNodes.forEach(function (node) {
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
        var containerRect = this.svg.getBoundingClientRect();
        var containerWidth = containerRect.width;
        var containerHeight = containerRect.height;
        // Calculate scale to fit
        var scaleX = containerWidth / (maxX - minX);
        var scaleY = containerHeight / (maxY - minY);
        this.scale = Math.min(scaleX, scaleY, 1); // Limit max scale to 1
        // Calculate pan to center
        this.panX = (containerWidth - (maxX - minX) * this.scale) / 2 - minX * this.scale;
        this.panY = (containerHeight - (maxY - minY) * this.scale) / 2 - minY * this.scale;
        this._updateTransform();
    };
    return SVGTreeViewer;
}());
exports.SVGTreeViewer = SVGTreeViewer;
//# sourceMappingURL=index.js.map