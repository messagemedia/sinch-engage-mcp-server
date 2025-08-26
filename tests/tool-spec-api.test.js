// Mock axios before importing the module
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({
      data: { resources: [{ name: 'foo' }] }
    })
  }))
}));

import { listResources } from "../src/tool-spec-api.js";

describe('tool-spec-api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listResources should return data', async () => {
    const data = await listResources();
    expect(data.resources[0].name).toBe('foo');
  });

});
