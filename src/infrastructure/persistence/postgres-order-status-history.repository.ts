import type { Pool } from "pg";

import type {
	CreateStatusHistoryData,
	OrderStatusHistory,
} from "@domain/order/order-status-history.entity.js";
import type { IOrderStatusHistoryRepository } from "@domain/order/order-status-history.repository.js";
import type { OrderStatus } from "@domain/order/order.entity.js";

interface StatusHistoryRow {
	id: string;
	order_id: string;
	status: OrderStatus;
	notes: string | null;
	location: string | null;
	changed_by_user_id: number | null;
	changed_by_system: boolean;
	created_at: Date;
}

export class PostgresOrderStatusHistoryRepository
	implements IOrderStatusHistoryRepository
{
	constructor(private readonly pool: Pool) {}

	async create(data: CreateStatusHistoryData): Promise<OrderStatusHistory> {
		const result = await this.pool.query<StatusHistoryRow>(
			`INSERT INTO order_status_history (
				order_id, status, notes, location,
				changed_by_user_id, changed_by_system
			) VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING *`,
			[
				data.orderId,
				data.status,
				data.notes || null,
				data.location || null,
				data.changedByUserId || null,
				data.changedBySystem ?? false,
			],
		);

		return this.mapToStatusHistory(result.rows[0]);
	}

	async findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
		const result = await this.pool.query<StatusHistoryRow>(
			`SELECT * FROM order_status_history 
			 WHERE order_id = $1 
			 ORDER BY created_at ASC`,
			[orderId],
		);

		return result.rows.map((row) => this.mapToStatusHistory(row));
	}

	private mapToStatusHistory(row: StatusHistoryRow): OrderStatusHistory {
		return {
			id: row.id,
			orderId: row.order_id,
			status: row.status,
			notes: row.notes,
			location: row.location,
			changedByUserId: row.changed_by_user_id,
			changedBySystem: row.changed_by_system,
			createdAt: row.created_at,
		};
	}
}

