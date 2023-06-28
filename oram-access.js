// import visualization libraries {
const { Tracer, GraphTracer, LogTracer, Randomize, Layout, VerticalLayout, Array1DTracer, Array2DTracer } = require('algorithm-visualizer');
// }

const G = [ // G[i][j] indicates whether the path from the i-th node to the j-th node exists or not
  [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];


var height = 4
var num_blocks = 15
var max_leafs = 8
var stash_capacity = 8

var stash = Array(stash_capacity)
var posmap = Array(num_blocks)
var block_id_in_tree = Array(num_blocks)
var block_access_pattern = Array(num_blocks)
var path_access_pattern = Array(max_leafs)


const key = Randomize.Integer({ min: 0, max: G.length - 1 }); // item to be searched
// const key = range(0, len,)
const graphTracer = new GraphTracer('ORAM Tree');
const stashTracer = new Array1DTracer('ORAM Stash');
const blockTracer = new Array1DTracer('Block positions');
const posmapTracer = new Array1DTracer('Position Map');
const blockAccessTracer = new Array1DTracer('Block Access Pattern');
const pathAccessTracer = new Array1DTracer('Path Access Pattern');
// const tracer = new GraphTracer(' ORAM Tree ');
const logger = new LogTracer(' Log ');

// }                     h

function get_random_leaf() {
  return Randomize.Integer({ min: 0, max: max_leafs - 1 })
}
function pick_random_stash_slot() {
  return Randomize.Integer({ min: 0, max: stash_capacity - 1 })
}

// Leaf ID
function get_path(leaf_id) {
  var path = [];
  logger.printf("Getting path for leaf id %d\n", leaf_id);
  // Calculate the index for each layer
  for (let level = 0; level < height; level++) {
    // (2^level - 1) + leaf_id >> (height - level - 1)
    // height = 4, level = 0, leaf id = 1
    // (2^0 - 1) +  1 >> (4 - 0 - 1) = 0 
    let node = (1 << level) - 1 + (leaf_id >> (height - level - 1))
    path.push(node);
  }
  return path;
}
function initialize() {
  for (let index = 0; index < stash_capacity; index++) {
    stash[index] = -1;
  }

  for (let index = 0; index < max_leafs; index++) {
    path_access_pattern[index] = 0;
  }
  for (let index = 0; index < num_blocks; index++) {
    block_access_pattern[index] = 0;
    block_id_in_tree[index] = -1;
    posmap[index] = get_random_leaf();
  }
  Layout.setRoot(new VerticalLayout([graphTracer, stashTracer, posmapTracer, blockTracer, blockAccessTracer, pathAccessTracer, logger]));

  posmapTracer.set(posmap)
  stashTracer.set(stash)
  blockTracer.set(block_id_in_tree)

  // posmapTracer.
  graphTracer.set(G);
  graphTracer.layoutTree(0);
  // stashTracer.log(logger)
  // graphTracer.log(logger);
  Tracer.delay();
}




function fetch_blocks_to_stash(leaf) {
  logger.printf("Fetching blocks from leaf %d to stash!\n", leaf);
  path = get_path(leaf)
  path_access_pattern[leaf]++;
  pathAccessTracer.set(path_access_pattern);
  // visualize {
  let patched_stash = [];
  let patched_block = [];
  //}
  path.map((node) => {
    graphTracer.select(node);
    block_access_pattern[node]++;
    blockAccessTracer.set(block_access_pattern);



    let free_stash_slot = stash.indexOf(-1);
    let block_id = block_id_in_tree[node];
    if (block_id) {
      stash[free_stash_slot] = block_id;
      stashTracer.patch(free_stash_slot, block_id);
      patched_stash.push(free_stash_slot);

      block_id_in_tree[node] = -1
      blockTracer.patch(node, -1);
      patched_block.push(node)
    }
    Tracer.delay()
  });


  path.map((node) => {
    graphTracer.deselect(node)
  })
  patched_block.map((node) => {
    blockTracer.depatch(node);
  })
  for (let index = 0; index < patched_stash.length; index++) {
    stashTracer.depatch(patched_stash[index]);
  }
  Tracer.delay()
}
function evict_blocks_from_stash(leaf) {
  logger.printf("Selecting blocks to evict from stash!\n");
  Tracer.delay();
  // Try to find unused block first
  // let evict_stash_slot = stash.indexOf(-1);
  let evict_path = get_path(leaf)
  logger.printf("Evicting blocks\n");
  Tracer.delay();

  let patched_stash = []
  let patched_block = []
  for (let index = evict_path.length - 1; index >= 0; index--) {
    let tree_idx = evict_path[index];
    let stash_idx = stash.findIndex((value, _idx, _obj) => { return value != -1 })
    block_id_in_tree[tree_idx] = stash[stash_idx];

    if (stash_idx != -1) {
      // Remove from stash
      blockTracer.patch(tree_idx, stash[stash_idx])
      stash[stash_idx] = -1;
      stashTracer.patch(stash_idx, -1);

      patched_block.push(tree_idx)
      patched_stash.push(stash_idx)
    }
    graphTracer.select(tree_idx)
    block_access_pattern[tree_idx]++;
    blockAccessTracer.set(block_access_pattern);
    Tracer.delay();
  }

  for (let index = evict_path.length - 1; index >= 0; index--) {
    let tree_idx = evict_path[index];
    graphTracer.deselect(tree_idx)
  }
  for (let index = 0; index < patched_stash.length; index++) {
    stashTracer.depatch(patched_stash[index]);
  }
  for (let index = 0; index < patched_block.length; index++) {
    blockTracer.depatch(patched_block[index]);
  }
  path_access_pattern[leaf]++;
  pathAccessTracer.set(path_access_pattern);
  Tracer.delay();

}
// input: block_id 
// output: block id is inside stash
function oram_access(block_id, is_write) {
  logger.printf("ORAM %s, block: %d\n", is_write ? "write" : "read", block_id);

  let stash_idx = stash.indexOf(block_id)
  if (stash_idx != -1) {
    logger.printf("Found block in stash!\n");
    stashTracer.select(stash_idx)
    Tracer.delay()
    stashTracer.deselect(stash_idx)
    return
  }
  else {


    logger.printf("Updating posmap!\n");
    let leaf = posmap[block_id]
    let new_leaf = get_random_leaf();
    posmap[block_id] = new_leaf
    posmapTracer.patch(block_id, new_leaf)
    Tracer.delay()

    fetch_blocks_to_stash(leaf);

    if (is_write) {
      let free_stash_slot = stash.indexOf(-1);
      stash[free_stash_slot] = block_id;
      stashTracer.patch(free_stash_slot, block_id);
      Tracer.delay()
      stashTracer.depatch(free_stash_slot);
    }

    evict_blocks_from_stash(leaf);
    posmapTracer.depatch(block_id);
    // posmap.find(block_id)
  }
}

initialize();
for (let index = 0; index < 20; index++) {
  oram_access(index % 15, true);
}
