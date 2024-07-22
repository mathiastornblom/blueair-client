import ApiClient from "../src/blueairClient";

/**
 * BlueAir Client Integration Tests
 *
 * This test suite covers the following scenarios:
 * - Initialization with correct and incorrect credentials
 * - Fetching device list, device attributes, and device info
 * - Setting device settings (fan speed, brightness, child lock)
 * - Handling invalid values for device settings
 * - Handling expired/invalid authentication tokens
 * - Gracefully handling scenarios with no devices
 */

let client: ApiClient;

beforeAll(async () => {
	// Initialize the client before running tests
	client = new ApiClient("mathias@tornbloms.net", "Hajfena2023?");
	await client.initialize();
});

// Helper function to ensure the client is initialized before each test
async function ensureClientInitialized() {
	if (!client.authToken) {
		await client.initialize();
	}
}

describe("BlueAir Client Integration Tests", () => {
	// Test case to ensure initialization fails with incorrect credentials
	it("should fail initialization with a wrong username and password", async () => {
		const wrongPasswordClient = new ApiClient(
			"wrong-name@domain.com",
			"wrong-password"
		);
		const initResult = await wrongPasswordClient.initialize();
		expect(initResult).toBe(false);
	}, 10000);

	// Test case to validate the API endpoint
	it("should have a valid endpoint", () => {
		expect(client.endpoint).toBe("api-eu-west-1.blueair.io");
	});

	// Test case to validate the authentication token
	it("should have a valid authentication token", () => {
		expect(client.authToken).toBeDefined();
	});

	// Test case to fetch the list of devices
	it("should fetch devices", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		console.log("Devices JSON Response:", devices);
		expect(devices.length).toBeGreaterThan(0);
	});

	// Test case to fetch attributes for the first device
	it("should fetch device attributes for the first device", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		const deviceAttributes = await client.getDeviceAttributes(devices[0].uuid);
		console.log("Device Attributes JSON Response:", deviceAttributes);
		expect(deviceAttributes).toBeDefined();
	});

	// Test case to fetch info for the first device
	it("should fetch device info for the first device", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		const deviceInfo = await client.getDeviceInfo(devices[0].uuid);
		console.log("Device Info JSON Response:", deviceInfo);
		expect(deviceInfo).toBeDefined();
	});

	// Test case to set fan speed for the first device
	it("should set fan speed for the first device", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		await client.setFanSpeed(devices[0].uuid, 2);
	});

	// Test case to set brightness for the first device
	it("should set brightness for the first device", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		await client.setBrightness(devices[0].uuid, 3);
	});

	// Test case to set child lock for the first device
	it("should set child lock for the first device", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		await client.setChildLock(devices[0].uuid, true);
	});

	// Test case to throw an error for invalid fan speed values
	it("should throw an error for invalid fan speed values", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		try {
			await client.setFanSpeed(devices[0].uuid, 5); // Invalid value
		} catch (error) {
			console.error("Expected error:", error);
			expect(error.message).toBe(
				"Invalid fan speed value. Acceptable values are 0, 1, 2, or 3."
			);
		}
	});

	// Test case to throw an error for invalid brightness values
	it("should throw an error for invalid brightness values", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		try {
			await client.setBrightness(devices[0].uuid, 5); // Invalid value
		} catch (error) {
			console.error("Expected error:", error);
			expect(error.message).toBe(
				"Invalid brightness value. Acceptable values are 0, 1, 2, 3 or 4."
			);
		}
	});

	// Test case to throw an error when missing arguments
	it("should throw an error when missing arguments", async () => {
		await ensureClientInitialized();
		try {
			// @ts-expect-error
			await client.setFanSpeed(); // Missing arguments
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
		}
	});

	// Test case to gracefully handle expired/invalid authentication token
	it("should gracefully handle expired/invalid authentication token", async () => {
		const expiredClient = new ApiClient(
			"mathias@tornbloms.net",
			"Hajfena2023?"
		);
		jest
			.spyOn(expiredClient, "authToken", "get")
			.mockReturnValue("invalid-or-expired-token");
		try {
			await expiredClient.getDevices();
		} catch (error) {
			expect(error.message).toBe("Auth token invalid or expired");
		}
	});

	// Test case to throw an error for non-numeric fan speed values
	it("should throw an error for non-numeric fan speed values", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		try {
			// @ts-expect-error
			await client.setFanSpeed(devices[0].uuid, "high"); // Non-numeric value
		} catch (error) {
			expect(error.message).toBe(
				"Invalid fan speed value. Acceptable values are 0, 1, 2, or 3."
			);
		}
	});

	// Test case to throw an error for non-numeric brightness values
	it("should throw an error for non-numeric brightness values", async () => {
		await ensureClientInitialized();
		const devices = await client.getDevices();
		try {
			// @ts-expect-error
			await client.setBrightness(devices[0].uuid, "high"); // Non-numeric value
		} catch (error) {
			expect(error.message).toBe(
				"Invalid brightness value. Acceptable values are 0, 1, 2, 3 or 4."
			);
		}
	});

	// Test case to handle scenarios with no devices gracefully
	it("should handle no devices scenario gracefully", async () => {
		const noDeviceClient = new ApiClient(
			"no-device-user@domain.com",
			"password"
		);
		await noDeviceClient.initialize();
		try {
			const devices = await noDeviceClient.getDevices();
			expect(devices.length).toBe(0);
		} catch (error) {
			console.error("Error fetching devices:", error);
			throw error;
		}
	});
});
