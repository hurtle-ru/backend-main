import camelCase from "camelcase";

export default function camelize(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(camelize);
    } else if (obj !== null && typeof obj === "object") {
        return Object.keys(obj).reduce((acc, key) => {
            acc[camelCase(key)] = camelize(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
}
