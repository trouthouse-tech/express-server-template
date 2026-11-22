export type DispatcherExposedEndpoint = {
  id: string;
  projectId: string;
  serviceId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  requiresBody: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type InsertDispatcherExposedEndpointInput = {
  id: string;
  projectId: string;
  serviceId: string;
  method: DispatcherExposedEndpoint['method'];
  path: string;
  summary: string;
  requiresBody?: boolean;
  enabled?: boolean;
  sortOrder?: number;
};

export type UpdateDispatcherExposedEndpointInput = {
  serviceId?: string;
  method?: DispatcherExposedEndpoint['method'];
  path?: string;
  summary?: string;
  requiresBody?: boolean;
  enabled?: boolean;
  sortOrder?: number;
};
