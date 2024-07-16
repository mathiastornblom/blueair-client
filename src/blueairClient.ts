import axios, { AxiosInstance, AxiosError } from "axios";

/**
 * Represents a device structure. Add more properties as per your actual data.
 */
interface Device {
	uuid: string;
	userId: string;
	mac: string;
	name: string;
}
/**
 * ApiClient Class:
 * A client for handling requests to the BlueAir API.
 * It manages authentication, determines the right endpoint, and provides methods to fetch device data.
 */

export class ApiClient {
	// Constant API key token, required for authenticating with the API.
	private readonly API_KEY_TOKEN: string =
		"eyJhbGciOiJIUzI1NiJ9.eyJncmFudGVlIjoiYmx1ZWFpciIsImlhdCI6MTQ1MzEyNTYzMiwidmFsaWRpdHkiOi0xLCJqdGkiOiJkNmY3OGE0Yi1iMWNkLTRkZDgtOTA2Yi1kN2JkNzM0MTQ2NzQiLCJwZXJtaXNzaW9ucyI6WyJhbGwiXSwicXVvdGEiOi0xLCJyYXRlTGltaXQiOi0xfQ.CJsfWVzFKKDDA6rWdh-hjVVVE9S3d6Hu9BzXG9htWFw";

	// Endpoint to determine the home host. You will need to replace this with your actual endpoint.
	private readonly HOMEHOST_ENDPOINT: string = "https://api.blueair.io/v2/";

	private username: string;
	private password: string;

	// Base64 encoded credentials for Basic Authentication.
	private base64Credentials: string;

	// The API endpoint determined after initialization.
	private _endpoint: string | null = null;

	// Authentication token fetched during initialization.
	private _authToken: string | null = null;

	/**
	 * Constructor to set up the client with necessary credentials.
	 * @param username - The user's email or username.
	 * @param password - The user's password.
	 */
	constructor(username: string, password: string) {
		this.username = username;
		this.password = password;
		this.base64Credentials = btoa(`${this.username}:${this.password}`);
	}

	// Getter for the endpoint property.
	public get endpoint(): string | null {
		return this._endpoint;
	}

	// Getter for the authToken property.
	public get authToken(): string | null {
		return this._authToken;
	}

	/**
	 * Determines the appropriate endpoint (home host) for the API.
	 * @returns {Promise<string>} - The determined API endpoint.
	 * @throws {Error} - If the fetch operation fails.
	 */
	private async determineEndpoint(): Promise<string> {
		const url = `${this.HOMEHOST_ENDPOINT}user/${encodeURIComponent(
			this.username
		)}/homehost/`;
		console.log(`Determining endpoint with URL: ${url}`);
		console.log(`Basic ${this.base64Credentials}`);

		try {
			const response = await axios.get(url, {
				headers: {
					Authorization: `Basic ${this.base64Credentials}`,
					"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				},
			});

			console.log(`Determined endpoint: ${response.data}`);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Now TypeScript knows this is an AxiosError
				console.error("Failed to determine endpoint", error);
				// Use error.response and error.message safely here
				throw new Error(
					`Failed to determine endpoint. Message: ${error.message}`
				);
			} else {
				// Handle case where error is not an AxiosError
				console.error("An unexpected error occurred", error);
				throw new Error("An unexpected error occurred");
			}
		}
	}

