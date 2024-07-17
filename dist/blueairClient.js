"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * ApiClient Class:
 * A client for handling requests to the BlueAir API.
 * It manages authentication, determines the right endpoint, and provides methods to fetch device data.
 */
class ApiClient {
    /**
     * Constructor to set up the client with necessary credentials.
     * @param username - The user's email or username.
     * @param password - The user's password.
     */
    constructor(username, password) {
        // Constant API key token, required for authenticating with the API.
        this.API_KEY_TOKEN = process.env.API_KEY_TOKEN || "";
        // Endpoint to determine the home host. You will need to replace this with your actual endpoint.
        this.HOMEHOST_ENDPOINT = "https://api.blueair.io/v2/";
        // The API endpoint determined after initialization.
        this._endpoint = null;
        // Authentication token fetched during initialization.
        this._authToken = null;
        this.username = username;
        this.password = password;
        this.base64Credentials = btoa(`${this.username}:${this.password}`);
    }
    // Getter for the endpoint property.
    get endpoint() {
        return this._endpoint;
    }
    // Getter for the authToken property.
    get authToken() {
        return this._authToken;
    }
    /**
     * Determines the appropriate endpoint (home host) for the API.
     * @returns {Promise<string>} - The determined API endpoint.
     * @throws {Error} - If the fetch operation fails.
     */
    determineEndpoint() {
        return __awaiter(this, void 0, void 0, function* () {
            // Construct the URL for determining the home host
            const url = `${this.HOMEHOST_ENDPOINT}user/${encodeURIComponent(this.username)}/homehost/`;
            console.log(`Determining endpoint with URL: ${url}`);
            console.log(`Basic ${this.base64Credentials}`);
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Make the GET request to fetch the endpoint
                    const response = yield axios_1.default.get(url, {
                        headers: {
                            Authorization: `Basic ${this.base64Credentials}`,
                            "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
                        },
                    });
                    console.log(`Determined endpoint: ${response.data}`);
                    return response.data;
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios-specific errors
                        console.error("Failed to determine endpoint", error);
                        throw new Error(`Failed to determine endpoint. Message: ${error.message}`);
                    }
                    else {
                        // Handle non-Axios errors
                        console.error("An unexpected error occurred", error);
                        throw new Error("An unexpected error occurred");
                    }
                }
            }));
        });
    }
    /**
     * Fetches the authentication token using the given endpoint.
     * @param endpoint - The determined API endpoint.
     * @returns {Promise<string|null>} - The fetched authentication token or null.
     * @throws {Error} - If the fetch operation fails.
     */
    fetchAuthToken(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!endpoint) {
                throw new Error("Endpoint is null. Cannot fetch auth token.");
            }
            // Construct the URL for fetching the auth token
            const url = `https://${endpoint}/v2/user/${encodeURIComponent(this.username)}/login/`;
            console.log(`Determining login endpoint with URL: ${url}`);
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Make the GET request to fetch the auth token
                    const response = yield axios_1.default.get(url, {
                        headers: {
                            Authorization: `Basic ${this.base64Credentials}`,
                            "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
                        },
                    });
                    // Directly access data from axios response
                    const data = response.data;
                    if (response.status === 200) {
                        if (data === false) {
                            console.error("User is locked out");
                            throw new Error("User is locked out");
                        }
                        // Access the auth token from response headers
                        const authToken = response.headers["x-auth-token"];
                        console.log(`Received auth token: ${authToken}`);
                        return authToken;
                    }
                    else {
                        console.error("Unexpected status code:", response.status);
                        return null;
                    }
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios-specific errors
                        const response = error.response;
                        if (response && response.status === 404) {
                            console.error("User not found:", response.data.message);
                            throw new Error(`User not found: ${response.data.message}`);
                        }
                        else {
                            console.error("Failed to fetch auth token:", response === null || response === void 0 ? void 0 : response.data.message);
                            throw new Error(`Failed to fetch auth token. Status: ${response === null || response === void 0 ? void 0 : response.status}. Message: ${response === null || response === void 0 ? void 0 : response.data.message}`);
                        }
                    }
                    else {
                        // Handle non-Axios errors
                        throw error;
                    }
                }
            }));
        });
    }
    /**
     * Initializes the client by determining the API endpoint and fetching the authentication token.
     * @returns {Promise<boolean>} True if initialization was successful, false otherwise.
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Initializing client...");
                // Determine the API endpoint
                this._endpoint = yield this.determineEndpoint();
                // Fetch the authentication token
                const authTokenResponse = yield this.fetchAuthToken(this._endpoint);
                if (authTokenResponse === null) {
                    console.error("Authentication token fetch returned false");
                    return false; // Initialization failed
                }
                this._authToken = authTokenResponse;
                console.log(`Client initialized with endpoint: ${this._endpoint} and auth token: ${this._authToken}`);
                return true; // Initialization was successful
            }
            catch (error) {
                console.error("Error during initialization:", error);
                return false; // Initialization failed
            }
        });
    }
    /**
     * Fetches the devices associated with the user.
     * @returns {Promise<Device[]>} - A list of devices.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            // Define headers for the request, including authentication tokens
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
            };
            // Construct the URL for fetching devices
            const fetchUrl = `https://${this.endpoint}/v2/owner/${encodeURIComponent(this.username)}/device/`;
            console.log(`Fetching devices from: ${fetchUrl}`);
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    // Make the GET request to fetch devices
                    const response = yield axios_1.default.get(fetchUrl, { headers });
                    console.log(`Received ${response.data.length} devices.`);
                    return response.data;
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle HTTP errors (e.g., 401 Unauthorized)
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        console.error("Failed to fetch devices", error);
                        throw new Error(`Error fetching devices: ${(_b = error.response) === null || _b === void 0 ? void 0 : _b.status}`);
                    }
                    else {
                        // Handle non-HTTP errors (e.g., network issues)
                        console.error("An unexpected error occurred", error);
                        throw new Error("An unexpected error occurred");
                    }
                }
            }));
        });
    }
    /**
     * Fetches the attributes of a device using its UUID.
     * @param uuid - The UUID of the device.
     * @returns {Promise<any>} - The attributes of the device.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDeviceAttributes(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            // Define headers for the request, including authentication tokens
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
            };
            // Construct the URL for fetching device attributes
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attributes/`;
            console.log(`Fetching attributes for device UUID ${uuid} from: ${fetchUrl}`);
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Make the GET request to fetch device attributes
                    const response = yield axios_1.default.get(fetchUrl, { headers });
                    // Access the data part of the response
                    const attributes = response.data;
                    console.log(`Received attributes for device UUID ${uuid}.`);
                    return attributes;
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios errors specifically
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        else {
                            throw new Error(`Error fetching attributes: ${error.message}`);
                        }
                    }
                    else {
                        throw error;
                    }
                }
            }));
        });
    }
    /**
     * Fetches the information of a device associated with the given UUID.
     * This method ensures that the client is initialized and retries the request in case of transient failures.
     *
     * @param uuid - The UUID of the device.
     * @returns A Promise that resolves with the device information.
     * @throws {Error} - If the client is not initialized, the UUID is missing, or the fetch operation fails.
     */
    getDeviceInfo(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            if (!uuid) {
                throw new Error("Missing arguments");
            }
            // Define headers for the request, including authentication tokens
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
            };
            // Construct the URL for fetching device information using the provided UUID
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/info/`;
            // Use the retry function to attempt the request, retrying on failure
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Make the HTTP GET request to fetch device information
                    const response = yield axios_1.default.get(fetchUrl, { headers });
                    // Initialize a variable to hold the device information
                    let deviceInfo;
                    // Check if the response data is already an object
                    if (typeof response.data === "object") {
                        deviceInfo = response.data;
                    }
                    else {
                        // Attempt to parse the response data as JSON if it's not an object
                        try {
                            deviceInfo = JSON.parse(response.data);
                        }
                        catch (jsonError) {
                            // Throw an error if JSON parsing fails
                            throw new Error("Invalid JSON response");
                        }
                    }
                    // Return the parsed or directly received device information
                    return deviceInfo;
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios-specific errors
                        console.error("Failed to fetch device info", error);
                        throw new Error(`Error fetching device info: ${error.message}`);
                    }
                    else {
                        // Handle non-Axios errors
                        console.error("Unexpected error", error);
                        throw error;
                    }
                }
            }));
        });
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
    setFanSpeed(uuid, currentValue, defaultValue, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error("Missing arguments");
            }
            if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
                throw new Error("Fan speed value must be numeric.");
            }
            if (!["0", "1", "2", "3"].includes(currentValue) ||
                !["0", "1", "2", "3"].includes(defaultValue)) {
                throw new Error("Invalid fan speed value. Acceptable values are 0, 1, 2, or 3.");
            }
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            // Prepare the request payload
            const body = {
                userId: userId,
                uuid: uuid,
                scope: "device",
                name: "fan_speed",
                currentValue: currentValue,
                defaultValue: defaultValue,
            };
            // Set request headers
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
                "Content-Type": "application/json",
            };
            // Construct the URL for setting fan speed
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/fanspeed/`;
            // Use the retry function to attempt the request, retrying on failure
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Send a POST request using axios
                    yield axios_1.default.post(fetchUrl, body, { headers });
                    console.log("Fan speed set successfully.");
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios errors specifically
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        else {
                            throw new Error(`Error setting fan speed: ${error.message}`);
                        }
                    }
                    else {
                        throw error;
                    }
                }
            }));
        });
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
    setFanAuto(uuid, currentValue, defaultValue, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error("Missing arguments");
            }
            if (!["auto", "manual"].includes(currentValue) ||
                !["auto", "manual"].includes(defaultValue)) {
                throw new Error("Invalid fan speed value. Acceptable values are manual or auto");
            }
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            // Prepare the request payload
            const body = {
                userId: userId,
                uuid: uuid,
                scope: "device",
                name: "mode",
                currentValue: currentValue,
                defaultValue: defaultValue,
            };
            // Set request headers
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
                "Content-Type": "application/json",
            };
            // Construct the URL for setting fan mode
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/fanspeed/`;
            // Use the retry function to attempt the request, retrying on failure
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Send a POST request using axios
                    yield axios_1.default.post(fetchUrl, body, { headers });
                    console.log("Fan mode set successfully.");
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        // Handle Axios errors specifically
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        else {
                            throw new Error(`Error setting fan mode: ${error.message}`);
                        }
                    }
                    else {
                        throw error;
                    }
                }
            }));
        });
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
    setBrightness(uuid, currentValue, defaultValue, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error("Missing arguments");
            }
            if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
                throw new Error("Brightness value must be numeric.");
            }
            if (!["0", "1", "2", "3", "4"].includes(currentValue) ||
                !["0", "1", "2", "3", "4"].includes(defaultValue)) {
                throw new Error("Invalid brightness value. Acceptable values are 0, 1, 2, 3 or 4.");
            }
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
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
            // Construct the URL for setting brightness
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/brightness/`;
            // Use the retry function to attempt the request, retrying on failure
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Send a POST request using axios
                    const response = yield axios_1.default.post(fetchUrl, body, { headers });
                    console.log("Brightness set successfully.");
                    return response.data; // You might adjust this return based on the actual response structure
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        throw new Error(`Error setting brightness: ${error.message}`);
                    }
                    else {
                        throw error;
                    }
                }
            }));
        });
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
    setChildLock(uuid, currentValue, defaultValue, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error("Missing arguments");
            }
            if (isNaN(Number(currentValue)) || isNaN(Number(defaultValue))) {
                throw new Error("Child lock values must be numeric.");
            }
            if (!["0", "1"].includes(currentValue) ||
                !["0", "1"].includes(defaultValue)) {
                throw new Error("Invalid child lock value. Acceptable values are 0 (unlocked) or 1 (locked).");
            }
            if (!this.endpoint || !this.authToken) {
                throw new Error("Client not initialized or missing endpoint/authToken");
            }
            // Prepare the request payload
            const body = {
                userId: userId,
                uuid: uuid,
                scope: "device",
                name: "child_lock",
                currentValue: currentValue,
                defaultValue: defaultValue,
            };
            // Set request headers
            const headers = {
                "X-AUTH-TOKEN": this.authToken,
                "X-API-KEY-TOKEN": this.API_KEY_TOKEN,
                "Content-Type": "application/json",
            };
            // Construct the URL for setting child lock
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/childlock/`;
            // Use the retry function to attempt the request, retrying on failure
            return this.retry(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                try {
                    // Send a POST request using axios
                    yield axios_1.default.post(fetchUrl, body, { headers });
                    console.log("Child lock set successfully.");
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                            throw new Error("Auth token invalid or expired");
                        }
                        else {
                            throw new Error(`Error setting child lock: ${error.message}`);
                        }
                    }
                    else {
                        throw error;
                    }
                }
            }));
        });
    }
    /**
     * Retries an asynchronous operation a specified number of times with a delay between each attempt.
     *
     * @template T - The type of the result that the function fn returns.
     * @param fn - A function that returns a Promise. This is the operation that will be retried upon failure.
     * @param retries - The number of times to retry the operation. Default is 3.
     * @param delay - The delay in milliseconds between each retry attempt. Default is 1000ms (1 second).
     * @returns A Promise that resolves with the result of the function fn if it eventually succeeds,
     * or rejects with an error if all retry attempts fail.
     */
    retry(fn_1) {
        return __awaiter(this, arguments, void 0, function* (fn, retries = 3, delay = 1000) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    // Attempt to execute the provided function
                    return yield fn();
                }
                catch (error) {
                    // If an error occurs and we haven't exhausted our retries, wait for the specified delay
                    if (attempt < retries) {
                        yield new Promise((res) => setTimeout(res, delay));
                    }
                    else {
                        // If this was the last attempt, rethrow the error
                        throw error;
                    }
                }
            }
            throw new Error("Failed after multiple retries");
        });
    }
}
exports.ApiClient = ApiClient;
