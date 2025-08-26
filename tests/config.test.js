describe('config module', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original env vars
    originalEnv = { ...process.env };

    // Clear any cached modules to ensure fresh load
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  it('should parse tool categories from environment variable', () => {
    process.env.MCP_TOOL_CATEGORIES = 'Contacts, Reporting, Messages';
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.tools.categories).toEqual(['Contacts', 'Reporting', 'Messages']);
  });

  it('should parse tool modes from environment variable', () => {
    process.env.MCP_TOOL_MODES = 'read, write';
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.tools.modes).toEqual(['read', 'write']);
  });

  it('should parse excluded tool modes from environment variable', () => {
    process.env.MCP_TOOL_EXCLUDE_MODES = 'delete';
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.tools.excludedModes).toEqual(['delete']);
  });

  it('should handle empty tool categories, modes, and exclusions', () => {
    // Don't set MCP_TOOL_* env vars at all
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.tools.categories).toEqual([]);
    expect(config.tools.modes).toEqual([]);
    expect(config.tools.excludedModes).toEqual([]);
  });

  it('should customize server name and version from environment variables', () => {
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';
    process.env.MCP_SERVER_NAME = 'Custom MCP Server';
    process.env.MCP_SERVER_VERSION = '1.2.3';

    const config = require('../src/config').default;

    expect(config.server.name).toBe('Custom MCP Server');
    expect(config.server.version).toBe('1.2.3');
  });

  it('should provide default server name and version if not in environment', () => {
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';
    // Don't set MCP_SERVER_* env vars

    const config = require('../src/config').default;

    expect(config.server.name).toBe('Sinch MessageMedia MCP Server');
    expect(config.server.version).toBe('0.4.0');
  });

  it('should customize retry settings from environment variables', () => {
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';
    process.env.MCP_MAX_RETRIES = '10';
    process.env.MCP_RETRY_DELAY_MS = '500';

    const config = require('../src/config').default;

    expect(config.retries.max).toBe(10);
    expect(config.retries.delayMs).toBe(500);
  });

  it('should return valid=true when both API_KEY and API_SECRET are set', () => {
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.isValid()).toBe(true);
  });

  it('should return valid=false when API_KEY is missing', () => {
    // Only set API_SECRET
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    const config = require('../src/config').default;

    expect(config.isValid()).toBe(false);
  });

  it('should return valid=false when API_SECRET is missing', () => {
    // Only set API_KEY
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';

    const config = require('../src/config').default;

    expect(config.isValid()).toBe(false);
  });

  it('should generate Auth header from API credentials', () => {
    process.env.SINCH_ENGAGE_API_KEY = 'test-key';
    process.env.SINCH_ENGAGE_API_SECRET = 'test-secret';

    // Save original btoa function
    const originalBtoa = global.btoa;
    // Mock btoa function for predictable test results
    global.btoa = jest.fn().mockReturnValue('dGVzdC1rZXk6dGVzdC1zZWNyZXQ=');

    try {
      const config = require('../src/config').default;
      const authHeader = config.getAuthHeader();

      expect(authHeader).toBe('Basic dGVzdC1rZXk6dGVzdC1zZWNyZXQ=');
      expect(global.btoa).toHaveBeenCalledWith('test-key:test-secret');
    } finally {
      // Restore original btoa function
      global.btoa = originalBtoa;
    }
  });
});
