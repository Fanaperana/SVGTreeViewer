import * as viewer from './index.js';

const data = [
  { cur_id: 1, user_id: null, data: { title: "Root", src: "#" } },
  { cur_id: 2, user_id: 1, data: { title: "Child 1", src: "#" } },
  { cur_id: 3, user_id: 1, data: { title: "Child 2", src: "#" } },
];

const template = `
  <div class="node">
    <h4>[data:title]</h4>
    <a href="[data:src]">View</a>
  </div>
`;

new viewer.SVGTreeViewer({
  containerId: "treeContainer",
  data: data,
  idAlias: "cur_id",
  parentIdAlias: "user_id",
  collapseChild: true,
  template: template,
  nodeHeight: 600,
  nodeWidth: 200,
});

console.log("SVGTreeViewer loaded");
