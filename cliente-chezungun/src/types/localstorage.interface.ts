export const StorageKeys = {
	USER: "user",
	SESSION: "session",
	PROFILE: "profile",
    CODE: "code",   
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export interface StorageInterface {
	/**
	 * Retrieves an item from storage.
	 *
	 * @param key - The key of the item to retrieve.
	 * @param type - The expected type of the item ("string", "number", or "boolean").
	 * @returns The value of the item, or `null` if the item is not found.
	 * @throws {Error} An error if the type is not "string", "number", or "boolean".
	 */
	getItem(
		key: StorageKey,
		type: "string" | "number" | "boolean" | "object",
	):
		| (string | undefined)
		| (number | undefined)
		| (boolean | undefined)
        | Record<string, any>
        | any[]
		| undefined;

	/**
	 * Stores an item in storage.
	 *
	 * @param key - The key to associate with the stored value.
	 * @param value - The value to store.
	 * @returns Nothing.
	 */
	setItem(key: StorageKey, value: any): void;

	/**
	 * Removes an item from storage.
	 *
	 * @param key - The key of the item to remove.
	 * @returns Nothing.
	 */
	removeItem(key: StorageKey): void;

	/**
	 * Removes an item from storage.
	 *
	 * @returns Nothing.
	 */
	clear(): void;
}