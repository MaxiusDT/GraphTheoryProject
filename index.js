// Import stylesheets
import './style.css';
import './vars.js';
import cytoscape from 'cytoscape';

let cy;

// Interval at wihch the drawing will add vertices / edges
const drawInterval = 50;

/** @type {{ start: number; end: number }[]} */
let edges = [];

function toPng() {
  const blob = cy.png({
    output: 'blob',
    full: true,
  });

  const file = new File([blob], 'graph.png', { type: 'image/png' });

  const url = URL.createObjectURL(file);

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.download = 'graph.png';

  link.click();
}

// On click on the Dijkstra button
dijkstraButton.addEventListener('click', () => {
  const elements = cy.elements();
  const dijkstra = elements.dijkstra.bind(elements);

  // Origin node window & number validity check
  const orgn = +prompt('Origin node');
  if (isNaN(orgn)) return alert('Not a number');

  // Target node window & number validity check
  const trgt = +prompt('Target node');
  if (isNaN(trgt)) return alert('Not a number');

  // Return the value of all edges (default: infinity)
  const res = dijkstra(cy.$('#n' + orgn), function (edge) {
    return edge.data('weight') ?? Infinity;
  });

  const path = res
    .pathTo(cy.$('#n' + trgt))
    .filter((v, i) => !(i % 2))
    .map((v) => v.data('id'))
    .map((el) => el.replace('n', ''))
    .join(' → ');

  const distance = res.distanceTo(cy.$('#n' + trgt));

  dijkstraDistance.innerHTML = `The shortest distance from edge ${orgn} to edge ${trgt} is: ${distance}.`;
  dijkstraPath.innerHTML = `The shortest path from edge ${orgn} to edge ${trgt} is: ${path}.`;
});

// When the vertices control gets its value updated
verticesControl.addEventListener('input', () => {
  // Hide the rest of the form if the value is not a number above 0
  if (+verticesControl.value) withVertices.style.display = 'block';
  else withVertices.style.display = 'none';
  // Empty the edges to avoid errors, then update the UI
  edges = [];
  fillList();
});

// If the user presses enter while being in the vertices control field, switch to the next selector
verticesControl.addEventListener('keydown', ({ key }) => {
  if (key === 'Enter') document.getElementById('newEdgeControl').focus();
});

// When the new edge control gets its value updated
newEdgeControl.addEventListener('input', () => {
  // Get the number of vertices, the value, and the pattern validity
  const value = newEdgeControl.value;
  const count = +verticesControl.value;
  const isValid = newEdgeControl.checkValidity();
  // Get the start / end value with a regex
  const [start, end] = value.match(/(\d+)/g)?.map((v) => +v) ?? [-1, -1];
  const isBound =
    start >= 0 && end >= 0 && start <= count - 1 && end <= count - 1;

  // If the field is valid (X/Y) and the values are bound between 0 and the # of vertices, enable button
  if (isBound && isValid) addEdgeButton.disabled = false;
  else addEdgeButton.disabled = true;
});

// If the user presses enter while being in the new edge control field, click on the button for him
newEdgeControl.addEventListener('keydown', ({ key }) => {
  if (key === 'Enter') addEdgeButton.click();
});

// On click on the add edge button
addEdgeButton.addEventListener('click', () => {
  // Get the start and end values
  const [start, end] = newEdgeControl.value.match(/(\d+)/g)?.map((v) => +v) ?? [
    -1, -1,
  ];
  // add them to the list of edges
  edges.push({ start, end });
  // Reset the controls
  newEdgeControl.value = '';
  addEdgeButton.disabled = true;
  // Update the UI
  fillList();
});

/**
 * To update the UI :
 * - Create an unordered list (ul)
 * - For each edge of the list of edges :
 *   - create a list item (li)
 *   - set its content (start → end)
 *   - add it to the ul item
 *   - When clicked, removes it from the list of edges
 * - Once done, add the ul to the div element of the index.html page
 */
