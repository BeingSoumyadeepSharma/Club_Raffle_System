import { v4 as uuidv4 } from 'uuid';
import { ClubEntity, CreateClubEntityDTO, UpdateClubEntityDTO } from '@raffle/shared';
import { entityRepository } from '../data/repositories';

export class EntityService {
  getAllEntities(): ClubEntity[] {
    return entityRepository.findAll();
  }

  getEntityById(id: string): ClubEntity | undefined {
    return entityRepository.findById(id);
  }

  createEntity(dto: CreateClubEntityDTO): ClubEntity {
    const entity: ClubEntity = {
      id: uuidv4(),
      name: dto.name,
      displayName: dto.displayName,
      emoji: dto.emoji || '🎲',
      tagline: dto.tagline || 'Thanks for your Purchase.. and good luck~',
      rafflePercentage: dto.rafflePercentage ?? 70,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return entityRepository.create(entity);
  }

  updateEntity(id: string, dto: UpdateClubEntityDTO): ClubEntity | undefined {
    return entityRepository.update(id, dto);
  }

  deleteEntity(id: string): boolean {
    return entityRepository.delete(id);
  }
}

export const entityService = new EntityService();
