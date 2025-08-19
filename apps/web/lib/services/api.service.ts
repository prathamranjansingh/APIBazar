import { z } from "zod";
import { apiRepository, ApiWithDetails } from "@/lib/db/api.repository";
import { endpointRepository } from "@/lib/db/endpoint.repository";
import { purchasedApiRepository } from "@/lib/db/purchasedApi.repository";
import { transactionRepository } from "@/lib/db/transaction.repository";
import { listApisSchema, apiSchema, updateApiSchema } from "@/lib/zod/schemas/api.schema";
import { endpointSchema, updateEndpointSchema } from "@/lib/zod/schemas/endpoint.schema";
import { getCachedData, cacheData, invalidateCacheByPattern, invalidateCache } from "@/lib/upstash";
import { logger } from "@apibazar/utils";
import { ForbiddenError, NotFoundError, BadRequestError } from "@/lib/utils/errors";

const notificationService = { create: async (p: any) => logger.info("Notification created", p) };
const webhookService = { trigger: async (p: any) => logger.info("Webhook triggered", p) };

const CACHE_TTL = { SHORT: 60, MEDIUM: 300, LONG: 3600 };

export const apiService = {
  async getApis(params: z.infer<typeof listApisSchema>) {
    const cacheKey = `apis:list:${params.category || "all"}:${params.search || "none"}:${params.page}:${params.limit}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) return cached;

    const { data, total } = await apiRepository.findManyWithFilters(params, params);
    const totalPages = Math.ceil(total / params.limit);
    const result = {
      data,
      pagination: { ...params, total, totalPages, hasNextPage: params.page < totalPages, hasPrevPage: params.page > 1 },
    };
    cacheData(cacheKey, result, params.search ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM).catch(e => logger.error("Cache set failed", e));
    return result;
  },

  async createApi(data: z.infer<typeof apiSchema>, ownerId: string) {
    const newApi = await apiRepository.create(data, ownerId);
    Promise.all([
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${ownerId}:apis`)
    ]).catch(e => logger.error("Cache invalidation failed", e));
    return newApi;
  },

  async getApiById(id: string) {
    const cacheKey = `api:${id}`;
    const cached = await getCachedData<ApiWithDetails>(cacheKey);
    if (cached) return cached;
    const api = await apiRepository.findById(id);
    if (!api) throw new NotFoundError("API not found");
    cacheData(cacheKey, api, CACHE_TTL.MEDIUM).catch(e => logger.error("Cache set failed", e));
    return api;
  },

  async updateApi(id: string, data: z.infer<typeof updateApiSchema>, userId: string) {
    const api = await apiRepository.findById(id);
    if (!api) throw new NotFoundError("API not found");
    if (api.owner.id !== userId) throw new ForbiddenError();
    const updatedApi = await apiRepository.update(id, data);
    
    const invalidationTasks = [
        invalidateCache(`api:${id}`),
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${userId}:apis`),
        ...api.purchasedBy.map(p => invalidateCache(`user:${p.userId}:purchased`))
    ];
    Promise.all(invalidationTasks).catch(e => logger.error("Cache invalidation failed", e));
    
    // Fire-and-forget side effects
    const purchaserIds = api.purchasedBy.map(p => p.userId);
    if (purchaserIds.length > 0) {
        notificationService.create({ userIds: purchaserIds, message: `API "${updatedApi.name}" has been updated.` });
        webhookService.trigger({ apiId: updatedApi.id, event: "API_UPDATED" });
    }
    
    return updatedApi;
  },

  async deleteApi(id: string, userId: string) {
    const api = await apiRepository.findById(id);
    if (!api) throw new NotFoundError("API not found");
    if (api.owner.id !== userId) throw new ForbiddenError();
    await apiRepository.delete(id);
    
    const invalidationTasks = [
        invalidateCache(`api:${id}`),
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${userId}:apis`),
        ...api.purchasedBy.map(p => invalidateCache(`user:${p.userId}:purchased`))
    ];
    Promise.all(invalidationTasks).catch(e => logger.error("Cache invalidation failed", e));
  },
  
  async getMyApis(userId: string) {
      const cacheKey = `user:${userId}:apis`;
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached) return cached;
      const apis = await apiRepository.findByOwnerId(userId);
      cacheData(cacheKey, apis, CACHE_TTL.MEDIUM).catch(e => logger.error("Cache set failed", e));
      return apis;
  },
  
  async getPurchasedApis(userId: string) {
      const cacheKey = `user:${userId}:purchased`;
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached) return cached;
      const apis = await purchasedApiRepository.findByUserId(userId);
      cacheData(cacheKey, apis, CACHE_TTL.LONG).catch(e => logger.error("Cache set failed", e));
      return apis;
  },
  
  async addEndpoint(apiId: string, data: z.infer<typeof endpointSchema>, userId: string) {
      const api = await apiRepository.findById(apiId);
      if (!api) throw new NotFoundError("API not found");
      if (api.owner.id !== userId) throw new ForbiddenError();

      const existing = await endpointRepository.findByPathAndMethod(apiId, data.path, data.method);
      if (existing) throw new BadRequestError(`Endpoint ${data.method} ${data.path} already exists.`);

      const endpoint = await endpointRepository.create(data, apiId);
      this.invalidateApiCaches(api);
      return endpoint;
  },

  async updateEndpoint(apiId: string, endpointId: string, data: z.infer<typeof updateEndpointSchema>, userId: string) {
      const api = await apiRepository.findById(apiId);
      if (!api) throw new NotFoundError("API not found");
      if (api.owner.id !== userId) throw new ForbiddenError();
      
      const endpoint = await endpointRepository.findById(endpointId);
      if (!endpoint || endpoint.apiId !== apiId) throw new NotFoundError("Endpoint not found on this API.");
      
      const updatedEndpoint = await endpointRepository.update(endpointId, data);
      this.invalidateApiCaches(api);
      webhookService.trigger({ apiId, event: "ENDPOINT_UPDATED", payload: updatedEndpoint });
      return updatedEndpoint;
  },

  async deleteEndpoint(apiId: string, endpointId: string, userId: string) {
      const api = await apiRepository.findById(apiId);
      if (!api) throw new NotFoundError("API not found");
      if (api.owner.id !== userId) throw new ForbiddenError();

      const endpoint = await endpointRepository.findById(endpointId);
      if (!endpoint || endpoint.apiId !== apiId) throw new NotFoundError("Endpoint not found on this API.");

      await endpointRepository.delete(endpointId);
      this.invalidateApiCaches(api);
  },

  invalidateApiCaches(api: ApiWithDetails) {
    const invalidationTasks = [
        invalidateCache(`api:${api.id}`),
        invalidateCache(`user:${api.owner.id}:apis`),
        ...api.purchasedBy.map(p => invalidateCache(`user:${p.userId}:purchased`))
    ];
    Promise.all(invalidationTasks).catch(e => logger.error("Cache invalidation failed", e));
  }
};