function fillList() {
  edgesList.innerHTML = '';
  const list = document.createElement('ul');
  for (const edge of edges) {
    const { start, end } = edge;
    const bullet = document.createElement('li');
    bullet.innerText = `${start} → ${end}`;
    list.appendChild(bullet);
    bullet.addEventListener('click', () => {
      edges.splice(edges.indexOf(edge), 1);
      fillList();
    });
  }
  edgesList.appendChild(list);
}

// On click on the draw button
drawButton.addEventListener('click', () => {
  // Get vertices and edges
  const vertices = +verticesControl.value;
  const hasEdges = !!edges.length;

  // If there is any, draw, else give up
  if (!vertices || !hasEdges) return;

  createGraph();
});

function createGraph() {
  // Get the # of vertices
  const vertices = +verticesControl.value;
  // Create the cytoscape object, to draw the Graph
  cy = cytoscape({
    // Container is required, must be an HTML element of the page
    container: drawZone,
    // Style used to add the name of the vertices, and make them bigger
    style: [
      {
        selector: 'node',
        style: {
          label: 'data(name)',
          'text-halign': 'center',
          'text-valign': 'center',
          width: 50,
          height: 50,
        },
      },
      {
        selector: 'edge',
        style: {
          label: 'data(weight)',
          'text-margin-y': -15,
          'text-halign': 'center',
          'text-valign': 'center',
        },
      },
    ],
  });

  // Function to add the vertices and edges one by one
  addVerticesToGraph(vertices, cy);

  // ------------ OLD, INSTANT DRAWING ------------

  // for (let i = 0; i < vertices; i++)
  //   cy.add({ group: 'nodes', data: { id: `n${i}` } });

  // for (const edge of edges)
  //   cy.add({
  //     group: 'edges',
  //     data: {
  //       id: `e${edges.indexOf(edge)}`,
  //       source: `n${edge.start}`,
  //       target: `n${edge.end}`,
  //     },
  //   });

  // const layout = cy.layout({ name: 'circle', avoidOverlap: true });
  // layout.run();
}

function addVerticesToGraph(vertices, cy) {
  // Create an array the size of the # of vertices
  const vs = new Array(vertices).fill(0).map((_, i) => i);

  // Create an interval to display them one by one
  const interval = setInterval(() => {
    // Tahe the first element
    const i = vs.shift();
    // If no element found, end of array, so stop interval and add edges
    if (i === undefined) {
      addEdgesToGraph(cy);
      return clearInterval(interval);
    }
    // Else, add the vertice to the graph
    cy.add({ group: 'nodes', data: { id: `n${i}`, name: i } });
    const layout = cy.layout({ name: 'circle', avoidOverlap: true });
    layout.run();
  }, drawInterval);
}

// Same function as above but for the edges
function addEdgesToGraph(cy) {
  const vs = [...edges];

  const interval = setInterval(() => {
    const i = vs.shift();
    if (i === undefined) {
      return clearInterval(interval);
    }
    cy.add({
      group: 'edges',
      data: {
        id: `e${edges.indexOf(i)}`,
        source: `n${i.start}`,
        target: `n${i.end}`,
      },
    });

    cy.$(`#e${edges.indexOf(i)}`).on('click', (evt) => {
      const edge = evt.target;
      const weight = +prompt('Edge weight');
      if (isNaN(weight)) return alert('Not a number');
      edge.data('weight', weight);
    });

    const layout = cy.layout({ name: 'circle', avoidOverlap: true });
    layout.run();
  }, drawInterval);
}

// On click on the export button
exportButton.addEventListener('click', () => {
  // Export the current graph to png
  toPng();
});

// ------------------------- TO DELETE -----------------------------
verticesControl.value = 10;
verticesControl.dispatchEvent(
  new Event('input', {
    bubbles: true,
    cancelable: true,
  })
);

edges = [
  { start: 1, end: 2 },
  { start: 2, end: 3 },
];

fillList();

drawButton.dispatchEvent(new Event('click'));
