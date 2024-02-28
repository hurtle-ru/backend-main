import { Request } from "express";


export default function getHeaderFirstValue(header: string, req: Request): string | undefined {
    let value = req.headers[header];
    return Array.isArray(value) ? value[0] : value;
}
