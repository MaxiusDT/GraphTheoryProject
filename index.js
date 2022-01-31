// Import stylesheets
import './style.css';
import cytoscape from 'cytoscape';

// Interval at wihch the drawing will add vertices / edges
const drawInterval = 200;

// --------------- CONSTANTS DECLARATIONS ---------------

/** @type HTMLInputElement */
const verticesControl = document.querySelector('#verticesControl');
/** @type HTMLInputElement */
const newEdgeControl = document.querySelector('#newEdgeControl');

/** @type HTMLButtonElement */
const addEdgeButton = document.querySelector('#addEdgeButton');
/** @type HTMLButtonElement */
const drawButton = document.querySelector('#drawButton');

const drawZone = document.querySelector('#drawZone');

const withVertices = document.querySelector('#withVertices');

const edgesList = document.querySelector('#edgesList');

/** @type {{ start: number; end: number }[]} */
let edges = [];

// When the vertices control gets its value updated
verticesControl.addEventListener('input', () => {
  // Hide the rest of the form if the value is not a number greater than 0
  if (+verticesControl.value) withVertices.style.display = 'block';
  else withVertices.style.display = 'none';
  // Empty the edges to avoid errors, then update the UI
  edges = [];
  fillList();
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
    start >= 0 && end >= 0 && start <= count && end <= count && start !== end;

  // If the field is valid (X/Y) and the values are bound between 0 and the # of vertices, enable button
  if (isBound && isValid) addEdgeButton.disabled = false;
  else addEdgeButton.disabled = true;
});

// If the user presses enter when being in the new edge control field, click on the button for him
newEdgeControl.addEventListener('keyup', ({ keyCode }) => {
  if (keyCode === 13) addEdgeButton.click();
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
 *
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

// On click on the drax button
drawButton.addEventListener('click', () => {
  // Get vertices and edges
  const vertices = +verticesControl.value;
  const hasEdges = !!edges.length;

  // If there is some, draw, else give up
  if (!vertices || !hasEdges) return;

  createGraphe();
});

function createGraphe() {
  // Get the # of vertices
  const vertices = +verticesControl.value;
  // Create the cytoscape object, to draw the graphe
  const cy = cytoscape({
    // Container is required, must be an HTML element of the page
    container: drawZone,
    // Style used to add the name of the vertices, and make them bigger
    style: [
      {
        selector: 'node',
        style: {
          label: 'data(id)',
          'text-halign': 'center',
          'text-valign': 'center',
          width: 50,
          height: 50,
        },
      },
    ],
  });

  // Function to add the vertices and edges one by one
  addVerticesToGraphe(vertices, cy);

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

function addVerticesToGraphe(vertices, cy) {
  // Create an array the size of the # of vertices
  const vs = new Array(vertices).fill('toto').map((_, i) => i);

  // Create an interval to display them one by one
  const interval = setInterval(() => {
    // Tahe the first element
    const i = vs.shift();
    // If no element found, end of array, so stop interval and add edges
    if (i === undefined) {
      addEdgesToGraphe(cy);
      return clearInterval(interval);
    }
    // Else, add the vertice to the graphe
    cy.add({ group: 'nodes', data: { id: `n${i}` } });
    const layout = cy.layout({ name: 'circle', avoidOverlap: true });
    layout.run();
  }, drawInterval);
}

// Same function as above but for the edges
function addEdgesToGraphe(cy) {
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
    const layout = cy.layout({ name: 'circle', avoidOverlap: true });
    layout.run();
  }, drawInterval);
}

function drawGrapheStepByStep() {
  // Get vertices and edges
  // Loop on edges
  // For each edge at index
  // Create HTML container
  // Create cytoscape object
  // Add vertices to object
  // Add edge #index
  // Create layout object
  // call layout.run()
  // Add container to the page
}
