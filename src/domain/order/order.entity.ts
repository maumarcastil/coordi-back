export type OrderStatus =
	| "pending"
	| "confirmed"
	| "in_transit"
	| "delivered"
	| "cancelled";

export interface Order {
	id: string;
	quoteId: number;
	userId: number;

	// Datos del envío
	originCityId: number;
	destinationCityId: number;
	weight: number;
	length: number;
	width: number;
	height: number;
	volumetricWeight: number;
	chargeableWeight: number;
	totalPrice: number;

	// Estado
	trackingNumber: string | null;
	currentStatus: OrderStatus;

	// Remitente
	senderName: string;
	senderPhone: string;
	senderAddress: string;

	// Destinatario
	recipientName: string;
	recipientPhone: string;
	recipientAddress: string;

	// Adicional
	packageDescription: string | null;
	estimatedDeliveryDate: Date | null;
	deliveredAt: Date | null;
	cancelledAt: Date | null;

	createdAt: Date;
	updatedAt: Date;
}

export interface CreateOrderInput {
	quoteId: number;
	senderName: string;
	senderPhone: string;
	senderAddress: string;
	recipientName: string;
	recipientPhone: string;
	recipientAddress: string;
	packageDescription?: string;
}

export interface CreateOrderData {
	quoteId: number;
	userId: number;
	originCityId: number;
	destinationCityId: number;
	weight: number;
	length: number;
	width: number;
	height: number;
	volumetricWeight: number;
	chargeableWeight: number;
	totalPrice: number;
	trackingNumber: string | null;
	currentStatus: OrderStatus;
	senderName: string;
	senderPhone: string;
	senderAddress: string;
	recipientName: string;
	recipientPhone: string;
	recipientAddress: string;
	packageDescription: string | null;
	estimatedDeliveryDate: Date | null;
}

export interface OrderListItem extends Order {
	originCityName: string;
	destinationCityName: string;
}
