import axios from 'axios';
import * as toolUtils from '../src/tool-utils.js';
import config from '../src/config.js';

jest.mock('axios');
jest.mock('../src/config.js', () => ({
  __esModule: true,
  default: {
    api: {
      auth: {
        basic: {
          username: 'test_key',
          // deepcode ignore NoHardcodedPasswords/test: This is clearly a test password not used in production
          password: 'test_secret'
        }
      },
      platformUrl: 'https://api.test.com',
      timeout: 10000
    },
    tools: {
      categories: [],
      modes: [],
      excludedModes: [],
      modeTagMap: {
        'read': 'MCP_MODE_READ',
        'write': 'MCP_MODE_WRITE',
        'delete': 'MCP_MODE_DELETE'
      }
    },
    server: {
      name: 'Test MCP Server',
      version: '0.0.0-test'
    },
    retries: {
      max: 3,
      delayMs: 100
    },
    getAuthHeader: jest.fn().mockReturnValue('Basic dGVzdF9rZXk6dGVzdF9zZWNyZXQ='),
    isValid: jest.fn().mockReturnValue(true)
  }
}));

// Verify axios mock is working
beforeAll(() => {
  if (!axios.mock) {
    console.error('ERROR: AXIOS IS NOT MOCKED!');
  }
});

describe('sendToolRequest', () => {
  const toolDefinition = {
    name: 'testTool',
    method: 'POST',
    path: '/v1/test',
    requestBodySchema: {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' }
      }
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should make a POST request with correct data and headers', async () => {
    axios.mockResolvedValue({ data: { success: true } });
    const params = { foo: 'hello', bar: 42 };
    const result = await toolUtils.sendToolRequest(toolDefinition, params);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/v1/test'),
      headers: expect.objectContaining({
        Authorization: expect.stringContaining('Basic '),
        'Content-Type': 'application/json',
      }),
      data: expect.objectContaining({ foo: 'hello', bar: 42 })
    }));
    expect(result).toEqual({ success: true });
  });

  it('should throw on failure', async () => {
    const error = new Error('fail');
    error.response = { status: 400, statusText: 'Bad Request', data: { error: 'bad' }, headers: {} };
    axios.mockRejectedValue(error);
    const params = { foo: 'bad', bar: 0 };
    await expect(toolUtils.sendToolRequest(toolDefinition, params)).rejects.toThrow('fail');
  });

  it('should replace path parameters correctly', async () => {
    const toolDefinition = {
      method: 'GET',
      path: '/v1/resource/{id}',
      parameter_locations: { id: 'path' },
    };
    const params = { id: 123 };
    axios.mockResolvedValue({ data: { success: true } });
    const result = await toolUtils.sendToolRequest(toolDefinition, params);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://api.test.com/v1/resource/123',
    }));
    expect(result).toEqual({ success: true });
  });
});

describe('executeTool', () => {
  const toolDefinition = {
    name: 'testTool',
    method: 'POST',
    path: '/v1/test',
    requestBodySchema: {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' }
      }
    }
  };

  it('should format the response when formatResponse is true', async () => {
    axios.mockResolvedValue({ data: { success: true } });
    const params = { foo: 'hello', bar: 42 };
    const result = await toolUtils.executeTool(toolDefinition, params, { formatResponse: true });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify({ success: true }, null, 2) }]
    });
  });

  it('should return raw response when formatResponse is false', async () => {
    axios.mockResolvedValue({ data: { success: true } });
    const params = { foo: 'hello', bar: 42 };
    const result = await toolUtils.executeTool(toolDefinition, params, { formatResponse: false });
    expect(result).toEqual({ success: true });
  });
});

describe('mapParametersToSchema', () => {
  const toolDefinition = {
    requestBodySchema: {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' }
      }
    }
  };

  it('should coerce parameters to schema', () => {
    const params = { foo: 'hello', bar: '42' };
    const result = toolUtils.mapParametersToSchema(params, toolDefinition.requestBodySchema);
    expect(result).toEqual({ foo: 'hello', bar: 42 });
  });

  it('should return parameters as-is if no schema is defined', () => {
    const noSchemaToolDef = { requestBodySchema: undefined };
    const params = { foo: 'hello', bar: '42' };
    const result = toolUtils.mapParametersToSchema(params, noSchemaToolDef.requestBodySchema);
    expect(result).toEqual(params);
  });
});

describe('mapParametersToSchema - Edge Cases', () => {
  const schema = {
    type: 'object',
    properties: {
      arrayField: {
        type: 'array',
        items: { type: 'object', properties: { key: { type: 'string' } } },
      },
      objectField: {
        type: 'object',
        properties: { nestedKey: { type: 'number' } },
      },
    },
  };

  it('should handle array type with object items', () => {
    const params = { arrayField: [{ key: 'value' }] };
    const result = toolUtils.mapParametersToSchema(params, schema);
    expect(result).toEqual({ arrayField: [{ key: 'value' }] });
  });

  it('should handle array type with non-object items', () => {
    const params = { arrayField: ['value'] };
    const result = toolUtils.mapParametersToSchema(params, schema);
    expect(result).toEqual({ arrayField: ['value'] });
  });

  it('should handle object type with missing properties', () => {
    const params = { objectField: {} };
    const result = toolUtils.mapParametersToSchema(params, schema);
    expect(result).toEqual({ objectField: {} });
  });
});

describe('splitParametersByLocation - Edge Cases', () => {
  it('should handle undefined parameterLocations', () => {
    const params = { foo: 'value', bar: 42 };
    const result = toolUtils.splitParametersByLocation(params, undefined);
    expect(result).toEqual({
      pathParams: {},
      queryParams: {},
      bodyParams: { foo: 'value', bar: 42 },
    });
  });

  it('should handle parameters with mixed locations', () => {
    const params = { foo: 'value', bar: 42, baz: true };
    const locations = { foo: 'path', bar: 'query', baz: 'body' };
    const result = toolUtils.splitParametersByLocation(params, locations);
    expect(result).toEqual({
      pathParams: { foo: 'value' },
      queryParams: { bar: 42 },
      bodyParams: { baz: true },
    });
  });
});

describe('parseValueToType', () => {
  it('should parse boolean strings correctly', () => {
    expect(toolUtils.parseValueToType('true')).toBe(true);
    expect(toolUtils.parseValueToType('false')).toBe(false);
  });

  it('should parse numeric strings correctly', () => {
    expect(toolUtils.parseValueToType('42')).toBe(42);
    expect(toolUtils.parseValueToType('3.14')).toBe(3.14);
  });

  it('should return original value for non-string inputs', () => {
    expect(toolUtils.parseValueToType(42)).toBe(42);
    expect(toolUtils.parseValueToType(true)).toBe(true);
  });

  it('should handle JSON-like strings', () => {
    expect(toolUtils.parseValueToType('{"key":"value"}')).toEqual({ key: 'value' });
    expect(toolUtils.parseValueToType('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('should return original string for invalid JSON', () => {
    expect(toolUtils.parseValueToType('{invalid')).toBe('{invalid');
  });
});

