export interface Aviso {
  name: string;
  description: string;
  percentage: number; // Guardado como decimal (ej. 0.8 para 80%)
}

export interface Objetivo {
  id?: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  typeId: string;
  typeCode?: string;
  periodicityId: string;
  amount: number;
  unitId: string;
  startDate?: Date;
  endDate?: Date;
  alerts: Aviso[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
