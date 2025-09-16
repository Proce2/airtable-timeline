/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * Items are not mutated; a shallow copy is sorted and processed.
 * Overlap rule: an item shares a lane only if the previous lane item ends
 * strictly before the next item starts.
 * @param {Array<{id:number,start:string,end:string,name:string}>} items
 * @returns {Array<Array<object>>} An array of lanes (each lane is an array of items)
 */
function assignLanes(items) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );
  const lanes = [];

  function assignItemToLane(item) {
    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (new Date(last.end) < new Date(item.start)) {
        lane.push(item);
        return;
      }
    }
    lanes.push([item]);
  }

  for (const item of sortedItems) {
    assignItemToLane(item);
  }
  return lanes;
}

export default assignLanes;
