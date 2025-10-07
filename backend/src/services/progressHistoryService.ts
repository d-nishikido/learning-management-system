import { PrismaClient, ProgressHistory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

let prisma = new PrismaClient();

/**
 * 進捗履歴作成データの型定義
 */
export interface CreateProgressHistoryData {
  progressId: number;
  progressRate: number;
  spentMinutes: number;
  changedBy: number;
  notes?: string;
}

/**
 * 進捗履歴サービス
 * メイン教材の進捗履歴の作成、取得、削除を管理
 */
export class ProgressHistoryService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }
  /**
   * 進捗履歴を作成
   * @param data 進捗履歴作成データ
   * @returns 作成された進捗履歴
   */
  async createHistory(
    data: CreateProgressHistoryData
  ): Promise<ProgressHistory> {
    return await this.prisma.progressHistory.create({
      data: {
        progressId: data.progressId,
        progressRate: new Decimal(data.progressRate),
        spentMinutes: data.spentMinutes,
        changedBy: data.changedBy,
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  /**
   * 指定されたprogressIdの進捗履歴を全て取得
   * @param progressId 進捗ID
   * @returns 進捗履歴の配列（作成日時降順）
   */
  async getHistoryByProgressId(progressId: number): Promise<ProgressHistory[]> {
    return await this.prisma.progressHistory.findMany({
      where: { progressId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 指定されたユーザーの進捗履歴を全て取得
   * @param userId ユーザーID
   * @returns 進捗履歴の配列（作成日時降順）
   */
  async getHistoryByUserId(userId: number): Promise<ProgressHistory[]> {
    return await this.prisma.progressHistory.findMany({
      where: { changedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 指定されたprogressIdの最新の進捗履歴を取得
   * @param progressId 進捗ID
   * @returns 最新の進捗履歴、存在しない場合はnull
   */
  async getLatestHistory(progressId: number): Promise<ProgressHistory | null> {
    return await this.prisma.progressHistory.findFirst({
      where: { progressId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 指定されたprogressIdの進捗履歴を全て削除
   * @param progressId 進捗ID
   * @returns 削除された件数
   */
  async deleteHistoryByProgressId(progressId: number): Promise<number> {
    const result = await this.prisma.progressHistory.deleteMany({
      where: { progressId },
    });
    return result.count;
  }

  /**
   * 教材IDとユーザーIDから進捗履歴を取得
   * @param materialId 教材ID
   * @param userId ユーザーID
   * @returns 進捗履歴の配列（作成日時降順）
   */
  async getHistoryByMaterialId(
    materialId: number,
    userId: number
  ): Promise<ProgressHistory[]> {
    return await this.prisma.progressHistory.findMany({
      where: {
        progress: {
          materialId,
          userId,
        },
      },
      include: {
        progress: {
          select: {
            id: true,
            userId: true,
            materialId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
