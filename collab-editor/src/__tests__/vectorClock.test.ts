import {
  createVectorClock, incrementClock, mergeClock, compareClock
} from '../lib/sync/vectorClock';

describe('VectorClock', () => {
  test('creates clock with initial node', () => {
    const clock = createVectorClock('user1');
    expect(clock).toEqual({ user1: 0 });
  });

  test('increments correctly', () => {
    let clock = createVectorClock('user1');
    clock = incrementClock(clock, 'user1');
    expect(clock.user1).toBe(1);
    clock = incrementClock(clock, 'user1');
    expect(clock.user1).toBe(2);
  });

  test('merges taking max values', () => {
    const a = { user1: 3, user2: 1 };
    const b = { user1: 1, user2: 4, user3: 2 };
    const merged = mergeClock(a, b);
    expect(merged).toEqual({ user1: 3, user2: 4, user3: 2 });
  });

  test('detects equal clocks', () => {
    const a = { user1: 2, user2: 3 };
    const b = { user1: 2, user2: 3 };
    expect(compareClock(a, b)).toBe('equal');
  });

  test('detects before relationship', () => {
    const a = { user1: 1, user2: 1 };
    const b = { user1: 2, user2: 2 };
    expect(compareClock(a, b)).toBe('before');
  });

  test('detects after relationship', () => {
    const a = { user1: 3, user2: 3 };
    const b = { user1: 1, user2: 2 };
    expect(compareClock(a, b)).toBe('after');
  });

  test('detects concurrent (conflict) clocks', () => {
    const a = { user1: 3, user2: 1 };
    const b = { user1: 1, user2: 3 };
    expect(compareClock(a, b)).toBe('concurrent');
  });
});
