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
export declare class ApiClient {
    private readonly API_KEY_TOKEN;
    private readonly HOMEHOST_ENDPOINT;
    private username;
    private password;
    private base64Credentials;
    private _endpoint;
    private _authToken;
    /**
     * Constructor to set up the client with necessary credentials.
     * @param username - The user's email or username.
     * @param password - The user's password.
     */
    constructor(username: string, password: string);
    get endpoint(): string | null;
    get authToken(): string | null;
    /**
     * Determines the appropriate endpoint (home host) for the API.
     * @returns {Promise<string>} - The determined API endpoint.
     * @throws {Error} - If the fetch operation fails.
     */
    private determineEndpoint;
    /**
     * Fetches the authentication token using the given endpoint.
     * @param endpoint - The determined API endpoint.
     * @returns {Promise<string|null>} - The fetched authentication token or null.
     * @throws {Error} - If the fetch operation fails.
     */
    private fetchAuthToken;
    /**
     * Initializes the client by determining the API endpoint and fetching the authentication token.
     * @returns {Promise<boolean>} True if initialization was successful, false otherwise.
     */
    initialize(): Promise<boolean>;
    /**
     * Fetches the devices associated with the user.
     * @returns {Promise<Device[]>} - A list of devices.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDevices(): Promise<Device[]>;
    /**
     * Fetches the attributes of a device using its UUID.
     * @param uuid - The UUID of the device.
     * @returns {Promise<any>} - The attributes of the device.
     * @throws {Error} - If the client is not initialized or the fetch operation fails.
     */
    getDeviceAttributes(uuid: string): Promise<any>;
    /**
     * Fetches the information of a device associated with the given UUID.
     * @param uuid - The UUID of the device.
     * @returns A Promise that resolves with the device information.
     * @throws {Error} - If the client is not initialized, the UUID is missing, or the fetch operation fails.
     */
    getDeviceInfo(uuid: string): Promise<any>;
    /**
     * Sets the fan speed for the device.
     * @param uuid - The device UUID.
     * @param currentValue - The current value for fan speed (between 0 and 3).
     * @param defaultValue - The default value for fan speed (between 0 and 3).
     * @param userId? - Optional user ID.
     * @returns {Promise<void>}
     * @throws {Error} - If invalid fan speed values or the POST operation fails.
     */
    setFanSpeed(uuid: string, currentValue: string, defaultValue: string, userId?: number): Promise<void>;
    /**
     * Sets the fan speed either for Auto or Manual for the device.
     * @param uuid - The device UUID.
     * @param currentValue - The current value for fan speed (between 0 and 3).
     * @param defaultValue - The default value for fan speed (between 0 and 3).
     * @param userId? - Optional user ID.
     * @returns {Promise<void>}
     * @throws {Error} - If invalid fan speed values or the POST operation fails.
     */
    setFanAuto(uuid: string, currentValue: string, defaultValue: string, userId?: number): Promise<void>;
    /**
     * Sets the brightness for the device.
     * @param uuid - The device UUID.
     * @param currentValue - The current value for brightness (between 0 and 4).
     * @param defaultValue - The default value for brightness (between 0 and 4).
     * @param userId? - Optional user ID.
     * @returns {Promise<void>}
     * @throws {Error} - If invalid brightness values or the POST operation fails.
     */
    setBrightness(uuid: string, currentValue: string, defaultValue: string, userId?: number): Promise<void>;
    /**
     * Sets the child lock for the device.
     * @param uuid - The device UUID.
     * @param currentValue - The current value for child lock (either '0' for unlocked or '1' for locked).
     * @param defaultValue - The default value for child lock (either '0' for unlocked or '1' for locked).
     * @param userId? - Optional user ID.
     * @returns {Promise<void>}
     * @throws {Error} - If invalid child lock values or the POST operation fails.
     */
    setChildLock(uuid: string, currentValue: string, defaultValue: string, userId?: number): Promise<void>;
    /**
     * Retries an asynchronous operation a specified number of times with a delay between each attempt.
     * @param fn - A function that returns a Promise. This is the operation that will be retried upon failure.
     * @param retries - The number of times to retry the operation. Default is 3.
     * @param delay - The delay in milliseconds between each retry attempt. Default is 1000ms (1 second).
     * @returns A Promise that resolves with the result of the function fn if it eventually succeeds,
     * or rejects with an error if all retry attempts fail.
     */
    private retry;
}
export {};
