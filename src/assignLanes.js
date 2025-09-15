/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * @returns an array of arrays containing items.
 */
function assignLanes(items) {
  const sortedItems = items.sort((a, b) =>
      new Date(a.start) - new Date(b.start)
  );
  const lanes = [];

  function assignItemToLane(item) {
      for (const lane of lanes) {
          if (new Date(lane[lane.length - 1].end) < new Date(item.start)) {
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
