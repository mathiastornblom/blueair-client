import dotenv from "dotenv";
import { ApiClient } from "../src/blueairClient";

// Load environment variables from .env file
dotenv.config();

describe("BlueAir Client Integration Tests", () => {
	let client: ApiClient;
	let isClientInitialized = false;
	const correctName: string = process.env.CORRECT_NAME!;
	const rightPassword: string = process.env.RIGHT_PASSWORD!;

	// Initialize the API client before running any tests
	beforeAll(async () => {
		client = new ApiClient(correctName, rightPassword);
		try {
			isClientInitialized = await client.initialize();
		} catch (error) {
			console.error("Error during client initialization:", error);
		}
	});

	// Ensure the client is initialized before running any test that requires it
	function ensureClientInitialized() {
		if (!isClientInitialized) {
			throw new Error("Client not initialized");
		}
	}

	it("should fail initialization with a wrong username and password", async () => {
		const wrongPasswordClient = new ApiClient(
			"wrong-name@domain.com",
			"wrong-password"
		);
		const result = await wrongPasswordClient.initialize();
		expect(result).toBe(false);
	}, 10000); // Increase timeout to 10 seconds

	it("should have a valid endpoint", () => {
		ensureClientInitialized();
		expect(client.endpoint).toBeTruthy();
		expect(client.endpoint).not.toBeNull();
	});

	it("should have a valid authentication token", () => {
		ensureClientInitialized();
		expect(client.authToken).toBeTruthy();
		expect(client.authToken).not.toBeNull();
	});

	it("should fetch devices", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			console.log("Devices JSON Response:", devices);
			expect(devices.length).toBeGreaterThan(0);
		} catch (error) {
			console.error("Error fetching devices:", error);
			throw error;
		}
	});

	it("should fetch device attributes for the first device", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				const attributes = await client.getDeviceAttributes(uuid);
				console.log("Device Attributes JSON Response:", attributes);
				expect(attributes).toBeTruthy();
			}
		} catch (error) {
			console.error("Error fetching device attributes:", error);
			throw error;
		}
	});

	it("should fetch device info for the first device", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				const deviceInfo = await client.getDeviceInfo(uuid);
				console.log("Device Info JSON Response:", deviceInfo);
				expect(deviceInfo).toBeTruthy();
			}
		} catch (error) {
			console.error("Error fetching device info:", error);
			throw error;
		}
	});

	it("should set fan speed for the first device", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				await client.setFanSpeed(uuid, "1", "2");
			}
		} catch (error) {
			console.error("Error setting fan speed:", error);
			throw error;
		}
	});

	it("should set brightness for the first device", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				await client.setBrightness(uuid, "1", "2");
			}
		} catch (error) {
			console.error("Error setting brightness:", error);
			throw error;
		}
	});

	it("should set child lock for the first device", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				await client.setChildLock(uuid, "1", "0");
			}
		} catch (error) {
			console.error("Error setting child lock:", error);
			throw error;
		}
	});

	it("should throw an error for invalid fan speed values", async () => {
		ensureClientInitialized();
		expect.assertions(1);
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				await client.setFanSpeed(uuid, "5", "2");
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error("Expected error:", error);
				expect(error.message).toBe(
					"Invalid fan speed value. Acceptable values are 0, 1, 2, or 3."
				);
			} else {
				console.error("Caught unexpected non-error value:", error);
				throw error;
			}
		}
	});

	it("should throw an error for invalid brightness values", async () => {
		ensureClientInitialized();
		expect.assertions(1);
		try {
			const devices = await client.getDevices();
			if (devices.length > 0) {
				const uuid = devices[0].uuid;
				await client.setBrightness(uuid, "5", "2");
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error("Expected error:", error);
				expect(error.message).toBe(
					"Invalid brightness value. Acceptable values are 0, 1, 2, 3 or 4."
				);
			} else {
				console.error("Caught unexpected non-error value:", error);
				throw error;
			}
		}
	});

	it("should throw an error when missing arguments", async () => {
		ensureClientInitialized();
		expect.assertions(1);
		try {
			await client.setFanSpeed("", "", "");
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).toBe("Missing arguments");
			} else {
				throw error;
			}
		}
	});

	it("should gracefully handle expired/invalid authentication token", async () => {
		ensureClientInitialized();
		expect.assertions(1);

		const prototype = Object.getPrototypeOf(client);
		const descriptor = Object.getOwnPropertyDescriptor(prototype, "authToken");
		const originalGetAuthToken = descriptor?.get;

		jest.spyOn(prototype, "authToken", "get").mockReturnValue("invalidToken");

		try {
			await client.getDevices();
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).toBe("Auth token invalid or expired");
			} else {
				throw error;
			}
		} finally {
			jest
				.spyOn(prototype, "authToken", "get")
				.mockImplementation(originalGetAuthToken!);
		}
	});

	it("should throw an error for non-numeric fan speed values", async () => {
		ensureClientInitialized();
		expect.assertions(1);
		try {
			await client.setFanSpeed("uuidSample", "one", "two");
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).toBe("Fan speed value must be numeric.");
			} else {
				throw error;
			}
		}
	});

	it("should throw an error for non-numeric brightness values", async () => {
		ensureClientInitialized();
		expect.assertions(1);
		try {
			await client.setBrightness("uuidSample", "one", "two");
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).toBe("Brightness value must be numeric.");
			} else {
				throw error;
			}
		}
	});

	it("should handle no devices scenario gracefully", async () => {
		ensureClientInitialized();
		try {
			const devices = await client.getDevices();
			if (devices.length === 0) {
				expect(devices.length).toBe(0);
			} else {
				console.log("Devices found:", devices.length);
				expect(devices.length).toBeGreaterThan(0);
			}
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === "Auth token invalid or expired"
			) {
				isClientInitialized = await client.initialize();
				const devices = await client.getDevices();
				if (devices.length === 0) {
					expect(devices.length).toBe(0);
				} else {
					console.log("Devices found:", devices.length);
					expect(devices.length).toBeGreaterThan(0);
				}
			} else {
				throw error;
			}
		}
	});
});
