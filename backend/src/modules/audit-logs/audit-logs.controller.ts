import { Request, Response, NextFunction } from 'express';
import { auditLogsService, AuditLogsService } from './audit-logs.service.js';
import { sendPaginated } from '../../utils/response.js';

export class AuditLogsController {
  constructor(private readonly service: AuditLogsService = auditLogsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const { data, total } = await this.service.getAuditLogs(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };
}

export const auditLogsController = new AuditLogsController();
