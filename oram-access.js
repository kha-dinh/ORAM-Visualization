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
const blockTracer = new Array1DTracer('ORAM Storage');
const posmapTracer = new Array1DTracer('Position Map');
const blockAccessTracer = new Array1DTracer('Block Access Pattern');
const pathAccessTracer = new Array1DTracer('Path Access Pattern');
// const tracer = new GraphTracer(' ORAM Tree ');
const logger = new LogTracer('Log');

// }                     h

function get_random_leaf() {
  return Randomize.Integer({ min: 0, max: max_leafs - 1 })
}

function get_free_stash_slot() {

  let stash_idx = stash.indexOf(-1);
  if (stash_idx == -1) {
    throw new Error('Stash is full');
  }
  return stash_idx
}

function P(leaf_id, level) {
  return (1 << level) - 1 + (leaf_id >> (height - level - 1))
}
// Leaf ID
function get_path(leaf_id) {
  var path = [];
  // logger.printf("Getting path for leaf id %d\n", leaf_id);
  // Calculate the index for each layer
  for (let level = 0; level < height; level++) {
    // (2^level - 1) + leaf_id >> (height - level - 2)
    // height = 4, level = 0, leaf id = 1
    // (2^0 - 1) +  1 >> (4 - 0 - 1) = 0 
    let node = P(leaf_id, level)
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


  Layout.setRoot(new VerticalLayout([posmapTracer, stashTracer, graphTracer, blockTracer, blockAccessTracer, pathAccessTracer, logger]));

  posmapTracer.set(posmap)
  stashTracer.set(stash)
  blockTracer.set(block_id_in_tree)

  // posmapTracer.
  graphTracer.set(G);
  graphTracer.layoutTree(0);
  // stashTracer.log(logger)
  // graphTracer.log(logger);
}
function read_tree_to_stash(stash_idx, tree_idx) {
  graphTracer.select(tree_idx);
  block_access_pattern[tree_idx]++;
  blockAccessTracer.set(block_access_pattern);
  let block_id = block_id_in_tree[tree_idx];
  if (block_id != -1) {
    stash[stash_idx] = block_id;
    stashTracer.patch(stash_idx, block_id);
  }
  logger.printf("-> Fetching node %d, block %d, into stash\n", tree_idx, block_id)
  block_id_in_tree[tree_idx] = -1
  blockTracer.patch(tree_idx, -1);

}
function fetch_blocks_to_stash(leaf) {
  logger.printf("2. Fetching blocks from leaf %d to stash\n", leaf);
  path = get_path(leaf)
  path_access_pattern[leaf]++;
  pathAccessTracer.set(path_access_pattern);
  // visualize {
  let patched_stash = [];
  let patched_block = [];
  //}
  path.map((tree_idx) => {
    let stash_idx = get_free_stash_slot();
    read_tree_to_stash(stash_idx, tree_idx);
    patched_block.push(tree_idx)
    patched_stash.push(stash_idx);
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

function is_evictable(block_id, leaf, level) {
  // I.e., their path colides
  let can_evict = (P(leaf, level) == P(posmap[block_id], level))
  if (can_evict)
    logger.printf("-> block %d (leaf = %d) evictable at for leaf %d level %d\n", block_id, posmap[block_id], leaf, level)
  return can_evict;
}


function write_stash_to_tree(stash_idx, tree_idx) {

  let block_id;
  if (stash_idx != -1) {
    block_id = stash[stash_idx];
    stash[stash_idx] = -1;
  }
  else block_id = -1;
  logger.printf("-> Writing blocks %d to node %d\n", block_id, tree_idx);
  block_id_in_tree[tree_idx] = block_id;
  block_access_pattern[tree_idx]++;

  blockTracer.patch(tree_idx, block_id)
  if (stash_idx != -1) {
    stashTracer.patch(stash_idx, -1);
  }
}


function evict_blocks_from_stash(leaf) {
  // Try to find unused block first
  // let evict_stash_slot = stash.indexOf(-1);
  logger.printf("4. Evicting blocks to leaf %d\n", leaf);
  let evict_path = get_path(leaf)
  let patched_stash = []
  let patched_block = []
  evict_path.reverse().map((tree_idx) => {
    let level = evict_path.length - 1 - evict_path.indexOf(tree_idx);
    let stash_idx = stash.findIndex((value, _idx, _obj) => { return (value != -1) && is_evictable(value, leaf, level) })
    write_stash_to_tree(stash_idx, tree_idx)
    if (stash_idx != -1)
      patched_stash.push(stash_idx)

    patched_block.push(tree_idx)
    graphTracer.select(tree_idx)
    blockAccessTracer.set(block_access_pattern);
    Tracer.delay();
  })
  path_access_pattern[leaf]++;

  // Clear the highlights
  evict_path.map((tree_idx) => {
    graphTracer.deselect(tree_idx)
  })
  patched_stash.map((stash_idx) => {
    stashTracer.depatch(stash_idx);
  })
  patched_block.map((block_idx) => {
    blockTracer.depatch(block_idx);
  })
  pathAccessTracer.set(path_access_pattern);
  Tracer.delay();



}
// input: block_id 
// output: block id is inside stash
function oram_access(block_id, is_write) {
  logger.printf("ORAM %s access, block: %d\n", is_write ? "write" : "read", block_id);

  let stash_idx = stash.indexOf(block_id)
  if (stash_idx != -1) {
    logger.printf("Found block in stash!\n");
    stashTracer.select(stash_idx)
    Tracer.delay()
    stashTracer.deselect(stash_idx)
  }
  else {
    let leaf = posmap[block_id]
    let new_leaf = get_random_leaf();
    logger.printf("1. Updating posmap of block %d: %d -> %d\n", block_id, leaf, new_leaf);
    posmap[block_id] = new_leaf
    posmapTracer.patch(block_id, new_leaf)
    Tracer.delay()

    fetch_blocks_to_stash(leaf);

    logger.printf("3. %s data of block %d inside stash\n", is_write ? "Writing" : "Reading", block_id)
    if (is_write) {
      let free_stash_slot = get_free_stash_slot()
      stash[free_stash_slot] = block_id;
      stashTracer.patch(free_stash_slot, block_id);
      Tracer.delay()
      stashTracer.depatch(free_stash_slot);
    }
    else {

    }

    evict_blocks_from_stash(leaf, block_id);
    posmapTracer.depatch(block_id);
    // posmap.find(block_id)
  }
  logger.println("ORAM access done.")
  logger.println("------------------")
  Tracer.delay()
}
function oram_read(block) {
  oram_access(block, false)
}
function oram_write(block) {
  oram_access(block, true)
}
initialize();
for (let index = 0; index < 15; index++) {
  oram_write(index % 15, true);
}
for (let index = 0; index < 50; index++) {
  oram_read(index % 15, true);
}
// oram_access(0, true);
// oram_access(2, true);
// oram_access(5, true);
// oram_access(12, true);