	/**
	 * Fetches the authentication token using the given endpoint.
	 * @param endpoint - The determined API endpoint.
	 * @returns {Promise<string|null>} - The fetched authentication token or null.
	 * @throws {Error} - If the fetch operation fails.
	 */
	private async fetchAuthToken(
		endpoint: string | null
	): Promise<string | null> {
		if (!endpoint) {
			throw new Error("Endpoint is null. Cannot fetch auth token.");
		}

		const url = `https://${endpoint}/v2/user/${encodeURIComponent(
			this.username
		)}/login/`;
		console.log(`Determining login endpoint with URL: ${url}`);

		try {
			const response = await axios.get(url, {
				headers: {
					Authorization: `Basic ${this.base64Credentials}`,
					"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				},
			});

			// Directly access data from axios response
			const data = response.data;

			// Axios automatically throws for status codes outside the 2xx range, so this check is technically not needed
			if (response.status === 200) {
				if (data === false) {
					console.error("User is locked out");
					throw new Error("User is locked out");
				}
				// Accessing headers with axios
				const authToken = response.headers["x-auth-token"];
				console.log(`Received auth token: ${authToken}`);
				return authToken;
			} else {
				// This else block is technically redundant due to axios's error handling
				console.error("Unexpected status code:", response.status);
				return null;
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Handling Axios errors specifically
				const response = error.response;
				if (response && response.status === 404) {
					console.error("User not found:", response.data.message);
					throw new Error(`User not found: ${response.data.message}`);
				} else {
					console.error("Failed to fetch auth token:", response?.data.message);
					throw new Error(
						`Failed to fetch auth token. Status: ${response?.status}. Message: ${response?.data.message}`
					);
				}
			} else {
				// Handling non-Axios errors
				throw error;
			}
		}
	}

	/**
	 * Initializes the client by determining the API endpoint and fetching the authentication token.
	 * @returns {Promise<boolean>} True if initialization was successful, false otherwise.
	 */
	public async initialize(): Promise<boolean> {
		try {
			console.log("Initializing client...");
			this._endpoint = await this.determineEndpoint();
			const authTokenResponse = await this.fetchAuthToken(this._endpoint);

			if (authTokenResponse === null) {
				console.error("Authentication token fetch returned false");
				return false; // Initialization failed
			}

			this._authToken = authTokenResponse;
			console.log(
				`Client initialized with endpoint: ${this._endpoint} and auth token: ${this._authToken}`
			);
			return true; // Initialization was successful
		} catch (error) {
			console.error("Error during initialization:", error);
			return false; // Initialization failed
		}
	}

	/**
	 * Fetches the devices associated with the user.
	 * @returns {Promise<any[]>} - A list of devices.
	 * @throws {Error} - If the client is not initialized or the fetch operation fails.
	 */
	public async getDevices(): Promise<Device[]> {
		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		const headers = {
			"X-AUTH-TOKEN": this.authToken,
			"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
		};

		const fetchUrl = `https://${this.endpoint}/v2/owner/${encodeURIComponent(
			this.username
		)}/device/`;
		console.log(`Fetching devices from: ${fetchUrl}`);

		try {
			const response = await axios.get(fetchUrl, { headers });
			console.log(`Received ${response.data.length} devices.`);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Handle HTTP errors (e.g., 401 Unauthorized)
				if (error.response?.status === 401) {
					throw new Error("Auth token invalid or expired");
				}
				console.error("Failed to fetch devices", error);
				throw new Error(`Error fetching devices: ${error.response?.status}`);
			} else {
				// Handle non-HTTP errors (e.g., network issues)
				console.error("An unexpected error occurred", error);
				throw new Error("An unexpected error occurred");
			}
		}
	}

	/**
	 * Fetches the attributes of a device using its UUID.
	 * @param uuid - The UUID of the device.
	 * @returns {Promise<any>} - The attributes of the device.
	 * @throws {Error} - If the client is not initialized or the fetch operation fails.
	 */
	public async getDeviceAttributes(uuid: string): Promise<any> {
		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		try {
			const headers = {
				"X-AUTH-TOKEN": this.authToken,
				"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
			};

			const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
				uuid
			)}/attributes/`;
			console.log(
				`Fetching attributes for device UUID ${uuid} from: ${fetchUrl}`
			);

			// Using axios.get to make the HTTP request
			const response = await axios.get(fetchUrl, { headers });

			// Direct access to data part of the response with axios
			const attributes = response.data;
			console.log(`Received attributes for device UUID ${uuid}.`);
			return attributes;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Handling Axios errors specifically
				if (error.response?.status === 401) {
					// If the HTTP status code is 401 Unauthorized
					throw new Error("Auth token invalid or expired");
				} else {
					// Other Axios errors
					throw new Error(`Error fetching attributes: ${error.message}`);
				}
			} else {
				// Handling non-Axios errors
				throw error;
			}
		}
	}

	/**
	 * Fetches the information of a device associated with the given UUID.
	 * @param uuid - The UUID of the device.
	 * @returns {Promise<any>} - Information of the device.
	 * @throws {Error} - If the client is not initialized or the fetch operation fails.
	 */
	public async getDeviceInfo(uuid: string): Promise<any> {
		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}
		if (!uuid) {
			throw new Error("Missing arguments");
		}
		const headers = {
			"X-AUTH-TOKEN": this.authToken,
			"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
		};

		const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
			uuid
		)}/info/`;
		console.log(`Fetching device info from: ${fetchUrl}`);

