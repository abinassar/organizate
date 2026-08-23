export interface Transaccion {
  id?: string;
  operationId?: string; // Binance P2P order number (optional for manual transactions)
  objetivoId: string;   // Associated financial goal ID
  amount: number;       // Amount of the transaction
  currency: string;     // Currency code: USDT, EUR, BS, etc.
  description: string;  // Description of the transaction
  createdAt?: Date;
  updatedAt?: Date;
  active: boolean;
}
