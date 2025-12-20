import type { Pool } from "pg";

import type {
	CreateOrderData,
	Order,
	OrderListItem,
	OrderStatus,
} from "@domain/order/order.entity.js";
import type { IOrderRepository } from "@domain/order/order.repository.js";

interface OrderRow {
	id: string;
	quote_id: number;
	user_id: number;
	origin_city_id: number;
	destination_city_id: number;
	weight: string;
	length: string;
	width: string;
	height: string;
	volumetric_weight: string;
	chargeable_weight: string;
	total_price: string;
	tracking_number: string | null;
	current_status: OrderStatus;
	sender_name: string;
	sender_phone: string;
	sender_address: string;
	recipient_name: string;
	recipient_phone: string;
	recipient_address: string;
	package_description: string | null;
	estimated_delivery_date: Date | null;
	delivered_at: Date | null;
	cancelled_at: Date | null;
	created_at: Date;
	updated_at: Date;
}

interface OrderListItemRow extends OrderRow {
	origin_city_name: string;
	destination_city_name: string;
}

export class PostgresOrderRepository implements IOrderRepository {
	constructor(private readonly pool: Pool) {}

	async create(data: CreateOrderData): Promise<Order> {
		const result = await this.pool.query<OrderRow>(
			`INSERT INTO orders (
				quote_id, user_id, origin_city_id, destination_city_id,
				weight, length, width, height,
				volumetric_weight, chargeable_weight, total_price,
				tracking_number, current_status,
				sender_name, sender_phone, sender_address,
				recipient_name, recipient_phone, recipient_address,
				package_description, estimated_delivery_date
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
			RETURNING *`,
			[
				data.quoteId,
				data.userId,
				data.originCityId,
				data.destinationCityId,
				data.weight,
				data.length,
				data.width,
				data.height,
				data.volumetricWeight,
				data.chargeableWeight,
				data.totalPrice,
				data.trackingNumber,
				data.currentStatus,
				data.senderName,
				data.senderPhone,
				data.senderAddress,
				data.recipientName,
				data.recipientPhone,
				data.recipientAddress,
				data.packageDescription,
				data.estimatedDeliveryDate,
			],
		);

		return this.mapToOrder(result.rows[0]);
	}

	async findById(id: string): Promise<Order | null> {
		const result = await this.pool.query<OrderRow>(
			"SELECT * FROM orders WHERE id = $1",
			[id],
		);

		return result.rows[0] ? this.mapToOrder(result.rows[0]) : null;
	}

	async findByUserId(userId: number): Promise<Order[]> {
		const result = await this.pool.query<OrderRow>(
			"SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
			[userId],
		);

		return result.rows.map((row) => this.mapToOrder(row));
	}

	async findAllByUserId(userId: number): Promise<OrderListItem[]> {
		const result = await this.pool.query<OrderListItemRow>(
			`SELECT o.*,
				oc.name as origin_city_name,
				dc.name as destination_city_name
			FROM orders o
			JOIN cities oc ON o.origin_city_id = oc.id
			JOIN cities dc ON o.destination_city_id = dc.id
			WHERE o.user_id = $1
			ORDER BY o.created_at DESC`,
			[userId],
		);

		return result.rows.map((row) => this.mapToOrderListItem(row));
	}

	async findByQuoteId(quoteId: number): Promise<Order | null> {
		const result = await this.pool.query<OrderRow>(
			"SELECT * FROM orders WHERE quote_id = $1",
			[quoteId],
		);

		return result.rows[0] ? this.mapToOrder(result.rows[0]) : null;
	}

	private mapToOrder(row: OrderRow): Order {
		return {
			id: row.id,
			quoteId: row.quote_id,
			userId: row.user_id,
			originCityId: row.origin_city_id,
			destinationCityId: row.destination_city_id,
			weight: Number.parseFloat(row.weight),
			length: Number.parseFloat(row.length),
			width: Number.parseFloat(row.width),
			height: Number.parseFloat(row.height),
			volumetricWeight: Number.parseFloat(row.volumetric_weight),
			chargeableWeight: Number.parseFloat(row.chargeable_weight),
			totalPrice: Number.parseFloat(row.total_price),
			trackingNumber: row.tracking_number,
			currentStatus: row.current_status,
			senderName: row.sender_name,
			senderPhone: row.sender_phone,
			senderAddress: row.sender_address,
			recipientName: row.recipient_name,
			recipientPhone: row.recipient_phone,
			recipientAddress: row.recipient_address,
			packageDescription: row.package_description,
			estimatedDeliveryDate: row.estimated_delivery_date,
			deliveredAt: row.delivered_at,
			cancelledAt: row.cancelled_at,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}

	private mapToOrderListItem(row: OrderListItemRow): OrderListItem {
		return {
			...this.mapToOrder(row),
			originCityName: row.origin_city_name,
			destinationCityName: row.destination_city_name,
		};
	}
}
