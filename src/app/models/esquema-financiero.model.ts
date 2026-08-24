export interface EsquemaObjetivoConfig {
  objetivoId: string;
  operator: 'sum' | 'subtract'; // sum: sumar (+), subtract: restar (-)
}

export interface EsquemaFinanciero {
  id?: string;
  name: string;
  description: string;
  configs: EsquemaObjetivoConfig[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
