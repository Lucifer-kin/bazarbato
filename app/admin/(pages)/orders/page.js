import dbConnect from "@/helpers/dbConnect";
import Order from "@/models/Order";
import { deepCopy } from "@/helpers/utils";
import Link from "next/link";
import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";
import Card from "@/components/Card/Card";
import { formatDate } from "@/helpers/utils";
import TableFoot from "@/components/_admin/TableFoot/TableFoot";

async function fetchOrders(skip, limit) {
  try {
    await dbConnect();
    const [orders, totalCount] = await Promise.all([
      Order.find().skip(skip).limit(limit).populate("user", "email").lean(),
      Order.countDocuments(),
    ]);
    return { orders: deepCopy(orders), totalCount };
  } catch (error) {
    return [];
  }
}
export default async function Orders({
  searchParams: { page = 1, perPage = 10 },
}) {
  const skip = (page - 1) * perPage;
  const limit = perPage;
  const { orders, totalCount } = await fetchOrders(skip, limit);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h1>Orders</h1>
      </div>
      <Card className={styles.card}>
        <input
          type="text"
          placeholder="Search"
          className={`${formStyles.input} ${styles.search}`}
        />
        <select className={`${formStyles.select}`}>
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="not-paid">Not paid</option>
        </select>
        <select className={`${formStyles.select} ${styles.sort}`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.order_number}>Order number</th>
              <th className={styles.date}>Date</th>
              <th className={styles.email}>Customer email</th>
              <th className={styles.shipment_status}>Shipment status</th>
              <th className={styles.payment_status}>Payment status</th>
              <th className={styles.total}>total</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order, i) => (
              <tr key={order._id}>
                <td className={styles.order_number}>
                  <Link href={`/admin/orders/${order._id}`}>{order._id}</Link>
                </td>
                <td className={styles.date}>{formatDate(order.placedAt)}</td>
                <td className={styles.email}>{order.user.email}</td>
                <td className={styles.shipment_status}>
                  <span
                    className={
                      order.orderStatus === "PROCESSING"
                        ? styles.processing
                        : order.orderStatus === "SHIPPED"
                        ? styles.shipped
                        : styles.delivered
                    }
                  >
                    {order.orderStatus.toLowerCase()}
                  </span>
                </td>
                <td className={styles.payment_status}>
                  <span
                    className={
                      order.paymentStatus === "PAID"
                        ? styles.paid
                        : styles.processing
                    }
                  >
                    {order.paymentStatus.toLowerCase()}
                  </span>
                </td>
                <td className={styles.total}>Rs. {order.grossTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <TableFoot total={totalCount} />
      </Card>
    </div>
  );
}
