beforeAll(() => {
  console.log('run once before all tests');
})
// function sum(a, b) {
//   return a + b;
// }

// test('sum 1 + 2 = 3', () => {
//   expect(sum(1, 2)).toBe(3);
// })

// test('kiểm tra object', () => {
//   const data = { one: 1 };
//   expect(data).toEqual({ one: 1 });
// })

// test('null', () => {
//   expect(null).toBeNull();
// })

// test('undefined', () => {
//   expect(undefined).toBeUndefined();
// })

// test('truethy', () => {
//   expect(1).toBeTruthy();
// })

// test('falsy', () => {
//   expect(0).toBeFalsy();
// })

// test('contains', () => {
//   expect([1, 2, 3]).toContain(2);
// })

// const myPromise = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('data');
//   }, 1000);
// });

// test('resolves data', () => {
//   return expect(myPromise).resolves.toBe('data');
// })

const getUser = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({ id: 1, name: 'John' });
  }, 1000);
})



afterAll(() => {
  console.log('run once after all tests');
})

beforeEach(() => {
  console.log('run before each test');
})

afterEach(() => {
  console.log('run after each test');
})

test('fetch user', async () => {
  const user = await getUser;
  expect(user.name).toBe('John');
})

test('null2', () => {
  const n = null;
  expect(n).toBeNull();
  expect(n).toBeDefined();
  expect(n).toBeUndefined();
  expect(n).not.toBeTruthy();
  expect(n).toBeFalsy();
});

test('zero', () => {
  const z = 0;
  expect(z).not.toBeNull();
  expect(z).toBeDefined();
  expect(z).not.toBeUndefined();
  expect(z).not.toBeTruthy();
  expect(z).toBeFalsy();
});