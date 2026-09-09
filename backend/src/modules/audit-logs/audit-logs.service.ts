import { AuditLogsRepository, auditLogsRepository } from './audit-logs.repository.js';
import { AuditLogsQueryDto } from './audit-logs.schema.js';
import { AuditLogEntry } from './audit-logs.types.js';

export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository = auditLogsRepository) {}

  async getAuditLogs(query: AuditLogsQueryDto): Promise<{ data: AuditLogEntry[]; total: number }> {
    return this.repo.findAll(query);
  }
}

export const auditLogsService = new AuditLogsService();
