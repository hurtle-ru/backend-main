import { Request } from 'express';
import getHeaderFirstValue from './get_header_first_value'


export default function getIp(req: Request): string | undefined {
    return getHeaderFirstValue("x-real-ip", req) || req.ip;
}
