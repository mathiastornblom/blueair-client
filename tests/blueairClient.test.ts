import { ApiClient } from '../src/blueairClient';

describe('BlueAir Client', () => {
    let client: ApiClient;

    beforeAll(async () => {
        client = new ApiClient('user', 'secret');
        // Try initializing the client before any test runs
        try {
            await client.initialize();
        } catch (error) {
            console.error('Error during client initialization:', error);
        }
    });

    it('should fail initialization with a wrong username and password', async () => {
        const wrongPasswordClient = new ApiClient(
            'name@domain.com',
            'wrong-password'
        );
        expect.assertions(1);

        try {
            await wrongPasswordClient.initialize();
        } catch (error) {
            if (error instanceof Error) {
                console.error(
                    'Expected error during initialization with wrong password:',
                    error
                );
                expect(error.message).toContain(
                    'Failed to fetch auth token. Status: 404.'
                );
            } else {
                console.error(
                    'Caught unexpected non-error value during initialization:',
                    error
                );
                throw error;
            }
        }
    });

    it('should have a valid endpoint', () => {
        expect(client.endpoint).toBeTruthy();
        expect(client.endpoint).not.toBeNull();
    });

    it('should have a valid authentication token', () => {
        expect(client.authToken).toBeTruthy();
        expect(client.authToken).not.toBeNull();
    });

    it('should fetch devices', async () => {
        try {
            const devices = await client.getDevices();
            console.log('Devices JSON Response:', devices);
            expect(devices.length).toBeGreaterThan(0);
        } catch (error) {
            console.error('Error fetching devices:', error);
            throw error;
        }
    });

    it('should fetch device attributes for the first device', async () => {
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                const attributes = await client.getDeviceAttributes(uuid);
                console.log('Device Attributes JSON Response:', attributes);
                expect(attributes).toBeTruthy();
            }
        } catch (error) {
            console.error('Error fetching device attributes:', error);
            throw error;
        }
    });

    it('should fetch device info for the first device', async () => {
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                const deviceInfo = await client.getDeviceInfo(uuid);
                console.log('Device Info JSON Response:', deviceInfo);
                expect(deviceInfo).toBeTruthy();
            }
        } catch (error) {
            console.error('Error fetching device info:', error);
            throw error;
        }
    });

    it('should set fan speed for the first device', async () => {
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                const response = await client.setFanSpeed(uuid, '1', '2');
                console.log(
                    'Response for setting fan speed:',
                    JSON.stringify(response, null, 2)
                );
            }
        } catch (error) {
            console.error('Error setting fan speed:', error);
            throw error;
        }
    });
    it('should set brithness for the first device', async () => {
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                const response = await client.setBrightness(uuid, '1', '2');
                console.log(
                    'Response for setting fan speed:',
                    JSON.stringify(response, null, 2)
                );
            }
        } catch (error) {
            console.error('Error setting fan speed:', error);
            throw error;
        }
    });
    it('should throw an error for invalid fan speed values', async () => {
        expect.assertions(1);
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                await client.setFanSpeed(uuid, '5', '2');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('Expected error:', error);
                expect(error.message).toBe(
                    'Invalid fan speed value. Acceptable values are 0, 1, 2, or 3.'
                );
            } else {
                console.error('Caught unexpected non-error value:', error);
                throw error;
            }
        }
    });

    it('should set child lock for the first device', async () => {
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                const response = await client.setChildLock(uuid, '1', '0');
                console.log(
                    'Response for setting brightness:',
                    JSON.stringify(response, null, 2)
                );
            }
        } catch (error) {
            console.error('Error setting brightness:', error);
            throw error;
        }
    });

    it('should throw an error for invalid brightness values', async () => {
        expect.assertions(1);
        try {
            const devices = await client.getDevices();
            if (devices.length > 0) {
                const uuid = devices[0].uuid;
                await client.setBrightness(uuid, '5', '2');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('Expected error:', error);
                expect(error.message).toBe(
                    'Invalid brightness value. Acceptable values are 0, 1, 2, or 3.'
                );
            } else {
                console.error('Caught unexpected non-error value:', error);
                throw error;
            }
        }
    });
    it('should throw an error when missing arguments', async () => {
        expect.assertions(1);
        try {
            // Using fan speed as an example; similar tests can be created for other methods
            await client.setFanSpeed('', '', '');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Missing arguments');
            } else {
                throw error;
            }
        }
    });
    it('should gracefully handle expired/invalid authentication token', async () => {
        expect.assertions(1);

        // Get the prototype of the client instance
        const prototype = Object.getPrototypeOf(client);
        if (!prototype) {
            throw new Error(
                'Failed to obtain the prototype of the ApiClient instance.'
            );
        }

        // Get the original getter method of the authToken
        const descriptor = Object.getOwnPropertyDescriptor(
            prototype,
            'authToken'
        );
        if (!descriptor || typeof descriptor.get !== 'function') {
            throw new Error(
                'Failed to get the descriptor of the authToken property.'
            );
        }
        const originalGetAuthToken = descriptor.get;

        // Mock the authToken getter to return an invalid token
        jest.spyOn(prototype, 'authToken', 'get').mockReturnValue(
            'invalidToken'
        );

        try {
            await client.getDevices();
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Auth token invalid or expired');
            } else {
                throw error;
            }
        } finally {
            // Restore the original getter
            jest.spyOn(prototype, 'authToken', 'get').mockImplementation(
                originalGetAuthToken
            );
        }
    });

    it('should throw an error for non-numeric fan speed values', async () => {
        expect.assertions(1);
        try {
            await client.setFanSpeed('uuidSample', 'one', 'two');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Fan speed value must be numeric.');
            } else {
                throw error;
            }
        }
    });

    it('should throw an error for non-numeric brightnes values', async () => {
        expect.assertions(1);
        try {
            await client.setBrightness('uuidSample', 'one', 'two');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Brightness value must be numeric.');
            } else {
                throw error;
            }
        }
    });
    it('should handle no devices scenario gracefully', async () => {
        // This requires mocking the getDevices method to return an empty array
        jest.spyOn(client, 'getDevices').mockResolvedValue([]);
        const devices = await client.getDevices();
        expect(devices.length).toBe(0);
    });
});
