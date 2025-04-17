import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prismaService: PrismaService) {}

  async createAuditLog(createAuditLogDto: CreateAuditLogDto) {
    const { table_name, record_id, action, modified_by_id, details } =
      createAuditLogDto;

    const auditLog = await this.prismaService.auditLog.create({
      data: {
        table_name,
        record_id,
        action,
        modified_by_id,
        details: details || {},
      },
    });

    return auditLog;
  }

  findAll() {
    return `This action returns all auditLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLog`;
  }
}
