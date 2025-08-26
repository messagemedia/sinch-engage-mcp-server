import { createToolRegistration, isValidToolDefinition } from '../src/tool-registration.js';

// Mock the dependencies
jest.mock('../src/tool-utils.js', () => ({
    executeTool: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/schema-converter.js', () => ({
    convertToZodSchema: jest.fn().mockReturnValue({ name: 'mockZodSchema' }),
    normalizeSchema: jest.fn().mockReturnValue({
        type: 'object',
        properties: {},
        required: []
    })
}));

describe('Tool Registration', () => {
    describe('isValidToolDefinition', () => {
        test('should return false for null/undefined', () => {
            expect(isValidToolDefinition(null)).toBe(false);
            expect(isValidToolDefinition(undefined)).toBe(false);
        });

        test('should return false for non-objects', () => {
            expect(isValidToolDefinition('string')).toBe(false);
            expect(isValidToolDefinition(123)).toBe(false);
            expect(isValidToolDefinition([])).toBe(false);
        });

        test('should return false for objects without name or id', () => {
            expect(isValidToolDefinition({})).toBe(false);
            expect(isValidToolDefinition({ description: 'test' })).toBe(false);
        });

        test('should return true for objects with name', () => {
            expect(isValidToolDefinition({ name: 'testTool' })).toBe(true);
        });

        test('should return true for objects with id', () => {
            expect(isValidToolDefinition({ id: 'testTool' })).toBe(true);
        });

        test('should return true for objects with both name and id', () => {
            expect(isValidToolDefinition({
                name: 'testTool',
                id: 'testId'
            })).toBe(true);
        });
    });

    describe('createToolRegistration', () => {
        test('should create registration with name', () => {
            const toolDefinition = {
                name: 'testTool',
                description: 'A test tool',
                requestBodySchema: {
                    type: 'object',
                    properties: { param1: { type: 'string' } }
                }
            };

            const registration = createToolRegistration(toolDefinition);

            expect(registration.name).toBe('testTool');
            expect(registration.description).toBe('A test tool');
            expect(registration.schema).toEqual({ name: 'mockZodSchema' });
            expect(typeof registration.handler).toBe('function');
        });

        test('should create registration with id when name missing', () => {
            const toolDefinition = {
                id: 'testToolId',
                description: 'A test tool'
            };

            const registration = createToolRegistration(toolDefinition);

            expect(registration.name).toBe('testToolId');
            expect(registration.description).toBe('A test tool');
        });

        test('should generate description when missing', () => {
            const toolDefinition = {
                name: 'testTool'
            };

            const registration = createToolRegistration(toolDefinition);

            expect(registration.description).toBe('Tool: testTool');
        });

        test('should use parameters when requestBodySchema missing', () => {
            const toolDefinition = {
                name: 'testTool',
                parameters: {
                    type: 'object',
                    properties: { param1: { type: 'string' } }
                }
            };

            const registration = createToolRegistration(toolDefinition);

            expect(registration.schema).toEqual({ name: 'mockZodSchema' });
        });

        test('should handle missing name and id with fallback', () => {
            const toolDefinition = {
                description: 'A test tool'
            };

            const registration = createToolRegistration(toolDefinition);

            expect(registration.name).toBe('unnamed-tool');
            expect(registration.description).toBe('A test tool');
        });

        test('should create async handler function', async () => {
            const toolDefinition = { name: 'testTool' };
            const registration = createToolRegistration(toolDefinition);

            const result = await registration.handler({ param: 'value' });
            expect(result).toEqual({ success: true });
        });
    });
});
