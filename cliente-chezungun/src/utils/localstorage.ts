import type { StorageInterface, StorageKey } from "../types/localstorage.interface";

let getItemAsync = async (key: string): Promise<string | null> => null;

const parseStoredValue = (
    value: string | null,
    type: "string" | "number" | "boolean" | "object",
): any => {
    //console.log("parseStoredValue called with value:", value, "and type:", type);
    if (value === null) return undefined;

    try {
        const parsed = JSON.parse(value);
        //console.log("Parsed value:", parsed, "of type:", typeof parsed);

        switch (type) {
            case "string":
                return typeof parsed === "string" ? parsed : undefined;
            case "number":
                return typeof parsed === "number" ? parsed : undefined;
            case "boolean":
                return typeof parsed === "boolean" ? parsed : undefined;
            case "object":
                return typeof parsed === "object" && parsed !== null ? parsed : undefined;
            default:
                return undefined;
        }
    } catch (error) {
        console.error("Error parsing JSON from storage:", error);
        return undefined;
    }
};

const createMemoryStorage = (): StorageInterface => {
    const memoryStorage: Record<string, string> = {};

    getItemAsync = async (key: string): Promise<string | null> => {
        return memoryStorage[key] || null;
    };

    return {
        getItem(key: StorageKey, type: "string" | "number" | "boolean" | "object") {
            return parseStoredValue(memoryStorage[key] || null, type);
        },
        setItem(key: StorageKey, value: any) {
            memoryStorage[key] = JSON.stringify(value);
            return;
        },
        removeItem(key: StorageKey) {
            delete memoryStorage[key];
            return;
        },
        clear() {
            Object.keys(memoryStorage).forEach((key) => {
                delete memoryStorage[key];
            });
            return;
        },
    };
};

const getDeviceStorage = (): StorageInterface => {
    if (typeof localStorage !== "undefined") {
        try {
            localStorage.setItem("__test__", "test");
            localStorage.removeItem("__test__");
        } catch (e) {
            console.warn("LocalStorage is disabled or full, using memory storage");
            return createMemoryStorage();
        }

        getItemAsync = async (key: string): Promise<string | null> => {
            return localStorage.getItem(key);
        };

        return {
            getItem(key: StorageKey, type: "string" | "number" | "boolean" | "object") {
                return parseStoredValue(localStorage.getItem(key) || null, type);
            },
            setItem(key: StorageKey, value: any) {
                return localStorage.setItem(key, JSON.stringify(value));
            },
            removeItem(key: StorageKey) {
                return localStorage.removeItem(key);
            },
            clear() {
                return localStorage.clear();
            },
        };
    } else {
        console.warn("LocalStorage not found, using memorystorage");
        return createMemoryStorage();
    }
};

type TPromisify<T> = {
	[K in keyof T]: T[K] extends (...args: infer A) => infer R
		? (...args: A) => Promise<R>
		: T[K];
};

function Promisify<T extends object>(obj: T): TPromisify<T> {
	const result = {} as TPromisify<T>;

	for (const key of Object.keys(obj) as (keyof T)[]) {
		const value = obj[key];
		if (typeof value === "function") {
			result[key] = ((...args: any[]) =>
				new Promise((resolve) =>
					resolve((value as any)(...args)),
				)) as TPromisify<T>[typeof key];
		} else {
			result[key] = value as any;
		}
	}

	return result;
}

const DeviceStorage: StorageInterface = getDeviceStorage();

const AsyncDeviceStorage = Promisify(DeviceStorage as Storage);

export const supabaseDeviceStorage = {
	getItem: getItemAsync,
	setItem: AsyncDeviceStorage.setItem,
	removeItem: AsyncDeviceStorage.removeItem,
	clear: AsyncDeviceStorage.clear,
};

export default DeviceStorage;