		try {
			// Use axios.get for the HTTP request
			const response = await axios.get(fetchUrl, { headers });

			// Validate if response is a valid JSON string
			let deviceInfo;
			try {
				deviceInfo = JSON.parse(response.data);
			} catch (jsonError) {
				console.error("Failed to parse JSON:", jsonError);
				console.error("Response text:", response.data);
				throw new Error("Invalid JSON response");
			}

			console.log(`Received device info for UUID ${uuid}.`);
			return deviceInfo;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Handling errors specifically returned by axios
				console.error("Failed to fetch device info", error);
				throw new Error(`Error fetching device info: ${error.message}`);
			} else {
				// Handling other types of errors that could occur
				throw error;
			}
		}
	}

	/**
	 * Sets the fan speed for the device.
	 * @param uuid - The device UUID.
	 * @param currentValue - The current value for fan speed (between 0 and 3).
	 * @param defaultValue - The default value for fan speed (between 0 and 3).
	 * @param userId? - Optional user ID.
	 * @returns {Promise<void>}
	 * @throws {Error} - If invalid fan speed values or the POST operation fails.
	 */
	public async setFanSpeed(
		uuid: string,
		currentValue: string,
		defaultValue: string,
		userId?: number
	): Promise<void> {
		if (!uuid || !currentValue || !defaultValue) {
			throw new Error("Missing arguments");
		}
		if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
			throw new Error("Fan speed value must be numeric.");
		}
		if (
			!["0", "1", "2", "3"].includes(currentValue) ||
			!["0", "1", "2", "3"].includes(defaultValue)
		) {
			throw new Error(
				"Invalid fan speed value. Acceptable values are 0, 1, 2, or 3."
			);
		}

		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		try {
			const body = {
				userId: userId,
				uuid: uuid,
				scope: "device",
				name: "fan_speed",
				currentValue: currentValue,
				defaultValue: defaultValue,
			};

			const headers = {
				"X-AUTH-TOKEN": this.authToken,
				"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				"Content-Type": "application/json",
			};

			const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
				uuid
			)}/attribute/fanspeed/`;

			// Using axios.post to send the request
			await axios.post(fetchUrl, body, { headers });

			console.log("Fan speed set successfully.");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// If the error is from axios, you can directly check its status code
				if (error.response?.status === 401) {
					throw new Error("Auth token invalid or expired");
				} else {
					throw new Error(`Error setting fan speed: ${error.message}`);
				}
			} else {
				// Handling non-axios errors
				throw error;
			}
		}
	}

	/**
	 * Sets the fan speed either for Auto or Manual for the device.
	 * @param uuid - The device UUID.
	 * @param currentValue - The current value for fan speed (between 0 and 3).
	 * @param defaultValue - The default value for fan speed (between 0 and 3).
	 * @param userId? - Optional user ID.
	 * @returns {Promise<void>}
	 * @throws {Error} - If invalid fan speed values or the POST operation fails.
	 */
	public async setFanAuto(
		uuid: string,
		currentValue: string,
		defaultValue: string,
		userId?: number
	): Promise<void> {
		if (!uuid || !currentValue || !defaultValue) {
			throw new Error("Missing arguments");
		}
		if (
			!["auto", "manual"].includes(currentValue) ||
			!["auto", "manual"].includes(defaultValue)
		) {
			throw new Error(
				"Invalid fan speed value. Acceptable values are manual or auto"
			);
		}

		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		try {
			const body = {
				userId: userId,
				uuid: uuid,
				scope: "device",
				name: "mode",
				currentValue: currentValue,
				defaultValue: defaultValue,
			};

			const headers = {
				"X-AUTH-TOKEN": this.authToken,
				"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				"Content-Type": "application/json",
			};

			const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
				uuid
			)}/attribute/fanspeed/`;

			// Using axios.post to send the request
			await axios.post(fetchUrl, body, { headers });

			console.log("Fan mode set successfully.");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// If the error is from axios, you can directly check its status code
				if (error.response?.status === 401) {
					throw new Error("Auth token invalid or expired");
				} else {
					throw new Error(`Error setting fan mode: ${error.message}`);
				}
			} else {
				// Handling non-axios errors
				throw error;
			}
		}
	}

	/**
	 * Sets the brightness for the device.
	 * @param uuid - The device UUID.
	 * @param currentValue - The current value for brightness (between 0 and 4).
	 * @param defaultValue - The default value for brightness (between 0 and 4).
	 * @param userId? - Optional user ID.
	 * @returns {Promise<void>}
	 * @throws {Error} - If invalid brightness values or the POST operation fails.
	 */
	public async setBrightness(
		uuid: string,
		currentValue: string,
		defaultValue: string,
		userId?: number
	): Promise<void> {
		// Validate inputs
		if (!uuid || !currentValue || !defaultValue) {
			throw new Error("Missing arguments");
		}
		if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
			throw new Error("Brightness value must be numeric.");
		}
		if (
			!["0", "1", "2", "3", "4"].includes(currentValue) ||
			!["0", "1", "2", "3", "4"].includes(defaultValue)
		) {
			throw new Error(
				"Invalid brightness value. Acceptable values are 0, 1, 2, 3 or 4."
			);
		}

		// Check client initialization
		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		try {
			// Prepare the request payload
			const body = {
				userId: userId,
				uuid: uuid,
				scope: "device",
				name: "brightness",
				currentValue: currentValue,
				defaultValue: defaultValue,
			};

			// Set request headers
			const headers = {
				"X-AUTH-TOKEN": this.authToken,
				"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				"Content-Type": "application/json",
			};

			// Construct the URL
			const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
				uuid
			)}/attribute/brightness/`;

			// Send a POST request using axios
			const response = await axios.post(fetchUrl, body, { headers });

			console.log("Brightness set successfully.");
			return response.data; // You might adjust this return based on the actual response structure
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Check for unauthorized status or other axios-specific errors
				if (error.response?.status === 401) {
					throw new Error("Auth token invalid or expired");
				}
				throw new Error(`Error setting brightness: ${error.message}`);
			} else {
				// Non-axios errors
				throw error;
			}
		}
	}

	/**
	 * Sets the child lock for the device.
	 * @param uuid - The device UUID.
	 * @param currentValue - The current value for child lock (either '0' for unlocked or '1' for locked).
	 * @param defaultValue - The default value for child lock (either '0' for unlocked or '1' for locked).
	 * @param userId? - Optional user ID.
	 * @returns {Promise<void>}
	 * @throws {Error} - If invalid child lock values or the POST operation fails.
	 */
	public async setChildLock(
		uuid: string,
		currentValue: string,
		defaultValue: string,
		userId?: number
	): Promise<void> {
		// Check for valid child lock values
		if (!uuid || !currentValue || !defaultValue) {
			throw new Error("Missing arguments");
		}
		if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
			throw new Error("Child lock values must be numeric.");
		}
		if (
			!["0", "1"].includes(currentValue) ||
			!["0", "1"].includes(defaultValue)
		) {
			throw new Error(
				"Invalid child lock value. Acceptable values are 0 (unlocked) or 1 (locked)."
			);
		}

		// Check if the client is properly initialized
		if (!this.endpoint || !this.authToken) {
			console.error("Client not initialized or missing endpoint/authToken");
			throw new Error("Client not initialized or missing endpoint/authToken");
		}

		try {
			// Prepare request body
			const body = {
				userId: userId,
				uuid: uuid,
				scope: "device",
				name: "child_lock",
				currentValue: currentValue,
				defaultValue: defaultValue,
			};

			// Prepare request headers
			const headers = {
				"X-AUTH-TOKEN": this.authToken,
				"X-API-KEY-TOKEN": this.API_KEY_TOKEN,
				"Content-Type": "application/json",
			};

			// Make the API request using axios
			const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(
				uuid
			)}/attribute/childlock/`;

			await axios.post(fetchUrl, body, { headers });

			console.log("Child lock set successfully.");
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Axios errors are thrown for responses outside the 2xx range
				if (error.response?.status === 401) {
					throw new Error("Auth token invalid or expired");
				} else {
					throw new Error(`Error setting child lock: ${error.message}`);
				}
			} else {
				// Non-Axios errors
				throw error;
			}
		}
	}
}
