import { positionsRepository, PositionsRepository } from './positions.repository.js';
import { JobPosition, CreatePositionDto, UpdatePositionDto, PositionQueryDto } from './positions.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class PositionsService {
  constructor(private readonly repo: PositionsRepository = positionsRepository) {}

  async getPositions(query: PositionQueryDto): Promise<JobPosition[]> {
    return this.repo.findAll(query);
  }

  async getPositionById(id: string): Promise<JobPosition> {
    const position = await this.repo.findById(id);
    if (!position) {
      throw new NotFoundError(`Job position with ID '${id}' not found`);
    }
    return position;
  }

  async createPosition(dto: CreatePositionDto): Promise<JobPosition> {
    return this.repo.create(dto);
  }

  async updatePosition(id: string, dto: UpdatePositionDto): Promise<JobPosition> {
    const position = await this.repo.update(id, dto);
    if (!position) {
      throw new NotFoundError(`Job position with ID '${id}' not found to update`);
    }
    return position;
  }

  async deletePosition(id: string): Promise<boolean> {
    await this.getPositionById(id);
    return this.repo.delete(id);
  }
}

export const positionsService = new PositionsService();
