// jest.mock('../services/table.service.js', () => ({
//   getTables: jest.fn().mockResolvedValue([
//     { id: 1, name: 'Table 1', status: 'available' },
//     { id: 2, name: 'Table 2', status: 'occupied' }
//   ])
// }))


// const { getTables } = require('../services/table.service.js');
// describe('Table Controller', () => {
//   test('Get table', async () => {
//     const result = await getTables();
//     expect(result).toEqual([
//       { id: 1, name: 'Table 1', status: 'available' },
//       { id: 2, name: 'Table 2', status: 'occupie' }
//     ]);
//   })
// })


import request from 'supertest';
import app from '../app.js';

describe('GET /api/tables', () => {
  it('should return a list of tables', async () => {
    const res = await request(app).get('/api/tables');
    expect(res.statusCode).toEqual(200);
  })
})