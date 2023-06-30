// import visualization libraries {
const { Tracer, GraphTracer, LogTracer, Randomize, Layout, VerticalLayout, Array1DTracer, Array2DTracer } = require('algorithm-visualizer');
// }

var G = []
var num_blocks;
var max_leafs;
var stash_capacity;
var stash = []
var posmap = []
var block_id_in_tree = []
var block_access_pattern = []
var path_access_pattern = []

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

function build_oram_adj_matrix() {
  G = new Array(num_blocks).fill(0).map(() => new Array(0).fill(0))
  let j = 0;
  for (let i = 0; i < num_blocks - max_leafs; i++) {
    G[i][i + j + 1] = 1;
    G[i][i + j + 2] = 1;
    j++;
  }
}

function initialize(height) {
  num_blocks = (2 ** height) - 1;
  max_leafs = 2 ** (height - 1);
  stash_capacity = num_blocks;
  stash = new Array(stash_capacity).fill(-1)
  posmap = new Array(num_blocks)
  block_id_in_tree = new Array(num_blocks).fill(-1)
  block_access_pattern = new Array(num_blocks).fill(0)
  path_access_pattern = new Array(max_leafs).fill(0)

  build_oram_adj_matrix()
  for (let index = 0; index < num_blocks; index++) {
    posmap[index] = get_random_leaf();
  }

  Layout.setRoot(new VerticalLayout([posmapTracer, stashTracer, graphTracer, blockTracer, blockAccessTracer, pathAccessTracer, logger]));
  posmapTracer.set(posmap)
  stashTracer.set(stash)
  blockTracer.set(block_id_in_tree)
  graphTracer.set(G);
  // Set root node = 0
  graphTracer.layoutTree(0);
}


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
    logger.printf("-> block %d (leaf = %d) evictable cat for leaf %d level %d\n", block_id, posmap[block_id], leaf, level)
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
function stash_access(block_id, is_write) {
  let stash_idx = stash.indexOf(block_id)
  if (is_write) {
    if (stash_idx == -1) {
      let free_stash_slot = get_free_stash_slot()
      stash[free_stash_slot] = block_id;
      stashTracer.patch(free_stash_slot, block_id);
      Tracer.delay()
      stashTracer.depatch(free_stash_slot);
    }
    else {
      stashTracer.select(stash_idx);
      Tracer.delay()
      stashTracer.deselect(stash_idx);
    }
  }
  else {
    if (stash_idx != -1) {
      stashTracer.select(stash_idx);
      Tracer.delay()
      stashTracer.deselect(stash_idx);
    }
    else {
      logger.printf("-> Block %d not found!\n", block);
    }
  }
}
// input: block_id 
// output: block id is inside stash
function oram_access(block_id, is_write) {
  logger.printf("ORAM %s access, block: %d\n", is_write ? "write" : "read", block_id);

  let leaf = posmap[block_id]
  let new_leaf = get_random_leaf();
  logger.printf("1. Updating posmap of block %d: %d -> %d\n", block_id, leaf, new_leaf);
  posmap[block_id] = new_leaf;
  posmapTracer.patch(block_id, new_leaf)
  Tracer.delay()

  fetch_blocks_to_stash(leaf);

  logger.printf("3. %s data of block %d inside stash\n", is_write ? "Writing" : "Reading", block_id)
  stash_access(block_id, is_write);


  evict_blocks_from_stash(leaf);
  posmapTracer.depatch(block_id);
  // posmap.find(block_id)
  //
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
initialize(height = 3);

// oram_write(15);
function sequential_write(count) {
  for (let index = 0; index < count; index++) {
    oram_write(index % num_blocks);
  }
}

function random_write(count) {
  for (let index = 0; index < count; index++) {
    const block = Randomize.Integer({ min: 0, max: num_blocks - 1 }); // item to be searched
    oram_write(block);
  }
}

function sequential_read(count) {
  for (let index = 0; index < count; index++) {
    oram_read(index % num_blocks);
  }
}

function random_read(count) {
  for (let index = 0; index < count; index++) {
    const block = Randomize.Integer({ min: 0, max: num_blocks - 1 }); // item to be searched
    oram_read(block);
  }
}

sequential_write(1000)
