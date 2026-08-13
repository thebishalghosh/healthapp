const user = {
  name: 'Bishal',
  healthScore: 83,
  water: { current: 1.8, goal: 2.5 },
  calories: { current: 1420, goal: 2200 },
  protein: { current: 78, goal: 120 },
  steps: 6420,
};

const todaysPlan = [
  { id: 'b1', title: 'Breakfast', time: '8:00 AM', done: true },
  { id: 'l1', title: 'Lunch', time: '12:30 PM', done: false },
  { id: 'w1', title: 'Workout', time: '6:00 PM', done: false },
  { id: 'd1', title: 'Dinner', time: '8:00 PM', done: false },
];

export { user, todaysPlan };
