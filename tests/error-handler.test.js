import { handleError } from '../src/error-handler.js';

// Mock console.error for all tests
beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterEach(() => {
    jest.restoreAllMocks();
});

describe('handleError', () => {
    it('logs a generic error with phase', () => {
        const error = new Error('Something went wrong');
        handleError(error, { phase: 'testPhase' });
        expect(console.error).toHaveBeenCalledWith('\n');
        expect(console.error).toHaveBeenCalledWith('[MCP Error] [testPhase] Error: Something went wrong');
        expect(console.error).toHaveBeenCalledWith('\n');
    });

    it('logs error with tool and params context', () => {
        const error = new Error('Tool failed');
        const tool = { name: 'TestTool', id: 'tool-1' };
        const params = { foo: 'bar' };
        handleError(error, { phase: 'toolPhase', tool, params });
        expect(console.error).toHaveBeenCalledWith('[MCP Error] [toolPhase] Tool: TestTool');
        expect(console.error).toHaveBeenCalledWith('[MCP Error] [toolPhase] Params: {"foo":"bar"}');
    });

    it('logs error stack if present', () => {
        const error = new Error('Stack error');
        error.stack = 'stacktrace';
        handleError(error, { phase: 'stackPhase' });
        expect(console.error).toHaveBeenCalledWith('stacktrace');
    });

    it('handles missing context gracefully', () => {
        const error = new Error('No context');
        handleError(error);
        expect(console.error).toHaveBeenCalledWith('[MCP Error] Error: No context');
    });
});
