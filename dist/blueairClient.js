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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
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
        this.API_KEY_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJncmFudGVlIjoiYmx1ZWFpciIsImlhdCI6MTQ1MzEyNTYzMiwidmFsaWRpdHkiOi0xLCJqdGkiOiJkNmY3OGE0Yi1iMWNkLTRkZDgtOTA2Yi1kN2JkNzM0MTQ2NzQiLCJwZXJtaXNzaW9ucyI6WyJhbGwiXSwicXVvdGEiOi0xLCJyYXRlTGltaXQiOi0xfQ.CJsfWVzFKKDDA6rWdh-hjVVVE9S3d6Hu9BzXG9htWFw';
        // Endpoint to determine the home host. You will need to replace this with your actual endpoint.
        this.HOMEHOST_ENDPOINT = 'https://api.blueair.io/v2/';
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
            // Construct the URL with the username
            const url = `${this.HOMEHOST_ENDPOINT}user/${encodeURIComponent(this.username)}/homehost/`;
            console.log(`Determining endpoint with URL: ${url}`);
            console.log(`Basic ${this.base64Credentials}`);
            const response = yield fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${this.base64Credentials}`,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                },
            });
            if (!response.ok) {
                const errorText = yield response.text();
                console.error('Failed to determine endpoint', response, errorText);
                throw new Error(`Failed to determine endpoint. Status: ${response.status}. Message: ${errorText}`);
            }
            const data = yield response.json();
            console.log(`Determined endpoint: ${data}`);
            return data;
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
                throw new Error('Endpoint is null. Cannot fetch auth token.');
            }
            const url = `https://${endpoint}/v2/user/${encodeURIComponent(this.username)}/login/`;
            console.log(`Determining login endpoint with URL: ${url}`);
            const response = yield fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${this.base64Credentials}`,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                },
            });
            const data = yield response.json();
            if (response.ok && data === true) {
                const authToken = response.headers.get('x-auth-token');
                console.log(`Received auth token: ${authToken}`);
                return authToken;
            }
            else {
                console.error('Failed to fetch auth token:', data.message);
                throw new Error(`Failed to fetch auth token. Status: ${response.status}. Message: ${data.message}`);
            }
        });
    }
    /**
     * Initializes the client by determining the API endpoint and fetching the authentication token.
     * @returns {Promise<void>}
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Initializing client...');
            this._endpoint = yield this.determineEndpoint();
            this._authToken = yield this.fetchAuthToken(this.endpoint);
            console.log(`Client initialized with endpoint: ${this._endpoint} and auth token: ${this._authToken}`);
        });
    }
    /**
     * Fetches the devices associated with the user.
     * @returns {Promise<any[]>} - A list of devices.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.endpoint || !this.authToken) {
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            const headers = {
                'X-AUTH-TOKEN': this.authToken,
                'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
            };
            const fetchUrl = `https://${this.endpoint}/v2/owner/${encodeURIComponent(this.username)}/device/`;
            console.log(`Fetching devices from: ${fetchUrl}`);
            const response = yield fetch(fetchUrl, {
                method: 'GET',
                headers,
            });
            if (!response.ok) {
                if (response.status == 401) {
                    // Assuming 401 is the HTTP status code for unauthorized
                    throw new Error('Auth token invalid or expired');
                }
                console.error('Failed to fetch devices', response);
                throw new Error(`Error fetching devices with status: ${response.status}`);
            }
            const devices = yield response.json();
            console.log(`Received ${devices.length} devices.`);
            return devices;
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
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            function isError(err) {
                return err instanceof Error;
            }
            try {
                const headers = {
                    'X-AUTH-TOKEN': this.authToken,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                };
                const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attributes/`;
                console.log(`Fetching attributes for device UUID ${uuid} from: ${fetchUrl}`);
                const response = yield fetch(fetchUrl, {
                    method: 'GET',
                    headers,
                });
                if (!response.ok) {
                    console.error('Failed to fetch device attributes', response);
                    throw new Error('Error fetching device attributes');
                }
                const attributes = yield response.json();
                console.log(`Received attributes for device UUID ${uuid}.`);
                return attributes;
            }
            catch (error) {
                if (isError(error) && error.message.includes('401')) {
                    // Assuming 401 is the HTTP status code for unauthorized
                    throw new Error('Auth token invalid or expired');
                }
                throw new Error('Error fetching attributes');
            }
        });
    }
    /**
     * Fetches the information of a device associated with the given UUID.
     * @param uuid - The UUID of the device.
     * @returns {Promise<any>} - Information of the device.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDeviceInfo(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.endpoint || !this.authToken) {
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            if (!uuid) {
                throw new Error('Missing arguments');
            }
            const headers = {
                'X-AUTH-TOKEN': this.authToken,
                'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
            };
            const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/info/`;
            console.log(`Fetching device info from: ${fetchUrl}`);
            const response = yield fetch(fetchUrl, {
                method: 'GET',
                headers,
            });
            if (!response.ok) {
                console.error('Failed to fetch device info', response);
                throw new Error('Error fetching device info');
            }
            const deviceInfo = yield response.json();
            return deviceInfo;
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
                throw new Error('Missing arguments');
            }
            if (isNaN(Number(currentValue || defaultValue))) {
                throw new Error('Fan speed value must be numeric.');
            }
            if (!['0', '1', '2', '3'].includes(currentValue) ||
                !['0', '1', '2', '3'].includes(defaultValue)) {
                throw new Error('Invalid fan speed value. Acceptable values are 0, 1, 2, or 3.');
            }
            if (!this.endpoint || !this.authToken) {
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            function isError(err) {
                return err instanceof Error;
            }
            try {
                const body = {
                    userId: userId,
                    uuid: uuid,
                    scope: 'device',
                    name: 'fan_speed',
                    currentValue: currentValue,
                    defaultValue: defaultValue,
                };
                const headers = {
                    'X-AUTH-TOKEN': this.authToken,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                    'Content-Type': 'application/json',
                };
                const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/fanspeed/`;
                const response = yield fetch(fetchUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    console.error('Failed to set fan speed', response);
                    throw new Error('Error setting fan speed');
                }
                const responseData = yield response.json();
                return responseData;
            }
            catch (error) {
                if (isError(error) && error.message.includes('401')) {
                    // Assuming 401 is the HTTP status code for unauthorized
                    throw new Error('Auth token invalid or expired');
                }
                throw new Error('Error fetching attributes');
            }
        });
    }
    /**
     * Sets the brightness for the device.
     * @param uuid - The device UUID.
     * @param currentValue - The current value for brightness (between 0 and 3).
     * @param defaultValue - The default value for brightness (between 0 and 3).
     * @param userId? - Optional user ID.
     * @returns {Promise<void>}
     * @throws {Error} - If invalid brightness values or the POST operation fails.
     */
    setBrightness(uuid, currentValue, defaultValue, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check for valid brightness values
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error('Missing arguments');
            }
            if (isNaN(Number(currentValue || defaultValue))) {
                throw new Error('Brightness value must be numeric.');
            }
            if (!['0', '1', '2', '3'].includes(currentValue) ||
                !['0', '1', '2', '3'].includes(defaultValue)) {
                throw new Error('Invalid brightness value. Acceptable values are 0, 1, 2, or 3.');
            }
            // Check if the client is properly initialized
            if (!this.endpoint || !this.authToken) {
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            function isError(err) {
                return err instanceof Error;
            }
            try {
                // Prepare request body
                const body = {
                    userId: userId,
                    uuid: uuid,
                    scope: 'device',
                    name: 'brightness',
                    currentValue: currentValue,
                    defaultValue: defaultValue,
                };
                // Prepare request headers
                const headers = {
                    'X-AUTH-TOKEN': this.authToken,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                    'Content-Type': 'application/json',
                };
                // Make the API request
                const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/brightness/`;
                const response = yield fetch(fetchUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });
                // Check the response status
                if (!response.ok) {
                    console.error('Failed to set brightness', response);
                    throw new Error('Error setting brightness');
                }
                const responseData = yield response.json();
                return responseData;
            }
            catch (error) {
                if (isError(error) && error.message.includes('401')) {
                    // Assuming 401 is the HTTP status code for unauthorized
                    throw new Error('Auth token invalid or expired');
                }
                throw new Error('Error fetching attributes');
            }
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
            // Check for valid child lock values
            if (!uuid || !currentValue || !defaultValue) {
                throw new Error('Missing arguments');
            }
            if (isNaN(Number(currentValue || defaultValue))) {
                throw new Error('Child lock values must be numeric.');
            }
            if (!['0', '1'].includes(currentValue) ||
                !['0', '1'].includes(defaultValue)) {
                throw new Error('Invalid child lock value. Acceptable values are 0 (unlocked) or 1 (locked).');
            }
            // Check if the client is properly initialized
            if (!this.endpoint || !this.authToken) {
                console.error('Client not initialized or missing endpoint/authToken');
                throw new Error('Client not initialized or missing endpoint/authToken');
            }
            function isError(err) {
                return err instanceof Error;
            }
            try {
                // Prepare request body
                const body = {
                    userId: userId,
                    uuid: uuid,
                    scope: 'device',
                    name: 'child_lock',
                    currentValue: currentValue,
                    defaultValue: defaultValue,
                };
                // Prepare request headers
                const headers = {
                    'X-AUTH-TOKEN': this.authToken,
                    'X-API-KEY-TOKEN': this.API_KEY_TOKEN,
                    'Content-Type': 'application/json',
                };
                // Make the API request
                const fetchUrl = `https://${this.endpoint}/v2/device/${encodeURIComponent(uuid)}/attribute/childlock/`;
                const response = yield fetch(fetchUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });
                // Check the response status
                if (!response.ok) {
                    console.error('Failed to set child lock', response);
                    throw new Error('Error setting child lock');
                }
                const responseData = yield response.json();
                return responseData;
            }
            catch (error) {
                if (isError(error) && error.message.includes('401')) {
                    // Assuming 401 is the HTTP status code for unauthorized
                    throw new Error('Auth token invalid or expired');
                }
                throw new Error('Error fetching attributes');
            }
        });
    }
}
exports.ApiClient = ApiClient;
