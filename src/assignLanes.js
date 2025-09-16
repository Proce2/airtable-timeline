/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * Prevents any overlapping by checking all items in each lane.
 * @returns an array of arrays containing items.
 */
function assignLanes(items) {
  const sortedItems = items.sort((a, b) =>
      new Date(a.start) - new Date(b.start)
  );
  const lanes = [];

  function hasOverlap(item1, item2) {
    const start1 = new Date(item1.start);
    const end1 = new Date(item1.end);
    const start2 = new Date(item2.start);
    const end2 = new Date(item2.end);
    
    // Check if dates overlap (including touching dates)
    return start1 <= end2 && start2 <= end1;
  }

  function canPlaceInLane(item, lane) {
    // Check if item overlaps with ANY item in the lane
    for (const existingItem of lane) {
      if (hasOverlap(item, existingItem)) {
        return false;
      }
    }
    return true;
  }

  function assignItemToLane(item) {
    // Try to find an existing lane where this item can fit
    for (const lane of lanes) {
      if (canPlaceInLane(item, lane)) {
        lane.push(item);
        return;
      }
    }
    // If no existing lane works, create a new lane
    lanes.push([item]);
  }

  for (const item of sortedItems) {
    assignItemToLane(item);
  }
  
  return lanes;
}

export default assignLanes;
